import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { cellAround, pointsAtCell, setAttr } from './util';
import { TableMap } from './tablemap';
import { TableView, updateColumns } from './tableview';
import { tableNodeTypes } from './schema';

export const key = new PluginKey('tableColumnResizing');

export function columnResizing({
  handleWidth = 5,
  cellMinWidth = 25,
  View = TableView,
  lastColumnResizable = true,
} = {}) {
  const plugin = new Plugin({
    key,
    state: {
      init(_, state) {
        const tableNodeTypeName = tableNodeTypes(state.schema).table.name;
        const nodeViews = plugin?.spec?.props?.nodeViews || [];
        nodeViews[tableNodeTypeName] = (node) => new View(node, cellMinWidth);
        return new ResizeState(-1, false);
      },
      apply(tr, prev) {
        return prev.apply(tr);
      },
    },
    props: {
      attributes(state) {
        const pluginState = key.getState(state);
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
          return false;
        },
        mouseleave(view) {
          handleMouseLeave(view);
          return false;
        },
        mousedown(view, event) {
          handleMouseDown(view, event, cellMinWidth);
          return false;
        },
      },

      decorations(state) {
        const pluginState = key.getState(state);
        if (pluginState.activeHandle > -1) {
          return handleDecorations(state, pluginState.activeHandle);
        }
      },

      nodeViews: {},
    },
  });
  return plugin;
}

class ResizeState {
  readonly activeHandle;
  readonly dragging;

  constructor(activeHandle, dragging) {
    this.activeHandle = activeHandle;
    this.dragging = dragging;
  }

  apply(tr) {
    const action = tr.getMeta(key);
    if (action && action.setHandle != null) {
      return new ResizeState(action.setHandle, null);
    }
    if (action && action.setDragging !== undefined) {
      return new ResizeState(this.activeHandle, action.setDragging);
    }
    if (this.activeHandle > -1 && tr.docChanged) {
      let handle = tr.mapping.map(this.activeHandle, -1);
      if (!pointsAtCell(tr.doc.resolve(handle))) {
        handle = null;
      }
      return new ResizeState(handle, this.dragging);
    }
    return this;
  }
}

function handleMouseMove(
  view,
  event,
  handleWidth,
  cellMinWidth,
  lastColumnResizable,
) {
  const pluginState = key.getState(view.state);

  if (!pluginState.dragging) {
    const target = domCellAround(event.target);
    let cell = -1;
    if (target) {
      const { left, right } = target.getBoundingClientRect();
      if (event.clientX - left <= handleWidth) {
        cell = edgeCell(view, event, 'left');
      } else if (right - event.clientX <= handleWidth) {
        cell = edgeCell(view, event, 'right');
      }
    }

    if (cell != pluginState.activeHandle) {
      if (!lastColumnResizable && cell !== -1) {
        const $cell = view.state.doc.resolve(cell);
        const table = $cell.node(-1),
          map = TableMap.get(table),
          start = $cell.start(-1);
        const col =
          map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;

        if (col == map.width - 1) {
          return;
        }
      }

      updateHandle(view, cell);
    }
  }
}

function handleMouseLeave(view) {
  const pluginState = key.getState(view.state);
  if (pluginState.activeHandle > -1 && !pluginState.dragging) {
    updateHandle(view, -1);
  }
}

function handleMouseDown(view, event, cellMinWidth) {
  const pluginState = key.getState(view.state);
  if (pluginState.activeHandle == -1 || pluginState.dragging) {
    return false;
  }

  const cell = view.state.doc.nodeAt(pluginState.activeHandle);
  const width = currentColWidth(view, pluginState.activeHandle, cell.attrs);
  view.dispatch(
    view.state.tr.setMeta(key, {
      setDragging: { startX: event.clientX, startWidth: width },
    }),
  );

  function finish(event) {
    window.removeEventListener('mouseup', finish);
    window.removeEventListener('mousemove', move);
    const pluginState = key.getState(view.state);
    if (pluginState.dragging) {
      updateColumnWidth(
        view,
        pluginState.activeHandle,
        draggedWidth(pluginState.dragging, event, cellMinWidth),
      );
      view.dispatch(view.state.tr.setMeta(key, { setDragging: null }));
    }
  }
  function move(event) {
    if (!event.which) {
      return finish(event);
    }
    const pluginState = key.getState(view.state);
    const dragged = draggedWidth(pluginState.dragging, event, cellMinWidth);
    displayColumnWidth(view, pluginState.activeHandle, dragged, cellMinWidth);
  }

  window.addEventListener('mouseup', finish);
  window.addEventListener('mousemove', move);
  event.preventDefault();
  return true;
}

