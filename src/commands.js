const {TableMap} = require("./tablemap")
const {CellSelection} = require("./cellselection")
const {setAttr, cellAround} = require("./util")

function addColumn(tr, {map, tableStart, table}, col) {
  for (let row = 0, rowPos = 0; row < map.height; row++) {
    let index = row * map.width + col
    // If this position falls inside a col-spanning cell
    if (col > 0 && col < map.width && map.map[index - 1] == map.map[index]) {
      let pos = map.map[index], cell = table.nodeAt(pos)
      tr.setNodeType(tr.mapping.map(tableStart + pos), null,
                     setAttr(cell.attrs, "colspan", cell.attrs.colspan + 1))
      // Skip ahead if rowspan > 1
      for (let i = 1; i < cell.rowspan; i++) rowPos += table.child(row++).nodeSize
    } else {
      let rowEndIndex = (row + 1) * map.width
      // Skip past cells from previous rows (via rowspan)
      while (index < rowEndIndex && map.map[index] < rowPos) index++
      let pos = index == rowEndIndex ? rowPos + table.child(row).nodeSize - 1 : map.map[index]
      tr.insert(tr.mapping.map(tableStart + pos), table.type.schema.nodes.table_cell.createAndFill())
    }
    rowPos += table.child(row).nodeSize
  }
  return tr
}

function isInTable(state) {
  let $head = state.selection.$head
  for (let d = $head.depth; d > 0; d--) if ($head.node(d).type.name == "table_row") return true
  return false
}

function selectedColumns(state) {
  let cellSel = state.selection instanceof CellSelection
  let $pos = cellSel ? state.selection.$anchorCell : state.doc.resolve(cellAround(state.selection.$head))
  let table = $pos.node(-1), tableStart = $pos.start(-1), map = TableMap.get(table)
  let left, right
  if (cellSel) {
    let {left: lAnchor, right: rAnchor} = map.findCell(state.selection.$anchorCell.pos - tableStart)
    let {left: lHead, right: rHead} = map.findCell(state.selection.$headCell.pos - tableStart)
    left = Math.min(lAnchor, lHead)
    right = Math.max(rAnchor, rHead)
  } else {
    ;({left, right} = map.findCell($pos.pos - tableStart))
  }
  return {left, right, table, tableStart, map}
}

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Command to add a column before the column with the selection.
function addColumnBefore(state, dispatch) {
  if (!isInTable(state)) return false
  if (dispatch) {
    let cols = selectedColumns(state)
    dispatch(addColumn(state.tr, cols, cols.left))
  }
  return true
}
exports.addColumnBefore = addColumnBefore

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Command to add a column after the column with the selection.
function addColumnAfter(state, dispatch) {
  if (!isInTable(state)) return false
  if (dispatch) {
    let cols = selectedColumns(state)
    dispatch(addColumn(state.tr, cols, cols.right))
  }
  return true
}
exports.addColumnAfter = addColumnAfter

function removeColumn(tr, {map, table, tableStart}, col) {
  let mapStart = tr.mapping.maps.length
  for (let row = 0; row < map.height;) {
    let index = row * map.width + col, pos = map.map[index], cell = table.nodeAt(pos)
    // If this is part of a col-spanning cell
    if ((col > 0 && map.map[index - 1] == pos) || (col < map.width - 1 && map.map[index + 1] == pos)) {
      tr.setNodeType(tr.mapping.slice(mapStart).map(tableStart + pos), null,
                     setAttr(cell.attrs, "colspan", cell.attrs.colspan - 1))
    } else {
      let start = tr.mapping.slice(mapStart).map(tableStart + pos)
      tr.delete(start, start + cell.nodeSize)
    }
    row += cell.attrs.rowspan
  }
}

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Command function that removes the column with the selection.
function deleteColumn(state, dispatch) {
  if (!isInTable(state)) return false
  if (dispatch) {
    let cols = selectedColumns(state), tr = state.tr
    for (let i = cols.right - 1;; i--) {
      removeColumn(tr, cols, i)
      if (i == cols.left) break
      cols.table = cols.tableStart ? tr.doc.nodeAt(cols.tableStart - 1) : tr.doc
      cols.map = TableMap.get(cols.table)
    }
    dispatch(tr)
  }
  return true
}
exports.deleteColumn = deleteColumn
