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
  /**
   * Minimum width of a cell /column. The column cannot be resized smaller than this.
   */
  cellMinWidth?: number;
  /**
   * The default minWidth of a cell / column when it doesn't have an explicit width (i.e.: it has not been resized manually)
   */
  defaultCellMinWidth?: number;
  lastColumnResizable?: boolean;
  /**
   * A custom node view for the rendering table nodes. By default, the plugin
   * uses the {@link TableView} class. You can explicitly set this to `null` to
   * not use a custom node view.
   */
  View?:
    | (new (
        node: ProsemirrorNode,
        cellMinWidth: number,
        view: EditorView,
      ) => NodeView)
    | null;
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
  defaultCellMinWidth = 100,
  View = TableView,
  lastColumnResizable = true,
}: ColumnResizingOptions = {}): Plugin {
  const plugin = new Plugin<ResizeState>({
    key: columnResizingPluginKey,
    state: {
      init(_, state) {
        const nodeViews = plugin.spec?.props?.nodeViews;
        const tableName = tableNodeTypes(state.schema).table.name;
        if (View && nodeViews) {
          nodeViews[tableName] = (node, view) => {
            return new View(node, defaultCellMinWidth, view);
          };
        }
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
          handleMouseMove(view, event, handleWidth, lastColumnResizable);
        },
        mouseleave: (view) => {
          handleMouseLeave(view);
        },
        mousedown: (view, event) => {
          handleMouseDown(view, event, cellMinWidth, defaultCellMinWidth);
        },
      },

      decorations: (state) => {
        const pluginState = columnResizingPluginKey.getState(state);
        if (pluginState && pluginState.activeHandle > -1) {
          return handleDecorations(state, pluginState.activeHandle);
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
  constructor(
    public activeHandle: number,
    public dragging: Dragging | false,
  ) {}

  apply(tr: Transaction): ResizeState {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const state = this;
    const action = tr.getMeta(columnResizingPluginKey);
    if (action && action.setHandle != null)
      return new ResizeState(action.setHandle, false);
    if (action && action.setDragging !== undefined)
      return new ResizeState(state.activeHandle, action.setDragging);
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
  lastColumnResizable: boolean,
): void {
  if (!view.editable) return;

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
  if (!view.editable) return;

  const pluginState = columnResizingPluginKey.getState(view.state);
  if (pluginState && pluginState.activeHandle > -1 && !pluginState.dragging)
    updateHandle(view, -1);
}

function handleMouseDown(
  view: EditorView,
  event: MouseEvent,
  cellMinWidth: number,
  defaultCellMinWidth: number,
): boolean {
  if (!view.editable) return false;

  const win = view.dom.ownerDocument.defaultView ?? window;

  const pluginState = columnResizingPluginKey.getState(view.state);
  if (!pluginState || pluginState.activeHandle == -1 || pluginState.dragging)
    return false;

  const cell = view.state.doc.nodeAt(pluginState.activeHandle)!;
  const width = currentColWidth(view, pluginState.activeHandle, cell.attrs);
  view.dispatch(
    view.state.tr.setMeta(columnResizingPluginKey, {
      setDragging: { startX: event.clientX, startWidth: width },
    }),
  );

  function finish(event: MouseEvent) {
    win.removeEventListener('mouseup', finish);
    win.removeEventListener('mousemove', move);
    const pluginState = columnResizingPluginKey.getState(view.state);
    if (pluginState?.dragging) {
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
    const pluginState = columnResizingPluginKey.getState(view.state);
    if (!pluginState) return;
    if (pluginState.dragging) {
      const dragged = draggedWidth(pluginState.dragging, event, cellMinWidth);
      displayColumnWidth(
        view,
        pluginState.activeHandle,
        dragged,
        defaultCellMinWidth,
      );
    }
  }

  displayColumnWidth(
    view,
    pluginState.activeHandle,
    width,
    defaultCellMinWidth,
  );

  win.addEventListener('mouseup', finish);
  win.addEventListener('mousemove', move);
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

function draggedWidth(
  dragging: Dragging,
  event: MouseEvent,
  resizeMinWidth: number,
): number {
  const offset = event.clientX - dragging.startX;
  return Math.max(resizeMinWidth, dragging.startWidth + offset);
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
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-1),
    map = TableMap.get(table),
    start = $cell.start(-1);
  const col =
    map.colCount($cell.pos - start) + $cell.nodeAfter!.attrs.colspan - 1;
  const tr = view.state.tr;
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
  if (tr.docChanged) view.dispatch(tr);
}

function displayColumnWidth(
  view: EditorView,
  cell: number,
  width: number,
  defaultCellMinWidth: number,
): void {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-1),
    start = $cell.start(-1);
  const col =
    TableMap.get(table).colCount($cell.pos - start) +
    $cell.nodeAfter!.attrs.colspan -
    1;
  let dom: Node | null = view.domAtPos($cell.start(-1)).node;
  while (dom && dom.nodeName != 'TABLE') {
    dom = dom.parentNode;
  }
  if (!dom) return;
  updateColumnsOnResize(
    table,
    dom.firstChild as HTMLTableColElement,
    dom as HTMLTableElement,
    defaultCellMinWidth,
    col,
    width,
  );
}

function zeroes(n: number): 0[] {
  return Array(n).fill(0);
}

export function handleDecorations(
  state: EditorState,
  cell: number,
): DecorationSet {
  const decorations = [];
  const $cell = state.doc.resolve(cell);
  const table = $cell.node(-1);
  if (!table) {
    return DecorationSet.empty;
  }
  const map = TableMap.get(table);
  const start = $cell.start(-1);
  const col =
    map.colCount($cell.pos - start) + $cell.nodeAfter!.attrs.colspan - 1;
  for (let row = 0; row < map.height; row++) {
    const index = col + row * map.width;
    // For positions that have either a different cell or the end
    // of the table to their right, and either the top of the table or
    // a different cell above them, add a decoration
    if (
      (col == map.width - 1 || map.map[index] != map.map[index + 1]) &&
      (row == 0 || map.map[index] != map.map[index - map.width])
    ) {
      const cellPos = map.map[index];
      const pos = start + cellPos + table.nodeAt(cellPos)!.nodeSize - 1;
      const dom = document.createElement('div');
      dom.className = 'column-resize-handle';
      if (columnResizingPluginKey.getState(state)?.dragging) {
        decorations.push(
          Decoration.node(
            start + cellPos,
            start + cellPos + table.nodeAt(cellPos)!.nodeSize,
            {
              class: 'column-resize-dragging',
            },
          ),
        );
      }

      decorations.push(Decoration.widget(pos, dom));
    }
  }
  return DecorationSet.create(state.doc, decorations);
}
