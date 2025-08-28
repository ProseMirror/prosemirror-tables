// This file defines a number of helpers for wiring up user input to
// table-related functionality.

import { keydownHandler } from 'prosemirror-keymap';
import { Fragment, ResolvedPos, Slice } from 'prosemirror-model';
import {
  Command,
  EditorState,
  Selection,
  TextSelection,
  Transaction,
} from 'prosemirror-state';

import { EditorView } from 'prosemirror-view';
import { CellSelection } from './cellselection';
import { deleteCellSelection } from './commands';
import { clipCells, fitSlice, insertCells, pastedCells } from './copypaste';
import { tableNodeTypes } from './schema';
import { TableMap } from './tablemap';
import {
  cellAround,
  inSameTable,
  isInTable,
  nextCell,
  selectionCell,
  tableEditingKey,
} from './util';

type Axis = 'horiz' | 'vert';

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * @public
 */
export type Direction = -1 | 1;

export const handleKeyDown = keydownHandler({
  ArrowLeft: arrow('horiz', -1),
  ArrowRight: arrow('horiz', 1),
  ArrowUp: arrow('vert', -1),
  ArrowDown: arrow('vert', 1),

  'Shift-ArrowLeft': shiftArrow('horiz', -1),
  'Shift-ArrowRight': shiftArrow('horiz', 1),
  'Shift-ArrowUp': shiftArrow('vert', -1),
  'Shift-ArrowDown': shiftArrow('vert', 1),

  Backspace: deleteCellSelection,
  'Mod-Backspace': deleteCellSelection,
  Delete: deleteCellSelection,
  'Mod-Delete': deleteCellSelection,
});

function maybeSetSelection(
  state: EditorState,
  dispatch: undefined | ((tr: Transaction) => void),
  selection: Selection,
): boolean {
  if (selection.eq(state.selection)) return false;
  if (dispatch) dispatch(state.tr.setSelection(selection).scrollIntoView());
  return true;
}

/**
 * @internal
 */
export function arrow(axis: Axis, dir: Direction): Command {
  return (state, dispatch, view) => {
    if (!view) return false;
    const sel = state.selection;
    if (sel instanceof CellSelection) {
      return maybeSetSelection(
        state,
        dispatch,
        Selection.near(sel.$headCell, dir),
      );
    }
    if (axis != 'horiz' && !sel.empty) return false;
    const end = atEndOfCell(view, axis, dir);
    if (end == null) return false;
    if (axis == 'horiz') {
      return maybeSetSelection(
        state,
        dispatch,
        Selection.near(state.doc.resolve(sel.head + dir), dir),
      );
    } else {
      const $cell = state.doc.resolve(end);
      const $next = nextCell($cell, axis, dir);
      let newSel;
      if ($next) newSel = Selection.near($next, 1);
      else if (dir < 0)
        newSel = Selection.near(state.doc.resolve($cell.before(-1)), -1);
      else newSel = Selection.near(state.doc.resolve($cell.after(-1)), 1);
      return maybeSetSelection(state, dispatch, newSel);
    }
  };
}

function shiftArrow(axis: Axis, dir: Direction): Command {
  return (state, dispatch, view) => {
    if (!view) return false;
    const sel = state.selection;
    let cellSel: CellSelection;
    if (sel instanceof CellSelection) {
      cellSel = sel;
    } else {
      const end = atEndOfCell(view, axis, dir);
      if (end == null) return false;
      cellSel = new CellSelection(state.doc.resolve(end));
    }

    const $head = nextCell(cellSel.$headCell, axis, dir);
    if (!$head) return false;
    return maybeSetSelection(
      state,
      dispatch,
      new CellSelection(cellSel.$anchorCell, $head),
    );
  };
}

export function handleTripleClick(view: EditorView, pos: number): boolean {
  const doc = view.state.doc,
    $cell = cellAround(doc.resolve(pos));
  if (!$cell) return false;
  view.dispatch(view.state.tr.setSelection(new CellSelection($cell)));
  return true;
}

