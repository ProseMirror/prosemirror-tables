// This file defines a number of helpers for wiring up user input to
// table-related functionality.

import {Fragment} from 'prosemirror-model';
import {Selection} from 'prosemirror-state';
import {keydownHandler} from 'prosemirror-keymap';
import {
  key,
  nextCell,
  cellAround,
  inSameTable,
  isInTable,
  selectionCell,
} from './util';
import {CellSelection} from './cellselection';
import {TableMap} from './tablemap';
import {pastedCells, fitSlice, clipCells, insertCells} from './copypaste';
import {tableNodeTypes} from './schema/schema';
import {splitBlockKeepMarks} from 'prosemirror-commands';
import {
  goToNextCell,
  deleteColumn,
  deleteRow,
  deleteTable,
  selectedRect,
} from './commands';

export const handleKeyDown = keydownHandler({
  ArrowLeft: arrow('horiz', -1),
  ArrowRight: arrow('horiz', 1),
  ArrowUp: arrow('vert', -1),
  ArrowDown: arrow('vert', 1),

  Enter: arrow('vert', 1),
  'Shift-Enter': splitIfCellChild,

  Tab: goToNextCell(1),
  'Shift-Tab': goToNextCell(-1),

  'Shift-ArrowLeft': shiftArrow('horiz', -1),
  'Shift-ArrowRight': shiftArrow('horiz', 1),
  'Shift-ArrowUp': shiftArrow('vert', -1),
  'Shift-ArrowDown': shiftArrow('vert', 1),

  Backspace: deleteCellSelection,
  'Mod-Backspace': deleteCellSelection,
  Delete: deleteCellSelection,
  'Mod-Delete': deleteCellSelection,
});

function checkIfParentIsCell(state) {
  const {$head} = state.selection;
  const parent = $head.node($head.depth - 1);

  // if parent is not a table cell - let the editor handle key down
  if (parent.type.name !== 'table_cell') return false;

  return true
}

function splitIfCellChild(state, dispatch) {
  // if parent is not a table cell - let the editor handle key down
  if (!checkIfParentIsCell(state)) return false;

  return splitBlockKeepMarks(state, dispatch);
}

function maybeSetSelection(state, dispatch, selection) {
  if (selection.eq(state.selection)) return false;
  if (dispatch) dispatch(state.tr.setSelection(selection).scrollIntoView());
  return true;
}

function withFlushedState(view, state, f) {
  const viewState = view.state,
    active = view.root.activeElement;
  if (viewState != state) view.updateState(state);
  if (active != view.dom) view.focus();
  try {
    return f();
  } finally {
    if (viewState != state) view.updateState(viewState);
    if (active != view.dom && active) active.focus();
  }
}

let reusedRange = null;

// Note that this will always return the same range, because DOM range
// objects are every expensive, and keep slowing down subsequent DOM
// updates, for some reason.
export const textRange = function (node, from, to) {
  const range = reusedRange || (reusedRange = document.createRange());
  range.setEnd(node, to == null ? node.nodeValue.length : to);
  range.setStart(node, from || 0);
  return range;
};

// : (EditorView, number, number)
// Whether vertical position motion in a given direction
// from a position would leave a text block.
function endOfTextblockVertical(view, state, dir, selection) {
  const sel = selection;
  const $pos = dir === 'up' ? sel.$from : sel.$to;
  return withFlushedState(view, state, () => {
    let {node: dom} = view.docView.domFromPos($pos.pos, dir == 'up' ? -1 : 1);
    for (;;) {
      const nearest = view.docView.nearestDesc(dom, true);
      if (!nearest) break;
      if (nearest.node.isBlock) {
        dom = nearest.dom;
        break;
      }
      dom = nearest.dom.parentNode;
    }
    const coords = view.coordsAtPos($pos.pos, 1);
    for (let child = dom.firstChild; child; child = child.nextSibling) {
      let boxes;
      if (child.nodeType == 1) {
        boxes = child.getClientRects();
      } else if (child.nodeType == 3) {
        boxes = textRange(child, 0, child.nodeValue.length).getClientRects();
      } else {
        continue;
      }
      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];
        if (
          box.bottom > box.top + 1 &&
          (dir == 'up'
            ? coords.top - box.top > (box.bottom - coords.top) * 2
            : box.bottom - coords.bottom > (coords.bottom - box.top) * 2)
        )
          return false;
      }
    }
    return true;
  });
}

