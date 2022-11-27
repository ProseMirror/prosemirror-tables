// Various helper function for working with tables

import { EditorState, NodeSelection, PluginKey } from 'prosemirror-state';

import { Rect, TableMap } from './tablemap';
import { tableNodeTypes } from './schema';
import { Attrs, Node, ResolvedPos } from 'prosemirror-model';
import { CellSelection } from './cellselection';

/**
 * @public
 */
export type MutableAttrs = { -readonly [P in keyof Attrs]: Attrs[P] };

/**
 * @public
 */
export const tableEditingKey = new PluginKey<number>('selectingCells');

/**
 * @public
 */
export function cellAround($pos: ResolvedPos): ResolvedPos | null {
  for (let d = $pos.depth - 1; d > 0; d--)
    if ($pos.node(d).type.spec.tableRole == 'row')
      return $pos.node(0).resolve($pos.before(d + 1));
  return null;
}

export function cellWrapping($pos: ResolvedPos): null | Node {
  for (let d = $pos.depth; d > 0; d--) {
    // Sometimes the cell can be in the same depth.
    const role = $pos.node(d).type.spec.tableRole;
    if (role === 'cell' || role === 'header_cell') return $pos.node(d);
  }
  return null;
}

/**
 * @public
 */
export function isInTable(state: EditorState): boolean {
  const $head = state.selection.$head;
  for (let d = $head.depth; d > 0; d--)
    if ($head.node(d).type.spec.tableRole == 'row') return true;
  return false;
}

/**
 * @public
 */
export function selectionCell(
  state: EditorState,
): ResolvedPos | null | undefined {
  const sel = state.selection as CellSelection | NodeSelection;
  if ('$anchorCell' in sel && sel.$anchorCell) {
    return sel.$anchorCell.pos > sel.$headCell.pos
      ? sel.$anchorCell
      : sel.$headCell;
  } else if (
    'node' in sel &&
    sel.node &&
    sel.node.type.spec.tableRole == 'cell'
  ) {
    return sel.$anchor;
  }
  return cellAround(sel.$head) || cellNear(sel.$head);
}

function cellNear($pos: ResolvedPos): ResolvedPos | undefined {
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
}

/**
 * @public
 */
export function pointsAtCell($pos: ResolvedPos): boolean {
  return $pos.parent.type.spec.tableRole == 'row' && !!$pos.nodeAfter;
}

/**
 * @public
 */
export function moveCellForward($pos: ResolvedPos): ResolvedPos {
  return $pos.node(0).resolve($pos.pos + $pos.nodeAfter.nodeSize);
}

/**
 * @public
 */
export function inSameTable($a: ResolvedPos, $b: ResolvedPos): boolean {
  return $a.depth == $b.depth && $a.pos >= $b.start(-1) && $a.pos <= $b.end(-1);
}

/**
 * @public
 */
export function findCell($pos: ResolvedPos): Rect {
  return TableMap.get($pos.node(-1)).findCell($pos.pos - $pos.start(-1));
}

/**
 * @public
 */
export function colCount($pos: ResolvedPos): number {
  return TableMap.get($pos.node(-1)).colCount($pos.pos - $pos.start(-1));
}

/**
 * @public
 */
export function nextCell(
  $pos: ResolvedPos,
  axis: string,
  dir: number,
): null | ResolvedPos {
  const start = $pos.start(-1),
    map = TableMap.get($pos.node(-1));
  const moved = map.nextCell($pos.pos - start, axis, dir);
  return moved == null ? null : $pos.node(0).resolve(start + moved);
}

/**
 * @internal
 */
export function _setAttr(
  attrs: Attrs,
  name: string,
  value: unknown,
): MutableAttrs {
  const result = {};
  for (const prop in attrs) result[prop] = attrs[prop];
  result[name] = value;
  return result;
}

/**
 * @public
 */
export function removeColSpan(attrs: Attrs, pos: number, n = 1): Attrs {
  const result = _setAttr(attrs, 'colspan', attrs.colspan - n);
  if (result.colwidth) {
    result.colwidth = result.colwidth.slice();
    result.colwidth.splice(pos, n);
    if (!result.colwidth.some((w) => w > 0)) result.colwidth = null;
  }
  return result;
}

/**
 * @public
 */
export function addColSpan(attrs: Attrs, pos: number, n = 1): Attrs {
  const result = _setAttr(attrs, 'colspan', attrs.colspan + n);
  if (result.colwidth) {
    result.colwidth = result.colwidth.slice();
    for (let i = 0; i < n; i++) result.colwidth.splice(pos, 0, 0);
  }
  return result;
}

/**
 * @public
 */
export function columnIsHeader(
  map: TableMap,
  table: Node,
  col: number,
): boolean {
  const headerCell = tableNodeTypes(table.type.schema).header_cell;
  for (let row = 0; row < map.height; row++)
    if (table.nodeAt(map.map[col + row * map.width]).type != headerCell)
      return false;
  return true;
}
