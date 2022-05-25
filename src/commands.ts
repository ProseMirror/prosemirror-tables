// This file defines a number of table-related commands.

import { TextSelection } from 'prosemirror-state';
import { Fragment } from 'prosemirror-model';

import { Rect, TableMap } from './tablemap';
import { CellSelection } from './cellselection';
import {
  addColSpan,
  cellAround,
  cellWrapping,
  columnIsHeader,
  isInTable,
  moveCellForward,
  removeColSpan,
  selectionCell,
  setAttr,
} from './util';
import { tableNodeTypes } from './schema';

// Helper to get the selected rectangle in a table, if any. Adds table
// map, table node, and table start offset to the object for
// convenience.
export function selectedRect(state) {
  let sel = state.selection,
    $pos = selectionCell(state);
  let table = $pos.node(-1),
    tableStart = $pos.start(-1),
    map = TableMap.get(table);
  let rect;
  if (sel instanceof CellSelection)
    rect = map.rectBetween(
      sel.$anchorCell.pos - tableStart,
      sel.$headCell.pos - tableStart,
    );
  else rect = map.findCell($pos.pos - tableStart);
  rect.tableStart = tableStart;
  rect.map = map;
  rect.table = table;
  return rect;
}

// Add a column at the given position in a table.
export function addColumn(tr, { map, tableStart, table }, col) {
  let refColumn = col > 0 ? -1 : 0;
  if (columnIsHeader(map, table, col + refColumn))
    refColumn = col == 0 || col == map.width ? null : 0;

  for (let row = 0; row < map.height; row++) {
    let index = row * map.width + col;
    // If this position falls inside a col-spanning cell
    if (col > 0 && col < map.width && map.map[index - 1] == map.map[index]) {
      let pos = map.map[index],
        cell = table.nodeAt(pos);
      tr.setNodeMarkup(
        tr.mapping.map(tableStart + pos),
        null,
        addColSpan(cell.attrs, col - map.colCount(pos)),
      );
      // Skip ahead if rowspan > 1
      row += cell.attrs.rowspan - 1;
    } else {
      let type =
        refColumn == null
          ? tableNodeTypes(table.type.schema).cell
          : table.nodeAt(map.map[index + refColumn]).type;
      let pos = map.positionAt(row, col, table);
      tr.insert(tr.mapping.map(tableStart + pos), type.createAndFill());
    }
  }
  return tr;
}

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Command to add a column before the column with the selection.
export function addColumnBefore(state, dispatch) {
  if (!isInTable(state)) return false;
  if (dispatch) {
    let rect = selectedRect(state);
    dispatch(addColumn(state.tr, rect, rect.left));
  }
  return true;
}

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Command to add a column after the column with the selection.
export function addColumnAfter(state, dispatch) {
  if (!isInTable(state)) return false;
  if (dispatch) {
    let rect = selectedRect(state);
    dispatch(addColumn(state.tr, rect, rect.right));
  }
  return true;
}

export function removeColumn(tr, { map, table, tableStart }, col) {
  let mapStart = tr.mapping.maps.length;
  for (let row = 0; row < map.height; ) {
    let index = row * map.width + col,
      pos = map.map[index],
      cell = table.nodeAt(pos);
    // If this is part of a col-spanning cell
    if (
      (col > 0 && map.map[index - 1] == pos) ||
      (col < map.width - 1 && map.map[index + 1] == pos)
    ) {
      tr.setNodeMarkup(
        tr.mapping.slice(mapStart).map(tableStart + pos),
        null,
        removeColSpan(cell.attrs, col - map.colCount(pos)),
      );
    } else {
      let start = tr.mapping.slice(mapStart).map(tableStart + pos);
      tr.delete(start, start + cell.nodeSize);
    }
    row += cell.attrs.rowspan;
  }
}

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Command function that removes the selected columns from a table.
export function deleteColumn(state, dispatch) {
  if (!isInTable(state)) return false;
  if (dispatch) {
    let rect = selectedRect(state),
      tr = state.tr;
    if (rect.left == 0 && rect.right == rect.map.width) return false;
    for (let i = rect.right - 1; ; i--) {
      removeColumn(tr, rect, i);
      if (i == rect.left) break;
      rect.table = rect.tableStart
        ? tr.doc.nodeAt(rect.tableStart - 1)
        : tr.doc;
      rect.map = TableMap.get(rect.table);
    }
    dispatch(tr);
  }
  return true;
}

