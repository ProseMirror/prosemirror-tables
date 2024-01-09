import { Attrs, Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  NodeView,
} from 'prosemirror-view';
import { tableNodeTypes } from './schema';
import { TableMap } from './tablemap';
import { TableView, updateColumnsOnResize } from './tableview';
import { cellAround, CellAttrs, pointsAtCell } from './util';

/**
 * @public
 */
export const columnResizingPluginKey = new PluginKey<ResizeState>(
  'tableColumnResizing',
);

/**
 * @public
 */
export type ColumnResizingOptions = {
  handleWidth?: number;
  cellMinWidth?: number;
  lastColumnResizable?: boolean;
  View?: new (
    node: ProsemirrorNode,
    cellMinWidth: number,
    view: EditorView,
  ) => NodeView;
};

/**
 * @public
 */
export type Dragging = { startX: number; startWidth: number; offset: number };

/**
 * @public
 */
export function columnResizing({
  handleWidth = 5,
  cellMinWidth = 25,
  View = TableView,
  lastColumnResizable = true,
}: ColumnResizingOptions = {}): Plugin {
  const plugin = new Plugin<ResizeState>({
    key: columnResizingPluginKey,
    state: {
      init(_, state) {
        plugin.spec!.props!.nodeViews![
          tableNodeTypes(state.schema).table.name
        ] = (node, view) => new View(node, cellMinWidth, view);
        return new ResizeState(-1, false);
      },
      apply(tr, prev) {
        return prev.apply(tr);
      },
    },
    props: {
      attributes: (state): Record<string, string> => {
        const pluginState = columnResizingPluginKey.getState(state);
        return pluginState && pluginState.activeHandle > -1
          ? { class: 'resize-cursor' }
          : {};
      },

      handleDOMEvents: {
        mousemove: (view, event) => {
          handleMouseMove(
            view,
            event,
            handleWidth,
            cellMinWidth,
            lastColumnResizable,
          );
        },
        mouseleave: (view) => {
          handleMouseLeave(view);
        },
        mousedown: (view, event) => {
          handleMouseDown(view, event, cellMinWidth);
        },
      },

      decorations: (state) => {
        const pluginState = columnResizingPluginKey.getState(state);

        if (pluginState && pluginState.activeHandle > -1) {
          return handleDecorations(
            state,
            pluginState.activeHandle,
            pluginState.dragging ? pluginState.dragging.offset : 0,
          );
        }
      },

      nodeViews: {},
    },
  });
  return plugin;
}

/**
 * @public
 */
export class ResizeState {
  constructor(public activeHandle: number, public dragging: Dragging | false) {}

  apply(tr: Transaction): ResizeState {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const state = this;
    const action = tr.getMeta(columnResizingPluginKey);

    if (action && action.setHandle != null) {
      return new ResizeState(action.setHandle, false);
    }

    if (action && action.setDragging !== undefined) {
      return new ResizeState(state.activeHandle, action.setDragging);
    }

    if (state.dragging && action && action.setDraggingOffset !== undefined) {
      return new ResizeState(state.activeHandle, {
        ...state.dragging,
        offset: action.setDraggingOffset,
      });
    }

    if (state.activeHandle > -1 && tr.docChanged) {
      let handle = tr.mapping.map(state.activeHandle, -1);
      if (!pointsAtCell(tr.doc.resolve(handle))) {
        handle = -1;
      }

      return new ResizeState(handle, state.dragging);
    }

    return state;
  }
}

function handleMouseMove(
  view: EditorView,
  event: MouseEvent,
  handleWidth: number,
  cellMinWidth: number,
  lastColumnResizable: boolean,
): void {
  const pluginState = columnResizingPluginKey.getState(view.state);
  if (!pluginState) return;

  if (!pluginState.dragging) {
    const target = domCellAround(event.target as HTMLElement);
    let cell = -1;
    if (target) {
      const { left, right } = target.getBoundingClientRect();
      if (event.clientX - left <= handleWidth)
        cell = edgeCell(view, event, 'left', handleWidth);
      else if (right - event.clientX <= handleWidth)
        cell = edgeCell(view, event, 'right', handleWidth);
    }

    if (cell != pluginState.activeHandle) {
      if (!lastColumnResizable && cell !== -1) {
        const $cell = view.state.doc.resolve(cell);
        const table = $cell.node(-1);
        const map = TableMap.get(table);
        const tableStart = $cell.start(-1);
        const col =
          map.colCount($cell.pos - tableStart) +
          $cell.nodeAfter!.attrs.colspan -
          1;

        if (col == map.width - 1) {
          return;
        }
      }

      updateHandle(view, cell);
    }
  }
}

function handleMouseLeave(view: EditorView): void {
  const pluginState = columnResizingPluginKey.getState(view.state);
  if (pluginState && pluginState.activeHandle > -1 && !pluginState.dragging)
    updateHandle(view, -1);
}

