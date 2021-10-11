// Various helper function for working with tables

import {PluginKey} from 'prosemirror-state';
import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';
import {TableMap} from './tablemap';
import {tableNodeTypes} from './schema';
import {selectedRect} from './commands';
import {CellSelection} from './cellselection';

export const key = new PluginKey('selectingCells');

export function cellAround($pos) {
  for (let d = $pos.depth - 1; d > 0; d--)
    if ($pos.node(d).type.spec.tableRole == 'row')
      return $pos.node(0).resolve($pos.before(d + 1));
  return null;
}

export function cellWrapping($pos) {
  for (let d = $pos.depth; d > 0; d--) {
    // Sometimes the cell can be in the same depth.
    const role = $pos.node(d).type.spec.tableRole;
    if (role === 'cell' || role === 'header_cell') return $pos.node(d);
  }
  return null;
}

export function isInTable(state) {
  const $head = state.selection.$head;
  for (let d = $head.depth; d > 0; d--)
    if ($head.node(d).type.spec.tableRole == 'row') return true;
  return false;
}

export function selectionCell(state) {
  const sel = state.selection;
  if (sel.$anchorCell) {
    return sel.$anchorCell.pos > sel.$headCell.pos
      ? sel.$anchorCell
      : sel.$headCell;
  } else if (sel.node && sel.node.type.spec.tableRole == 'cell') {
    return sel.$anchor;
  }
  return cellAround(sel.$head) || cellNear(sel.$head);
}

function cellNear($pos) {
  for (
    let after = $pos.nodeAfter, pos = $pos.pos;
    after;
    after = after.firstChild, pos++
  ) {
    const role = after.type.spec.tableRole;
    if (role == 'cell' || role == 'header_cell') return $pos.doc.resolve(pos);
  }
  for (
    let before = $pos.nodeBefore, pos = $pos.pos;
    before;
    before = before.lastChild, pos--
  ) {
    const role = before.type.spec.tableRole;
    if (role == 'cell' || role == 'header_cell')
      return $pos.doc.resolve(pos - before.nodeSize);
  }

  return null;
}

export function pointsAtCell($pos) {
  return $pos.parent.type.spec.tableRole == 'row' && $pos.nodeAfter;
}

export function moveCellForward($pos) {
  return $pos.node(0).resolve($pos.pos + $pos.nodeAfter.nodeSize);
}

export function inSameTable($a, $b) {
  return $a.depth == $b.depth && $a.pos >= $b.start(-1) && $a.pos <= $b.end(-1);
}

export function findCell($pos) {
  return TableMap.get($pos.node(-1)).findCell($pos.pos - $pos.start(-1));
}

export function colCount($pos) {
  return TableMap.get($pos.node(-1)).colCount($pos.pos - $pos.start(-1));
}

export function nextCell($pos, axis, dir) {
  const start = $pos.start(-1),
    map = TableMap.get($pos.node(-1));
  const moved = map.nextCell($pos.pos - start, axis, dir);
  return moved == null ? null : $pos.node(0).resolve(start + moved);
}

export function setAttr(attrs, name, value) {
  const result = {};
  for (const prop in attrs) result[prop] = attrs[prop];
  result[name] = value;
  return result;
}

export function removeColSpan(attrs, pos, n = 1) {
  const result = setAttr(attrs, 'colspan', attrs.colspan - n);
  if (result.colwidth) {
    result.colwidth = result.colwidth.slice();
    result.colwidth.splice(pos, n);
    if (!result.colwidth.some((w) => w > 0)) result.colwidth = null;
  }
  return result;
}

export function addColSpan(attrs, pos, n = 1) {
  const result = setAttr(attrs, 'colspan', attrs.colspan + n);
  if (result.colwidth) {
    result.colwidth = result.colwidth.slice();
    for (let i = 0; i < n; i++) result.colwidth.splice(pos, 0, 0);
  }
  return result;
}

export function columnIsHeader(map, table, col) {
  const headerCell = tableNodeTypes(table.type.schema).header_cell;
  for (let row = 0; row < map.height; row++)
    if (table.nodeAt(map.map[col + row * map.width]).type != headerCell)
      return false;
  return true;
}

export function getColIndex(state, pos) {
  const resPos = state.doc.resolve(pos);
  const tableStart = resPos.start(-1);
  const map = TableMap.get(resPos.node(1));
  const {pos: insertRowPos} = findParentNodeOfTypeClosestToPos(
    state.doc.resolve(pos + 1),
    state.schema.nodes.table_cell
  );

  const insertCellIndex = map.map.indexOf(insertRowPos - tableStart);

  if (insertCellIndex === -1) return null;

  return insertCellIndex % map.width;
}

export const createElementWithClass = (type, className, datatest) => {
  const el = document.createElement(type);
  el.className = className;
  if (datatest) {
    el.dataset.test = datatest;
  }

  return el;
};

export const getRowIndex = (state, pos) => {
  const tableRect = selectedRect(state);
  const cellIndex = tableRect.map.map.indexOf(pos - tableRect.tableStart);

  if (cellIndex === -1) return null;

  const rowNumber = Math.floor(cellIndex / tableRect.map.width);

  return rowNumber;
};

export const getColCells = (headerPos, state) => {
  const ColSelection = CellSelection.colSelection(state.doc.resolve(headerPos));
  const cells = [];

  ColSelection.forEachCell((cell, pos) => cells.push({node: cell, pos}));
  cells.splice(0, 1);
  return cells;
};


export const sortCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export const sortNumVsString = (direction, textA, textB, collator) => {
  // give first priority to numbers - so if only one content is numeric he will always be first
  const aNumber = parseFloat(textA);
  const bNumber = parseFloat(textB);

  const aIsNotNumber = isNaN(aNumber);
  const bIsNotNumber = isNaN(bNumber);

  if (aIsNotNumber && bIsNotNumber) {
    // if not numeric values sort alphabetically
    return direction * (collator || sortCollator).compare(textA, textB);
  }

  if (!aIsNotNumber && bIsNotNumber) return -1 * direction;
  if (aIsNotNumber && !bIsNotNumber) return 1 * direction;
  return direction > 0 ? aNumber - bNumber : bNumber - aNumber;
}