export function rowIsHeader(map, table, row) {
  let headerCell = tableNodeTypes(table.type.schema).header_cell;
  for (let col = 0; col < map.width; col++)
    if (table.nodeAt(map.map[col + row * map.width]).type != headerCell)
      return false;
  return true;
}

export function addRow(tr, { map, tableStart, table }, row) {
  let rowPos = tableStart;
  for (let i = 0; i < row; i++) rowPos += table.child(i).nodeSize;
  let cells = [],
    refRow = row > 0 ? -1 : 0;
  if (rowIsHeader(map, table, row + refRow))
    refRow = row == 0 || row == map.height ? null : 0;
  for (let col = 0, index = map.width * row; col < map.width; col++, index++) {
    // Covered by a rowspan cell
    if (
      row > 0 &&
      row < map.height &&
      map.map[index] == map.map[index - map.width]
    ) {
      let pos = map.map[index],
        attrs = table.nodeAt(pos).attrs;
      tr.setNodeMarkup(
        tableStart + pos,
        null,
        setAttr(attrs, 'rowspan', attrs.rowspan + 1),
      );
      col += attrs.colspan - 1;
    } else {
      let type =
        refRow == null
          ? tableNodeTypes(table.type.schema).cell
          : table.nodeAt(map.map[index + refRow * map.width]).type;
      cells.push(type.createAndFill());
    }
  }
  tr.insert(rowPos, tableNodeTypes(table.type.schema).row.create(null, cells));
  return tr;
}

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Add a table row before the selection.
export function addRowBefore(state, dispatch) {
  if (!isInTable(state)) return false;
  if (dispatch) {
    let rect = selectedRect(state);
    dispatch(addRow(state.tr, rect, rect.top));
  }
  return true;
}

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Add a table row after the selection.
export function addRowAfter(state, dispatch) {
  if (!isInTable(state)) return false;
  if (dispatch) {
    let rect = selectedRect(state);
    dispatch(addRow(state.tr, rect, rect.bottom));
  }
  return true;
}

export function removeRow(tr, { map, table, tableStart }, row) {
  let rowPos = 0;
  for (let i = 0; i < row; i++) rowPos += table.child(i).nodeSize;
  let nextRow = rowPos + table.child(row).nodeSize;

  let mapFrom = tr.mapping.maps.length;
  tr.delete(rowPos + tableStart, nextRow + tableStart);

  for (let col = 0, index = row * map.width; col < map.width; col++, index++) {
    let pos = map.map[index];
    if (row > 0 && pos == map.map[index - map.width]) {
      // If this cell starts in the row above, simply reduce its rowspan
      let attrs = table.nodeAt(pos).attrs;
      tr.setNodeMarkup(
        tr.mapping.slice(mapFrom).map(pos + tableStart),
        null,
        setAttr(attrs, 'rowspan', attrs.rowspan - 1),
      );
      col += attrs.colspan - 1;
    } else if (row < map.width && pos == map.map[index + map.width]) {
      // Else, if it continues in the row below, it has to be moved down
      let cell = table.nodeAt(pos);
      let copy = cell.type.create(
        setAttr(cell.attrs, 'rowspan', cell.attrs.rowspan - 1),
        cell.content,
      );
      let newPos = map.positionAt(row + 1, col, table);
      tr.insert(tr.mapping.slice(mapFrom).map(tableStart + newPos), copy);
      col += cell.attrs.colspan - 1;
    }
  }
}

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Remove the selected rows from a table.
export function deleteRow(state, dispatch) {
  if (!isInTable(state)) return false;
  if (dispatch) {
    let rect = selectedRect(state),
      tr = state.tr;
    if (rect.top == 0 && rect.bottom == rect.map.height) return false;
    for (let i = rect.bottom - 1; ; i--) {
      removeRow(tr, rect, i);
      if (i == rect.top) break;
      rect.table = rect.tableStart
        ? tr.doc.nodeAt(rect.tableStart - 1)
        : tr.doc;
      rect.map = TableMap.get(rect.table);
    }
    dispatch(tr);
  }
  return true;
}

function isEmpty(cell) {
  let c = cell.content;
  return (
    c.childCount == 1 &&
    c.firstChild.isTextblock &&
    c.firstChild.childCount == 0
  );
}