const maybeRTL = /[\u0590-\u08ac]/;

function endOfTextblockHorizontal(view, state, dir, selection) {
  const {$head} = selection;
  if (!$head.parent.isTextblock) return false;
  const offset = $head.parentOffset,
    atStart = !offset,
    atEnd = offset == $head.parent.content.size;
  const sel = view.root.getSelection();
  // If the textblock is all LTR, or the browser doesn't support
  // Selection.modify (Edge), fall back to a primitive approach
  if (!maybeRTL.test($head.parent.textContent) || !sel.modify)
    return dir == 'left' || dir == 'backward' ? atStart : atEnd;

  return withFlushedState(view, state, () => {
    // This is a huge hack, but appears to be the best we can
    // currently do: use `Selection.modify` to move the selection by
    // one character, and see if that moves the cursor out of the
    // textblock (or doesn't move it at all, when at the start/end of
    // the document).
    const oldRange = sel.getRangeAt(0),
      oldNode = sel.focusNode,
      oldOff = sel.focusOffset;
    const oldBidiLevel = sel.caretBidiLevel; // Only for Firefox
    sel.modify('move', dir, 'character');
    const parentDOM = $head.depth
      ? view.docView.domAfterPos($head.before())
      : view.dom;
    const result =
      !parentDOM.contains(
        sel.focusNode.nodeType == 1 ? sel.focusNode : sel.focusNode.parentNode
      ) ||
      (oldNode == sel.focusNode && oldOff == sel.focusOffset);
    // Restore the previous selection
    sel.removeAllRanges();
    sel.addRange(oldRange);
    if (oldBidiLevel != null) sel.caretBidiLevel = oldBidiLevel;
    return result;
  });
}

// Check whether the cursor is at the end of a cell (so that further
// motion would move out of the cell)
function atEndOfCellFromSelection(view, axis, dir, sel) {
  if (sel.toJSON().type !== 'text') return null;
  const {$head} = sel;
  if (!$head) return null;
  for (let d = $head.depth - 1; d >= 0; d--) {
    const parent = $head.node(d),
      index = dir < 0 ? $head.index(d) : $head.indexAfter(d);
    if (index != (dir < 0 ? 0 : parent.childCount)) return null;
    if (
      parent.type.spec.tableRole == 'cell' ||
      parent.type.spec.tableRole == 'header_cell'
    ) {
      const cellPos = $head.before(d);
      const dirStr =
        axis == 'vert' ? (dir > 0 ? 'down' : 'up') : dir > 0 ? 'right' : 'left';

      return (axis == 'vert'
        ? endOfTextblockVertical
        : endOfTextblockHorizontal)(view, view.state, dirStr, sel)
        ? cellPos
        : null;
    }
  }
  return null;
}

const getNextArrowSel = (axis, dir, sel, state, view) => {
  if (sel instanceof CellSelection) {
    return Selection.near(sel.$headCell, dir);
  }
  if (axis != 'horiz' && !sel.empty) return false;
  const end = atEndOfCellFromSelection(view, axis, dir, sel);
  if (end == null) return false;
  if (axis == 'horiz') {
    return Selection.near(state.doc.resolve(sel.head + dir), dir);
  } else {
    const $cell = state.doc.resolve(end);
    const $next = nextCell($cell, axis, dir);
    let newSel;
    if ($next) newSel = Selection.near($next, 1);
    else if (dir < 0)
      newSel = Selection.near(state.doc.resolve($cell.before(-1)), dir);
    else newSel = Selection.near(state.doc.resolve($cell.after(-1)), dir);
    return newSel;
  }
};