function currentColWidth(view, cellPos, { colspan, colwidth }) {
  const width = colwidth && colwidth[colwidth.length - 1];
  if (width) {
    return width;
  }
  const dom = view.domAtPos(cellPos);
  const node = dom.node.childNodes[dom.offset];
  let domWidth = node.offsetWidth,
    parts = colspan;
  if (colwidth) {
    for (let i = 0; i < colspan; i++) {
      if (colwidth[i]) {
        domWidth -= colwidth[i];
        parts--;
      }
    }
  }
  return domWidth / parts;
}

function domCellAround(target) {
  while (target && target.nodeName != 'TD' && target.nodeName != 'TH') {
    target = target.classList.contains('ProseMirror')
      ? null
      : target.parentNode;
  }
  return target;
}

function edgeCell(view, event, side) {
  const found = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if (!found) {
    return -1;
  }
  const { pos } = found;
  const $cell = cellAround(view.state.doc.resolve(pos));
  if (!$cell) {
    return -1;
  }
  if (side == 'right') {
    return $cell.pos;
  }
  const map = TableMap.get($cell.node(-1)),
    start = $cell.start(-1);
  const index = map.map.indexOf($cell.pos - start);
  return index % map.width == 0 ? -1 : start + map.map[index - 1];
}

function draggedWidth(dragging, event, cellMinWidth) {
  const offset = event.clientX - dragging.startX;
  return Math.max(cellMinWidth, dragging.startWidth + offset);
}

function updateHandle(view, value) {
  view.dispatch(view.state.tr.setMeta(key, { setHandle: value }));
}

function updateColumnWidth(view, cell, width) {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-1),
    map = TableMap.get(table),
    start = $cell.start(-1);
  const col =
    map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;
  const tr = view.state.tr;
  for (let row = 0; row < map.height; row++) {
    const mapIndex = row * map.width + col;
    // Rowspanning cell that has already been handled
    if (row && map.map[mapIndex] == map.map[mapIndex - map.width]) {
      continue;
    }
    const pos = map.map[mapIndex],
      { attrs } = table.nodeAt(pos);
    const index = attrs.colspan == 1 ? 0 : col - map.colCount(pos);
    if (attrs.colwidth && attrs.colwidth[index] == width) {
      continue;
    }
    const colwidth = attrs.colwidth
      ? attrs.colwidth.slice()
      : zeroes(attrs.colspan);
    colwidth[index] = width;
    tr.setNodeMarkup(start + pos, null, setAttr(attrs, 'colwidth', colwidth));
  }
  if (tr.docChanged) {
    view.dispatch(tr);
  }
}

function displayColumnWidth(view, cell, width, cellMinWidth) {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-1),
    start = $cell.start(-1);
  const col =
    TableMap.get(table).colCount($cell.pos - start) +
    $cell.nodeAfter.attrs.colspan -
    1;
  let dom = view.domAtPos($cell.start(-1)).node;
  while (dom.nodeName != 'TABLE') {
    dom = dom.parentNode;
  }
  updateColumns(table, dom.firstChild, dom, cellMinWidth, col, width);
}

function zeroes(n) {
  const result: number[] = [];
  for (let i = 0; i < n; i++) {
    result.push(0);
  }
  return result;
}

function handleDecorations(state, cell) {
  const decorations: Decoration[] = [];
  const $cell = state.doc.resolve(cell);
  const table = $cell.node(-1),
    map = TableMap.get(table),
    start = $cell.start(-1);
  const col = map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan;
  for (let row = 0; row < map.height; row++) {
    const index = col + row * map.width - 1;
    // For positions that are have either a different cell or the end
    // of the table to their right, and either the top of the table or
    // a different cell above them, add a decoration
    if (
      (col == map.width || map.map[index] != map.map[index + 1]) &&
      (row == 0 || map.map[index - 1] != map.map[index - 1 - map.width])
    ) {
      const cellPos = map.map[index];
      const pos = start + cellPos + table.nodeAt(cellPos).nodeSize - 1;
      const dom = document.createElement('div');
      dom.className = 'column-resize-handle';
      decorations.push(Decoration.widget(pos, dom));
    }
  }
  return DecorationSet.create(state.doc, decorations);
}