function cellsOverlapRectangle({ width, height, map }, rect) {
  let indexTop = rect.top * width + rect.left,
    indexLeft = indexTop;
  let indexBottom = (rect.bottom - 1) * width + rect.left,
    indexRight = indexTop + (rect.right - rect.left - 1);
  for (let i = rect.top; i < rect.bottom; i++) {
    if (
      (rect.left > 0 && map[indexLeft] == map[indexLeft - 1]) ||
      (rect.right < width && map[indexRight] == map[indexRight + 1])
    )
      return true;
    indexLeft += width;
    indexRight += width;
  }
  for (let i = rect.left; i < rect.right; i++) {
    if (
      (rect.top > 0 && map[indexTop] == map[indexTop - width]) ||
      (rect.bottom < height && map[indexBottom] == map[indexBottom + width])
    )
      return true;
    indexTop++;
    indexBottom++;
  }
  return false;
}

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Merge the selected cells into a single cell. Only available when
// the selected cells' outline forms a rectangle.
export function mergeCells(state, dispatch) {
  let sel = state.selection;
  if (
    !(sel instanceof CellSelection) ||
    sel.$anchorCell.pos == sel.$headCell.pos
  )
    return false;
  let rect = selectedRect(state),
    { map } = rect;
  if (cellsOverlapRectangle(map, rect)) return false;
  if (dispatch) {
    let tr = state.tr,
      seen = {},
      content = Fragment.empty,
      mergedPos,
      mergedCell;
    for (let row = rect.top; row < rect.bottom; row++) {
      for (let col = rect.left; col < rect.right; col++) {
        let cellPos = map.map[row * map.width + col],
          cell = rect.table.nodeAt(cellPos);
        if (seen[cellPos]) continue;
        seen[cellPos] = true;
        if (mergedPos == null) {
          mergedPos = cellPos;
          mergedCell = cell;
        } else {
          if (!isEmpty(cell)) content = content.append(cell.content);
          let mapped = tr.mapping.map(cellPos + rect.tableStart);
          tr.delete(mapped, mapped + cell.nodeSize);
        }
      }
    }
    tr.setNodeMarkup(
      mergedPos + rect.tableStart,
      null,
      setAttr(
        addColSpan(
          mergedCell.attrs,
          mergedCell.attrs.colspan,
          rect.right - rect.left - mergedCell.attrs.colspan,
        ),
        'rowspan',
        rect.bottom - rect.top,
      ),
    );
    if (content.size) {
      let end = mergedPos + 1 + mergedCell.content.size;
      let start = isEmpty(mergedCell) ? mergedPos + 1 : end;
      tr.replaceWith(start + rect.tableStart, end + rect.tableStart, content);
    }
    tr.setSelection(
      new CellSelection(tr.doc.resolve(mergedPos + rect.tableStart)),
    );
    dispatch(tr);
  }
  return true;
}
// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Split a selected cell, whose rowpan or colspan is greater than one,
// into smaller cells. Use the first cell type for the new cells.
export function splitCell(state, dispatch) {
  const nodeTypes = tableNodeTypes(state.schema);
  return splitCellWithType(({ node }) => {
    return nodeTypes[node.type.spec.tableRole];
  })(state, dispatch);
}