function arrow(axis, dir) {
  return (state, dispatch, view) => {
    // if parent is not a table cell - let the editor handle key down
    if (!checkIfParentIsCell(state)) return false;

    let newSel = state.selection;
    let newSelVisible = false;
    while (!newSelVisible) {
      newSel = getNextArrowSel(axis, dir, newSel, state, view);
      if (!newSel) return false;

      // if no node at table_row depth - set the new selection
      if (newSel && !newSel.$from.node(2)) {
        newSelVisible = true;
      }

      // if the new selection is in visible row - set the selection
      if (
        newSel &&
        newSel.$from.node(2) &&
        !newSel.$from.node(2).attrs.hidden
      ) {
        newSelVisible = true;
      }
    }
    return maybeSetSelection(state, dispatch, newSel);
  };
}

function shiftArrow(axis, dir) {
  return (state, dispatch, view) => {
    let sel = state.selection;
    if (!(sel instanceof CellSelection)) {
      const end = atEndOfCell(view, axis, dir);
      if (end == null) return false;
      sel = new CellSelection(state.doc.resolve(end));
    }
    const $head = nextCell(sel.$headCell, axis, dir);
    if (!$head) return false;
    return maybeSetSelection(
      state,
      dispatch,
      new CellSelection(sel.$anchorCell, $head)
    );
  };
}

export function getDeleteCommand(state) {
  if (!(state.selection instanceof CellSelection)) return null;

  // check if all the table selected
  const rect = selectedRect(state);
  if (
    rect.top == 0 &&
    rect.left == 0 &&
    rect.bottom == rect.map.height &&
    rect.right == rect.map.width
  )
    return deleteTable;

  if (state.selection.isRowSelection()) return deleteRow;
  if (state.selection.isColSelection()) return deleteColumn;

  return null;
}

function deleteCellSelection(state, dispatch) {
  const sel = state.selection;
  if (!(sel instanceof CellSelection)) return false;
  if (dispatch) {
    const deleteCommand = getDeleteCommand(state);
    return deleteCommand(state, dispatch);
  }
  return true;
}

export function handleTripleClick(view, pos) {
  const doc = view.state.doc,
    $cell = cellAround(doc.resolve(pos));
  if (!$cell) return false;
  view.dispatch(view.state.tr.setSelection(new CellSelection($cell)));
  return true;
}

export function handlePaste(view, _, slice) {
  if (!isInTable(view.state)) return false;
  let cells = pastedCells(slice);
  const sel = view.state.selection;
  if (sel instanceof CellSelection) {
    if (!cells)
      cells = {
        width: 1,
        height: 1,
        rows: [
          Fragment.from(
            fitSlice(tableNodeTypes(view.state.schema).cell, slice)
          ),
        ],
      };
    const table = sel.$anchorCell.node(-1),
      start = sel.$anchorCell.start(-1);
    const rect = TableMap.get(table).rectBetween(
      sel.$anchorCell.pos - start,
      sel.$headCell.pos - start
    );
    cells = clipCells(cells, rect.right - rect.left, rect.bottom - rect.top);
    insertCells(view.state, view.dispatch, start, rect, cells);
    return true;
  } else if (cells) {
    const $cell = selectionCell(view.state),
      start = $cell.start(-1);
    insertCells(
      view.state,
      view.dispatch,
      start,
      TableMap.get($cell.node(-1)).findCell($cell.pos - start),
      cells
    );
    return true;
  } else {
    return false;
  }
}