function getSiblingWidths({
  view,
  cell,
  handlePos,
}: {
  view: EditorView;
  cell: ProsemirrorNode;
  handlePos: number;
}): { previousSiblingWidth: number | null; nextSiblingWidth: number | null } {
  const cellPosition = view.state.doc.resolve(handlePos);
  const cellParent = cellPosition.parent;

  let previousSibling: undefined | ProsemirrorNode;
  let previousSiblingPos: undefined | number;
  let nextSibling: undefined | ProsemirrorNode;
  let nextSiblingPos: undefined | number;

  cellParent.forEach((node, _offset, index) => {
    if (node === cell) {
      if (index > 0) {
        previousSibling = cellParent.child(index - 1);
        previousSiblingPos =
          cellPosition.pos - (cellPosition.nodeBefore?.nodeSize ?? 0);
      }

      nextSibling = cellParent.maybeChild(index + 1) ?? undefined;
      nextSiblingPos =
        cellPosition.pos + (cellPosition.nodeAfter?.nodeSize ?? 0);
    }
  });

  const previousSiblingWidth =
    previousSibling && previousSiblingPos
      ? currentColWidth(view, previousSiblingPos, previousSibling.attrs)
      : null;

  const nextSiblingWidth =
    nextSibling && nextSiblingPos
      ? currentColWidth(view, nextSiblingPos, nextSibling.attrs)
      : null;

  return {
    previousSiblingWidth,
    nextSiblingWidth,
  };
}

function handleMouseDown(
  view: EditorView,
  event: MouseEvent,
  cellMinWidth: number,
): boolean {
  const pluginState = columnResizingPluginKey.getState(view.state);
  if (!pluginState || pluginState.activeHandle == -1 || pluginState.dragging)
    return false;

  const cell = view.state.doc.nodeAt(pluginState.activeHandle)!;
  const width = currentColWidth(view, pluginState.activeHandle, cell.attrs);
  const { nextSiblingWidth } = getSiblingWidths({
    view,
    cell,
    handlePos: pluginState.activeHandle,
  });

  updateDragging(view, { startX: event.clientX, startWidth: width, offset: 0 });

  function finish(event: MouseEvent) {
    window.removeEventListener('mouseup', finish);
    window.removeEventListener('mousemove', move);
    const pluginState = columnResizingPluginKey.getState(view.state);
    if (pluginState?.dragging) {
      const offset = dragOffset({
        event: event,
        startX: pluginState.dragging.startX,
        cellMinWidth,
        cellWidth: width,
        nextSiblingWidth,
      });

      updateColumnWidth({
        view: view,
        cell: pluginState.activeHandle,
        width: draggedWidth({
          dragging: pluginState.dragging,
          cellMinWidth,
          offset,
        }),
        offset,
        nextSiblingWidth,
      });
      updateDragging(view, false);
    }
  }

  function move(event: MouseEvent): void {
    if (!event.which) return finish(event);
    const pluginState = columnResizingPluginKey.getState(view.state);
    if (!pluginState) return;
    if (pluginState.dragging) {
      const offset = dragOffset({
        event: event,
        startX: pluginState.dragging.startX,
        cellMinWidth,
        cellWidth: width,
        nextSiblingWidth,
      });
      updateDraggingOffset(view, offset);
    }
  }

  window.addEventListener('mouseup', finish);
  window.addEventListener('mousemove', move);
  event.preventDefault();
  return true;
}

function currentColWidth(
  view: EditorView,
  cellPos: number,
  { colspan, colwidth }: Attrs,
): number {
  const width = colwidth && colwidth[colwidth.length - 1];
  if (width) return width;
  const dom = view.domAtPos(cellPos);
  const node = dom.node.childNodes[dom.offset] as HTMLElement;
  let domWidth = node.offsetWidth,
    parts = colspan;
  if (colwidth)
    for (let i = 0; i < colspan; i++)
      if (colwidth[i]) {
        domWidth -= colwidth[i];
        parts--;
      }
  return domWidth / parts;
}

function domCellAround(target: HTMLElement | null): HTMLElement | null {
  while (target && target.nodeName != 'TD' && target.nodeName != 'TH')
    target =
      target.classList && target.classList.contains('ProseMirror')
        ? null
        : (target.parentNode as HTMLElement);
  return target;
}

function edgeCell(
  view: EditorView,
  event: MouseEvent,
  side: 'left' | 'right',
  handleWidth: number,
): number {
  // posAtCoords returns inconsistent positions when cursor is moving
  // across a collapsed table border. Use an offset to adjust the
  // target viewport coordinates away from the table border.
  const offset = side == 'right' ? -handleWidth : handleWidth;
  const found = view.posAtCoords({
    left: event.clientX + offset,
    top: event.clientY,
  });
  if (!found) return -1;
  const { pos } = found;
  const $cell = cellAround(view.state.doc.resolve(pos));
  if (!$cell) return -1;
  if (side == 'right') return $cell.pos;
  const map = TableMap.get($cell.node(-1)),
    start = $cell.start(-1);
  const index = map.map.indexOf($cell.pos - start);
  return index % map.width == 0 ? -1 : start + map.map[index - 1];
}