// :: (getCellType: ({ row: number, col: number, node: Node}) → NodeType) → (EditorState, dispatch: ?(tr: Transaction)) → bool
// Split a selected cell, whose rowpan or colspan is greater than one,
// into smaller cells with the cell type (th, td) returned by getType function.
export function splitCellWithType(getCellType) {
  return (state, dispatch) => {
    let sel = state.selection;
    let cellNode, cellPos;
    if (!(sel instanceof CellSelection)) {
      cellNode = cellWrapping(sel.$from);
      if (!cellNode) return false;
      cellPos = cellAround(sel.$from).pos;
    } else {
      if (sel.$anchorCell.pos != sel.$headCell.pos) return false;
      cellNode = sel.$anchorCell.nodeAfter;
      cellPos = sel.$anchorCell.pos;
    }
    if (cellNode.attrs.colspan == 1 && cellNode.attrs.rowspan == 1) {
      return false;
    }
    if (dispatch) {
      let baseAttrs = cellNode.attrs,
        attrs = [],
        colwidth = baseAttrs.colwidth;
      if (baseAttrs.rowspan > 1) baseAttrs = setAttr(baseAttrs, 'rowspan', 1);
      if (baseAttrs.colspan > 1) baseAttrs = setAttr(baseAttrs, 'colspan', 1);
      let rect = selectedRect(state),
        tr = state.tr;
      for (let i = 0; i < rect.right - rect.left; i++)
        attrs.push(
          colwidth
            ? setAttr(
                baseAttrs,
                'colwidth',
                colwidth && colwidth[i] ? [colwidth[i]] : null,
              )
            : baseAttrs,
        );
      let lastCell;
      for (let row = rect.top; row < rect.bottom; row++) {
        let pos = rect.map.positionAt(row, rect.left, rect.table);
        if (row == rect.top) pos += cellNode.nodeSize;
        for (let col = rect.left, i = 0; col < rect.right; col++, i++) {
          if (col == rect.left && row == rect.top) continue;
          tr.insert(
            (lastCell = tr.mapping.map(pos + rect.tableStart, 1)),
            getCellType({ node: cellNode, row, col }).createAndFill(attrs[i]),
          );
        }
      }
      tr.setNodeMarkup(
        cellPos,
        getCellType({ node: cellNode, row: rect.top, col: rect.left }),
        attrs[0],
      );
      if (sel instanceof CellSelection)
        tr.setSelection(
          new CellSelection(
            tr.doc.resolve(sel.$anchorCell.pos),
            lastCell && tr.doc.resolve(lastCell),
          ),
        );
      dispatch(tr);
    }
    return true;
  };
}

// :: (string, any) → (EditorState, dispatch: ?(tr: Transaction)) → bool
// Returns a command that sets the given attribute to the given value,
// and is only available when the currently selected cell doesn't
// already have that attribute set to that value.
export function setCellAttr(name, value) {
  return function (state, dispatch) {
    if (!isInTable(state)) return false;
    let $cell = selectionCell(state);
    if ($cell.nodeAfter.attrs[name] === value) return false;
    if (dispatch) {
      let tr = state.tr;
      if (state.selection instanceof CellSelection)
        state.selection.forEachCell((node, pos) => {
          if (node.attrs[name] !== value)
            tr.setNodeMarkup(pos, null, setAttr(node.attrs, name, value));
        });
      else
        tr.setNodeMarkup(
          $cell.pos,
          null,
          setAttr($cell.nodeAfter.attrs, name, value),
        );
      dispatch(tr);
    }
    return true;
  };
}

function deprecated_toggleHeader(type) {
  return function (state, dispatch) {
    if (!isInTable(state)) return false;
    if (dispatch) {
      let types = tableNodeTypes(state.schema);
      let rect = selectedRect(state),
        tr = state.tr;
      let cells = rect.map.cellsInRect(
        type == 'column'
          ? new Rect(rect.left, 0, rect.right, rect.map.height)
          : type == 'row'
          ? new Rect(0, rect.top, rect.map.width, rect.bottom)
          : rect,
      );
      let nodes = cells.map((pos) => rect.table.nodeAt(pos));
      for (
        let i = 0;
        i < cells.length;
        i++ // Remove headers, if any
      )
        if (nodes[i].type == types.header_cell)
          tr.setNodeMarkup(
            rect.tableStart + cells[i],
            types.cell,
            nodes[i].attrs,
          );
      if (tr.steps.length == 0)
        for (
          let i = 0;
          i < cells.length;
          i++ // No headers removed, add instead
        )
          tr.setNodeMarkup(
            rect.tableStart + cells[i],
            types.header_cell,
            nodes[i].attrs,
          );
      dispatch(tr);
    }
    return true;
  };
}

function isHeaderEnabledByType(type, rect, types) {
  // Get cell positions for first row or first column
  const cellPositions = rect.map.cellsInRect({
    left: 0,
    top: 0,
    right: type == 'row' ? rect.map.width : 1,
    bottom: type == 'column' ? rect.map.height : 1,
  });

  for (let i = 0; i < cellPositions.length; i++) {
    const cell = rect.table.nodeAt(cellPositions[i]);
    if (cell && cell.type !== types.header_cell) {
      return false;
    }
  }

  return true;
}