export function handleMouseDown(view, startEvent) {
  if (startEvent.ctrlKey || startEvent.metaKey) return;

  const startDOMCell = domInCell(view, startEvent.target);
  let $anchor;
  if (startEvent.shiftKey && view.state.selection instanceof CellSelection) {
    // Adding to an existing cell selection
    setCellSelection(view.state.selection.$anchorCell, startEvent);
    startEvent.preventDefault();
  } else if (
    startEvent.shiftKey &&
    startDOMCell &&
    ($anchor = cellAround(view.state.selection.$anchor)) != null &&
    cellUnderMouse(view, startEvent).pos != $anchor.pos
  ) {
    // Adding to a selection that starts in another cell (causing a
    // cell selection to be created).
    setCellSelection($anchor, startEvent);
    startEvent.preventDefault();
  } else if (!startDOMCell) {
    // Not in a cell, let the default behavior happen.
    return;
  }

  // Create and dispatch a cell selection between the given anchor and
  // the position under the mouse.
  function setCellSelection($anchor, event) {
    let $head = cellUnderMouse(view, event);
    const starting = key.getState(view.state) == null;
    if (!$head || !inSameTable($anchor, $head)) {
      if (starting) $head = $anchor;
      else return;
    }
    let selection;
    if (view) {
      const sel = view.state.selection;
      if (
        sel instanceof CellSelection &&
        sel.isRowSelection() &&
        event.shiftKey
      ) {
        selection = CellSelection.rowSelection(sel.$anchorCell, $head);
      } else if (
        sel instanceof CellSelection &&
        sel.isColSelection() &&
        event.shiftKey
      ) {
        selection = CellSelection.colSelection(sel.$anchorCell, $head);
      } else {
        selection = new CellSelection($anchor, $head);
      }
    } else {
      selection = new CellSelection($anchor, $head);
    }

    if (starting || !view.state.selection.eq(selection)) {
      const tr = view.state.tr.setSelection(selection);
      if (starting) tr.setMeta(key, $anchor.pos);
      view.dispatch(tr);
    }
  }

  // Stop listening to mouse motion events.
  function stop() {
    view.root.removeEventListener('mouseup', stop);
    view.root.removeEventListener('dragstart', stop);
    view.root.removeEventListener('mousemove', move);
    if (key.getState(view.state) != null)
      view.dispatch(view.state.tr.setMeta(key, -1));
  }

  function move(event) {
    const anchor = key.getState(view.state);
    let $anchor;
    if (anchor != null) {
      // Continuing an existing cross-cell selection
      $anchor = view.state.doc.resolve(anchor);
    } else if (domInCell(view, event.target) && domInCell(view, event.target) != startDOMCell) {
      // Moving out of the initial cell -- start a new cell selection
      $anchor = cellUnderMouse(view, startEvent);
      if (!$anchor){
        return stop();
      } 
    }
    if ($anchor) setCellSelection($anchor, event);

    return null;
  }
  view.root.addEventListener('mouseup', stop);
  view.root.addEventListener('dragstart', stop);
  view.root.addEventListener('mousemove', move);
}

// Check whether the cursor is at the end of a cell (so that further
// motion would move out of the cell)
function atEndOfCell(view, axis, dir) {
  if (view.state.selection.toJSON().type !== 'text') return null;
  const {$head} = view.state.selection;
  for (let d = $head.depth - 1; d >= 0; d--) {
    const parent = $head.node(d),
      index = dir < 0 ? $head.index(d) : $head.indexAfter(d);
    if (index != (dir < 0 ? 0 : parent.childCount)) return null;
    if (
      parent.type.spec.tableRole == 'cell' ||
      parent.type.spec.tableRole == 'header_cell'
    ) {
      const cellPos = $head.before(d);
      const dirStr =
        axis == 'vert' ? (dir > 0 ? 'down' : 'up') : dir > 0 ? 'right' : 'left';
      return view.endOfTextblock(dirStr) ? cellPos : null;
    }
  }
  return null;
}

function domInCell(view, dom) {
  for (; dom && dom != view.dom; dom = dom.parentNode)
    if (dom.nodeName == 'TD' || dom.nodeName == 'TH') return dom;

  return null;
}

function cellUnderMouse(view, event) {
  const mousePos = view.posAtCoords({left: event.clientX, top: event.clientY});
  if (!mousePos) return null;
  return mousePos ? cellAround(view.state.doc.resolve(mousePos.pos)) : null;
}