function dragOffset({
  event,
  startX,
  cellMinWidth = 25,
  cellWidth,
  nextSiblingWidth,
}: {
  event: MouseEvent;
  startX: number;
  cellMinWidth: number;
  cellWidth?: number | null;
  nextSiblingWidth?: number | null;
}): number {
  const offset = event.clientX - startX;

  if (
    nextSiblingWidth &&
    offset > 0 &&
    offset > nextSiblingWidth - cellMinWidth
  ) {
    return nextSiblingWidth - cellMinWidth;
  }

  if (cellWidth && offset < 0 && Math.abs(offset) > cellWidth - cellMinWidth) {
    return -(cellWidth - cellMinWidth);
  }

  return offset;
}

function draggedWidth({
  dragging,
  offset,
  cellMinWidth = 25,
}: {
  dragging: Dragging;
  offset: number;
  cellMinWidth: number;
}): number {
  return Math.max(cellMinWidth, dragging.startWidth + offset);
}

type ResizeStateParams = ConstructorParameters<typeof ResizeState>;

function updateHandle(view: EditorView, value: ResizeStateParams[0]): void {
  view.dispatch(
    view.state.tr.setMeta(columnResizingPluginKey, { setHandle: value }),
  );
}

function updateDragging(view: EditorView, value: ResizeStateParams[1]): void {
  view.dispatch(
    view.state.tr.setMeta(columnResizingPluginKey, { setDragging: value }),
  );
}

function updateDraggingOffset(view: EditorView, value: number): void {
  view.dispatch(
    view.state.tr.setMeta(columnResizingPluginKey, {
      setDraggingOffset: value,
    }),
  );
}

function setColWidth({
  map,
  col,
  table,
  width,
  tr,
  start,
}: {
  map: TableMap;
  col: number;
  table: ProsemirrorNode;
  width: number;
  tr: Transaction;
  start: number;
}) {
  for (let row = 0; row < map.height; row++) {
    const mapIndex = row * map.width + col;
    // Rowspanning cell that has already been handled
    if (row && map.map[mapIndex] == map.map[mapIndex - map.width]) continue;
    const pos = map.map[mapIndex];
    const attrs = table.nodeAt(pos)!.attrs as CellAttrs;
    const index = attrs.colspan == 1 ? 0 : col - map.colCount(pos);
    if (attrs.colwidth && attrs.colwidth[index] == width) continue;
    const colwidth = attrs.colwidth
      ? attrs.colwidth.slice()
      : zeroes(attrs.colspan);
    colwidth[index] = width;
    tr.setNodeMarkup(start + pos, null, { ...attrs, colwidth: colwidth });
  }
}

function updateColumnWidth({
  view,
  cell,
  width,
  offset,
  nextSiblingWidth,
}: {
  view: EditorView;
  cell: number;
  width: number;
  offset: number;
  nextSiblingWidth: number | null;
}): void {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-1),
    map = TableMap.get(table),
    start = $cell.start(-1);
  const col =
    map.colCount($cell.pos - start) + $cell.nodeAfter!.attrs.colspan - 1;
  const tr = view.state.tr;

  setColWidth({
    map: map,
    col: col,
    table: table,
    width: width,
    tr: tr,
    start: start,
  });

  if (nextSiblingWidth !== null && offset) {
    setColWidth({
      map: map,
      col: col + 1,
      table: table,
      width: nextSiblingWidth - offset,
      tr: tr,
      start: start,
    });
  }

  if (tr.docChanged) view.dispatch(tr);
}

function zeroes(n: number): 0[] {
  return Array(n).fill(0);
}

export function handleDecorations(
  state: EditorState,
  cell: number,
  offset = 0,
): DecorationSet {
  const decorations = [];
  const $cell = state.doc.resolve(cell);
  const table = $cell.node(-1);

  if (!table) {
    return DecorationSet.empty;
  }

  const map = TableMap.get(table);
  const start = $cell.start(-1);
  const col = map.colCount($cell.pos - start) + $cell.nodeAfter!.attrs.colspan;
  for (let row = 0; row < map.height; row++) {
    const index = col + row * map.width - 1;
    // For positions that have either a different cell or the end
    // of the table to their right, and either the top of the table or
    // a different cell above them, add a decoration
    if (
      (col == map.width || map.map[index] != map.map[index + 1]) &&
      (row == 0 || map.map[index] != map.map[index - map.width])
    ) {
      const cellPos = map.map[index];
      const pos = start + cellPos + table.nodeAt(cellPos)!.nodeSize - 1;

      const dom = document.createElement('div');
      dom.classList.add('column-resize-handle');
      dom.style.right = `${-offset}px`;

      decorations.push(Decoration.widget(pos, dom));
    }
  }
  return DecorationSet.create(state.doc, decorations);
}