// :: (string, ?{ useDeprecatedLogic: bool }) → (EditorState, dispatch: ?(tr: Transaction)) → bool
// Toggles between row/column header and normal cells (Only applies to first row/column).
// For deprecated behavior pass `useDeprecatedLogic` in options with true.
export function toggleHeader(type, options) {
  options = options || { useDeprecatedLogic: false };

  if (options.useDeprecatedLogic) return deprecated_toggleHeader(type);

  return function (state, dispatch) {
    if (!isInTable(state)) return false;
    if (dispatch) {
      let types = tableNodeTypes(state.schema);
      let rect = selectedRect(state),
        tr = state.tr;

      let isHeaderRowEnabled = isHeaderEnabledByType('row', rect, types);
      let isHeaderColumnEnabled = isHeaderEnabledByType('column', rect, types);

      let isHeaderEnabled =
        type === 'column'
          ? isHeaderRowEnabled
          : type === 'row'
          ? isHeaderColumnEnabled
          : false;

      let selectionStartsAt = isHeaderEnabled ? 1 : 0;

      let cellsRect =
        type == 'column'
          ? new Rect(0, selectionStartsAt, 1, rect.map.height)
          : type == 'row'
          ? new Rect(selectionStartsAt, 0, rect.map.width, 1)
          : rect;

      let newType =
        type == 'column'
          ? isHeaderColumnEnabled
            ? types.cell
            : types.header_cell
          : type == 'row'
          ? isHeaderRowEnabled
            ? types.cell
            : types.header_cell
          : types.cell;

      rect.map.cellsInRect(cellsRect).forEach((relativeCellPos) => {
        const cellPos = relativeCellPos + rect.tableStart;
        const cell = tr.doc.nodeAt(cellPos);

        if (cell) {
          tr.setNodeMarkup(cellPos, newType, cell.attrs);
        }
      });

      dispatch(tr);
    }
    return true;
  };
}

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Toggles whether the selected row contains header cells.
export let toggleHeaderRow = toggleHeader('row', { useDeprecatedLogic: true });

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Toggles whether the selected column contains header cells.
export let toggleHeaderColumn = toggleHeader('column', {
  useDeprecatedLogic: true,
});

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Toggles whether the selected cells are header cells.
export let toggleHeaderCell = toggleHeader('cell', {
  useDeprecatedLogic: true,
});

function findNextCell($cell, dir) {
  if (dir < 0) {
    let before = $cell.nodeBefore;
    if (before) return $cell.pos - before.nodeSize;
    for (
      let row = $cell.index(-1) - 1, rowEnd = $cell.before();
      row >= 0;
      row--
    ) {
      let rowNode = $cell.node(-1).child(row);
      if (rowNode.childCount) return rowEnd - 1 - rowNode.lastChild.nodeSize;
      rowEnd -= rowNode.nodeSize;
    }
  } else {
    if ($cell.index() < $cell.parent.childCount - 1)
      return $cell.pos + $cell.nodeAfter.nodeSize;
    let table = $cell.node(-1);
    for (
      let row = $cell.indexAfter(-1), rowStart = $cell.after();
      row < table.childCount;
      row++
    ) {
      let rowNode = table.child(row);
      if (rowNode.childCount) return rowStart + 1;
      rowStart += rowNode.nodeSize;
    }
  }
}

// :: (number) → (EditorState, dispatch: ?(tr: Transaction)) → bool
// Returns a command for selecting the next (direction=1) or previous
// (direction=-1) cell in a table.
export function goToNextCell(direction) {
  return function (state, dispatch) {
    if (!isInTable(state)) return false;
    let cell = findNextCell(selectionCell(state), direction);
    if (cell == null) return;
    if (dispatch) {
      let $cell = state.doc.resolve(cell);
      dispatch(
        state.tr
          .setSelection(TextSelection.between($cell, moveCellForward($cell)))
          .scrollIntoView(),
      );
    }
    return true;
  };
}

// :: (EditorState, ?(tr: Transaction)) → bool
// Deletes the table around the selection, if any.
export function deleteTable(state, dispatch) {
  let $pos = state.selection.$anchor;
  for (let d = $pos.depth; d > 0; d--) {
    let node = $pos.node(d);
    if (node.type.spec.tableRole == 'table') {
      if (dispatch)
        dispatch(
          state.tr.delete($pos.before(d), $pos.after(d)).scrollIntoView(),
        );
      return true;
    }
  }
  return false;
}