// judge rect is rectangle
export function judgeRectangle(tableMap: TableMap, rect: Rect) {
  const { width, map, height } = tableMap;
  const mergedCellsIndices = [];
  let indexTop = rect.top * width + rect.left;
  let indexLeft = indexTop;
  let indexBottom = (rect.bottom - 1) * width + rect.left;
  let indexRight = indexTop + (rect.right - rect.left - 1);
  for (let i = rect.top; i < rect.bottom; i++) {
    if (
      (rect.left > 0 && map[indexLeft] === map[indexLeft - 1]) ||
      (rect.right < width && map[indexRight] === map[indexRight + 1])
    ) {
      if (map[indexLeft] === map[indexLeft - 1])
        mergedCellsIndices.push(indexLeft - 1);
      if (map[indexRight] === map[indexRight + 1])
        mergedCellsIndices.push(indexRight + 1);
    }
    indexLeft += width;
    indexRight += width;
  }
  for (let i = rect.left; i < rect.right; i++) {
    if (
      (rect.top > 0 && map[indexTop] === map[indexTop - width]) ||
      (rect.bottom < height && map[indexBottom] === map[indexBottom + width])
    ) {
      if (map[indexTop] === map[indexTop - width])
        mergedCellsIndices.push(indexTop - width);
      if (map[indexBottom] === map[indexBottom + width])
        mergedCellsIndices.push(indexBottom + width);
    }
    indexTop++;
    indexBottom++;
  }
  return Array.from(new Set(mergedCellsIndices));
}

// get rectangular
export function getRectangularRect(rect: Rect, tableMap: TableMap) {
  let mergedCellsIndices = [];
  const rectangle = JSON.parse(JSON.stringify(rect));
  while ((mergedCellsIndices = judgeRectangle(tableMap, rectangle)).length) {
    let maxRow = 0,
      minRow = Infinity,
      maxCol = 0,
      minCol = Infinity;
    mergedCellsIndices.forEach((index: number) => {
      const rowIndex = Math.floor(index / tableMap.width);
      const colIndex = index % tableMap.width;
      maxRow = Math.max(rowIndex, rectangle.bottom - 1, maxRow);
      minRow = Math.min(rowIndex, rectangle.top, minRow);
      maxCol = Math.max(colIndex, rectangle.right - 1, maxCol);
      minCol = Math.min(colIndex, rectangle.left, minCol);
    });
    rectangle.left = minCol;
    rectangle.right = maxCol + 1;
    rectangle.top = minRow;
    rectangle.bottom = maxRow + 1;
  }
  return rectangle;
}

/**
 * @public
 */
export function handlePaste(
  view: EditorView,
  _: ClipboardEvent,
  slice: Slice,
): boolean {
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
            fitSlice(tableNodeTypes(view.state.schema).cell, slice),
          ),
        ],
      };
    const table = sel.$anchorCell.node(-1);
    const start = sel.$anchorCell.start(-1);
    const rect = TableMap.get(table).rectBetween(
      sel.$anchorCell.pos - start,
      sel.$headCell.pos - start,
    );
    cells = clipCells(cells, rect.right - rect.left, rect.bottom - rect.top);
    insertCells(view.state, view.dispatch, start, rect, cells);
    return true;
  } else if (cells) {
    const $cell = selectionCell(view.state);
    const start = $cell.start(-1);
    insertCells(
      view.state,
      view.dispatch,
      start,
      TableMap.get($cell.node(-1)).findCell($cell.pos - start),
      cells,
    );
    return true;
  } else {
    return false;
  }
}

