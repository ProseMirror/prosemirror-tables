import { EditorState, Plugin, PluginKey } from 'prosemirror-state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  NodeView,
} from 'prosemirror-view';
import { cellAround, pointsAtCell, setAttr } from './util';
import { TableMap } from './tablemap';
import { TableView, updateColumnsOnResize } from './tableview';
import { tableNodeTypes } from './schema';
import { Attrs, Node as ProsemirrorNode } from 'prosemirror-model';

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
export type Dragging = { startX: number; startWidth: number };

/**
 * @public
 */
export function columnResizing({
  handleWidth = 5,
  cellMinWidth = 25,
  View = TableView,
  lastColumnResizable = true,
}: ColumnResizingOptions = {}): Plugin {
  let plugin = new Plugin({
    key: columnResizingPluginKey,
    state: {
      init(_, state) {
        this.spec.props.nodeViews[tableNodeTypes(state.schema).table.name] = (
          node,
          view,
        ) => new View(node, cellMinWidth, view);
        return new ResizeState(-1, false);
      },
      apply(tr, prev) {
        return prev.apply(tr);
      },
    },
    props: {
      attributes(state) {
        let pluginState = columnResizingPluginKey.getState(state);
        return pluginState.activeHandle > -1
          ? { class: 'resize-cursor' }
          : null;
      },

      handleDOMEvents: {
        mousemove(view, event) {
          handleMouseMove(
            view,
            event,
            handleWidth,
            cellMinWidth,
            lastColumnResizable,
          );
        },
        mouseleave(view) {
          handleMouseLeave(view);
        },
        mousedown(view, event) {
          handleMouseDown(view, event, cellMinWidth);
        },
      },

      decorations(state) {
        let pluginState = columnResizingPluginKey.getState(state);
        if (pluginState.activeHandle > -1)
          return handleDecorations(state, pluginState.activeHandle);
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

  apply(tr) {
    let state = this,
      action = tr.getMeta(columnResizingPluginKey);
    if (action && action.setHandle != null)
      return new ResizeState(action.setHandle, null);
    if (action && action.setDragging !== undefined)
      return new ResizeState(state.activeHandle, action.setDragging);
    if (state.activeHandle > -1 && tr.docChanged) {
      let handle = tr.mapping.map(state.activeHandle, -1);
      if (!pointsAtCell(tr.doc.resolve(handle))) handle = null;
      // @ts-ignore
      state = new ResizeState(handle, state.dragging);
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
  let pluginState = columnResizingPluginKey.getState(view.state);

  if (!pluginState.dragging) {
    let target = domCellAround(event.target as HTMLElement),
      cell = -1;
    if (target) {
      let { left, right } = target.getBoundingClientRect();
      if (event.clientX - left <= handleWidth)
        cell = edgeCell(view, event, 'left');
      else if (right - event.clientX <= handleWidth)
        cell = edgeCell(view, event, 'right');
    }

    if (cell != pluginState.activeHandle) {
      if (!lastColumnResizable && cell !== -1) {
        let $cell = view.state.doc.resolve(cell);
        let table = $cell.node(-1),
          map = TableMap.get(table),
          start = $cell.start(-1);
        let col =
          map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;

        if (col == map.width - 1) {
          return;
        }
      }

      updateHandle(view, cell);
    }
  }
}

function handleMouseLeave(view: EditorView): void {
  let pluginState = columnResizingPluginKey.getState(view.state);
  if (pluginState.activeHandle > -1 && !pluginState.dragging)
    updateHandle(view, -1);
}

function handleMouseDown(
  view: EditorView,
  event: MouseEvent,
  cellMinWidth: number,
): boolean {
  let pluginState = columnResizingPluginKey.getState(view.state);
  if (pluginState.activeHandle == -1 || pluginState.dragging) return false;

  let cell = view.state.doc.nodeAt(pluginState.activeHandle);
  let width = currentColWidth(view, pluginState.activeHandle, cell.attrs);
  view.dispatch(
    view.state.tr.setMeta(columnResizingPluginKey, {
      setDragging: { startX: event.clientX, startWidth: width },
    }),
  );

  function finish(event: MouseEvent) {
    window.removeEventListener('mouseup', finish);
    window.removeEventListener('mousemove', move);
    let pluginState = columnResizingPluginKey.getState(view.state);
    if (pluginState.dragging) {
      updateColumnWidth(
        view,
        pluginState.activeHandle,
        draggedWidth(pluginState.dragging, event, cellMinWidth),
      );
      view.dispatch(
        view.state.tr.setMeta(columnResizingPluginKey, { setDragging: null }),
      );
    }
  }

  function move(event: MouseEvent): void {
    if (!event.which) return finish(event);
    let pluginState = columnResizingPluginKey.getState(view.state);
    if (pluginState.dragging) {
      let dragged = draggedWidth(pluginState.dragging, event, cellMinWidth);
      displayColumnWidth(view, pluginState.activeHandle, dragged, cellMinWidth);
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
  let width = colwidth && colwidth[colwidth.length - 1];
  if (width) return width;
  let dom = view.domAtPos(cellPos);
  let node = dom.node.childNodes[dom.offset] as HTMLElement;
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

function domCellAround(target: HTMLElement): HTMLElement | null {
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
): number {
  let found = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if (!found) return -1;
  let { pos } = found;
  let $cell = cellAround(view.state.doc.resolve(pos));
  if (!$cell) return -1;
  if (side == 'right') return $cell.pos;
  let map = TableMap.get($cell.node(-1)),
    start = $cell.start(-1);
  let index = map.map.indexOf($cell.pos - start);
  return index % map.width == 0 ? -1 : start + map.map[index - 1];
}

function draggedWidth(
  dragging: Dragging,
  event: MouseEvent,
  cellMinWidth: number,
): number {
  let offset = event.clientX - dragging.startX;
  return Math.max(cellMinWidth, dragging.startWidth + offset);
}

function updateHandle(view: EditorView, value: number): void {
  view.dispatch(
    view.state.tr.setMeta(columnResizingPluginKey, { setHandle: value }),
  );
}

function updateColumnWidth(
  view: EditorView,
  cell: number,
  width: number,
): void {
  let $cell = view.state.doc.resolve(cell);
  let table = $cell.node(-1),
    map = TableMap.get(table),
    start = $cell.start(-1);
  let col = map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;
  let tr = view.state.tr;
  for (let row = 0; row < map.height; row++) {
    let mapIndex = row * map.width + col;
    // Rowspanning cell that has already been handled
    if (row && map.map[mapIndex] == map.map[mapIndex - map.width]) continue;
    let pos = map.map[mapIndex],
      { attrs } = table.nodeAt(pos);
    let index = attrs.colspan == 1 ? 0 : col - map.colCount(pos);
    if (attrs.colwidth && attrs.colwidth[index] == width) continue;
    let colwidth = attrs.colwidth
      ? attrs.colwidth.slice()
      : zeroes(attrs.colspan);
    colwidth[index] = width;
    tr.setNodeMarkup(start + pos, null, setAttr(attrs, 'colwidth', colwidth));
  }
  if (tr.docChanged) view.dispatch(tr);
}

function displayColumnWidth(
  view: EditorView,
  cell: number,
  width: number,
  cellMinWidth: number,
): void {
  let $cell = view.state.doc.resolve(cell);
  let table = $cell.node(-1),
    start = $cell.start(-1);
  let col =
    TableMap.get(table).colCount($cell.pos - start) +
    $cell.nodeAfter.attrs.colspan -
    1;
  let dom = view.domAtPos($cell.start(-1)).node;
  while (dom.nodeName != 'TABLE') dom = dom.parentNode;
  updateColumnsOnResize(
    table,
    dom.firstChild as HTMLTableColElement,
    dom as HTMLTableElement,
    cellMinWidth,
    col,
    width,
  );
}

function zeroes(n: number): 0[] {
  let result = [];
  for (let i = 0; i < n; i++) result.push(0);
  return result;
}

export function handleDecorations(
  state: EditorState,
  cell: number,
): DecorationSet {
  let decorations = [];
  let $cell = state.doc.resolve(cell);
  let table = $cell.node(-1);
  if (!table) {
    return DecorationSet.empty;
  }
  let map = TableMap.get(table);
  let start = $cell.start(-1);
  let col = map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan;
  for (let row = 0; row < map.height; row++) {
    let index = col + row * map.width - 1;
    // For positions that are have either a different cell or the end
    // of the table to their right, and either the top of the table or
    // a different cell above them, add a decoration
    if (
      (col == map.width || map.map[index] != map.map[index + 1]) &&
      (row == 0 || map.map[index - 1] != map.map[index - 1 - map.width])
    ) {
      let cellPos = map.map[index];
      let pos = start + cellPos + table.nodeAt(cellPos).nodeSize - 1;
      let dom = document.createElement('div');
      dom.className = 'column-resize-handle';
      decorations.push(Decoration.widget(pos, dom));
    }
  }
  return DecorationSet.create(state.doc, decorations);
}