export function handleMouseDown(
  view: EditorView,
  startEvent: MouseEvent,
  supportRectangularSelection?: boolean,
): void {
  if (startEvent.ctrlKey || startEvent.metaKey) return;

  const startDOMCell = domInCell(view, startEvent.target as Node);
  let $anchor;
  if (startEvent.shiftKey && view.state.selection instanceof CellSelection) {
    // Adding to an existing cell selection
    setCellSelection(view.state.selection.$anchorCell, startEvent);
    startEvent.preventDefault();
  } else if (
    startEvent.shiftKey &&
    startDOMCell &&
    ($anchor = cellAround(view.state.selection.$anchor)) != null &&
    cellUnderMouse(view, startEvent)?.pos != $anchor.pos
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
  function setCellSelection($anchor: ResolvedPos, event: MouseEvent): void {
    let $head = cellUnderMouse(view, event);
    const starting = tableEditingKey.getState(view.state) == null;
    if (!$head || !inSameTable($anchor, $head)) {
      if (starting) $head = $anchor;
      else return;
    }
    const selection = supportRectangularSelection
      ? getRectangularSelection($anchor, $head)
      : new CellSelection($anchor, $head);

    if (starting || !view.state.selection.eq(selection)) {
      const tr = view.state.tr.setSelection(selection);
      if (starting) tr.setMeta(tableEditingKey, $anchor.pos);
      view.dispatch(tr);
    }
  }

  // get Rectangular cell Selection
  function getRectangularSelection($anchor: ResolvedPos, $head: ResolvedPos) {
    const tableNode = $anchor.node(-1);
    const tableMap = TableMap.get(tableNode);
    const tableStart = $anchor.start(-1);
    const rect = tableMap.rectBetween(
      $anchor.pos - tableStart,
      $head.pos - tableStart,
    );
    const rectangle = getRectangularRect(rect, tableMap);
    const { left, right, top, bottom } = rectangle;
    const { map, width } = tableMap;
    const { tr } = view.state;
    const $anchorCell = tr.doc.resolve(map[top * width + left] + tableStart);
    const $headCell = tr.doc.resolve(
      map[(bottom - 1) * width + right - 1] + tableStart,
    );
    return new CellSelection($anchorCell, $headCell);
  }

  // Stop listening to mouse motion events.
  function stop(): void {
    view.root.removeEventListener('mouseup', stop);
    view.root.removeEventListener('dragstart', stop);
    view.root.removeEventListener('mousemove', move);
    if (tableEditingKey.getState(view.state) != null)
      view.dispatch(view.state.tr.setMeta(tableEditingKey, -1));
  }

  function move(_event: Event): void {
    const event = _event as MouseEvent;
    const anchor = tableEditingKey.getState(view.state);
    let $anchor;
    if (anchor != null) {
      // Continuing an existing cross-cell selection
      $anchor = view.state.doc.resolve(anchor);
    } else if (domInCell(view, event.target as Node) != startDOMCell) {
      // Moving out of the initial cell -- start a new cell selection
      $anchor = cellUnderMouse(view, startEvent);
      if (!$anchor) return stop();
    }
    if ($anchor) setCellSelection($anchor, event);
  }

  view.root.addEventListener('mouseup', stop);
  view.root.addEventListener('dragstart', stop);
  view.root.addEventListener('mousemove', move);
}

// Check whether the cursor is at the end of a cell (so that further
// motion would move out of the cell)
function atEndOfCell(view: EditorView, axis: Axis, dir: number): null | number {
  if (!(view.state.selection instanceof TextSelection)) return null;
  const { $head } = view.state.selection;
  for (let d = $head.depth - 1; d >= 0; d--) {
    const parent = $head.node(d),
      index = dir < 0 ? $head.index(d) : $head.indexAfter(d);
    if (index != (dir < 0 ? 0 : parent.childCount)) return null;
    if (
      parent.type.spec.tableRole == 'cell' ||
      parent.type.spec.tableRole == 'header_cell'
    ) {
      const cellPos = $head.before(d);
      const dirStr: 'up' | 'down' | 'left' | 'right' =
        axis == 'vert' ? (dir > 0 ? 'down' : 'up') : dir > 0 ? 'right' : 'left';
      return view.endOfTextblock(dirStr) ? cellPos : null;
    }
  }
  return null;
}

function domInCell(view: EditorView, dom: Node | null): Node | null {
  for (; dom && dom != view.dom; dom = dom.parentNode) {
    if (dom.nodeName == 'TD' || dom.nodeName == 'TH') {
      return dom;
    }
  }
  return null;
}

function cellUnderMouse(
  view: EditorView,
  event: MouseEvent,
): ResolvedPos | null {
  const mousePos = view.posAtCoords({
    left: event.clientX,
    top: event.clientY,
  });
  if (!mousePos) return null;
  return mousePos ? cellAround(view.state.doc.resolve(mousePos.pos)) : null;
}
