const {NodeSelection} = require("prosemirror-state")

const {TableMap} = require("./tablemap")
const {CellSelection} = require("./cellselection")
const {setAttr, cellAround} = require("./util")

function isInTable(state) {
  let $head = state.selection.$head
  for (let d = $head.depth; d > 0; d--) if ($head.node(d).type.name == "table_row") return true
  return false
}

function selectedRect(state) {
  let sel = state.selection, cellSel = sel instanceof CellSelection
  let $pos = cellSel ? sel.$anchorCell
      : (sel instanceof NodeSelection) && sel.$from.parent.type.name == "table_row" ? sel.$from
      : state.doc.resolve(cellAround(sel.$head))
  let table = $pos.node(-1), tableStart = $pos.start(-1), map = TableMap.get(table)
  let left, right, top, bottom
  if (cellSel) {
    let anchor = map.findCell(sel.$anchorCell.pos - tableStart)
    let head = map.findCell(sel.$headCell.pos - tableStart)
    left = Math.min(anchor.left, head.left); top = Math.min(anchor.top, head.top)
    right = Math.max(anchor.right, head.right); bottom = Math.max(anchor.bottom, head.bottom)
  } else {
    ;({left, right, top, bottom} = map.findCell($pos.pos - tableStart))
  }
  return {left, right, top, bottom, table, tableStart, map}
}

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

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Command to add a column before the column with the selection.
function addColumnBefore(state, dispatch) {
  if (!isInTable(state)) return false
  if (dispatch) {
    let rect = selectedRect(state)
    dispatch(addColumn(state.tr, rect, rect.left))
  }
  return true
}
exports.addColumnBefore = addColumnBefore

// :: (EditorState, dispatch: ?(tr: Transaction)) → bool
// Command to add a column after the column with the selection.
function addColumnAfter(state, dispatch) {
  if (!isInTable(state)) return false
  if (dispatch) {
    let rect = selectedRect(state)
    dispatch(addColumn(state.tr, rect, rect.right))
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
    let rect = selectedRect(state), tr = state.tr
    for (let i = rect.right - 1;; i--) {
      removeColumn(tr, rect, i)
      if (i == rect.left) break
      rect.table = rect.tableStart ? tr.doc.nodeAt(rect.tableStart - 1) : tr.doc
      rect.map = TableMap.get(rect.table)
    }
    dispatch(tr)
  }
  return true
}
exports.deleteColumn = deleteColumn

function addRow(tr, {map, tableStart, table}, row) {
  let rowPos = tableStart
  for (let i = 0; i < row; i++) rowPos += table.child(i).nodeSize
  let cells = [], index = map.width * row
  for (let col = 0, index = map.width * row; col < map.width; col++, index++) {
    // Covered by a rowspan cell
    if (row > 0 && row < map.height && map.map[index] == map.map[index - map.width]) {
      let pos = map.map[index], cell = table.nodeAt(pos)
      tr.setNodeType(tableStart + pos, null, setAttr(cell.attrs, "rowspan", cell.attrs.rowspan + 1))
      col += cell.attrs.colspan - 1
    } else {
      cells.push(table.type.schema.nodes.table_cell.createAndFill())
    }
  }
  tr.insert(rowPos, table.type.schema.node("table_row", null, cells))
  return tr
}

function addRowBefore(state, dispatch) {
  if (!isInTable(state)) return false
  if (dispatch) {
    let rect = selectedRect(state)
    dispatch(addRow(state.tr, rect, rect.top))
  }
  return true
}
exports.addRowBefore = addRowBefore

function addRowAfter(state, dispatch) {
  if (!isInTable(state)) return false
  if (dispatch) {
    let rect = selectedRect(state)
    dispatch(addRow(state.tr, rect, rect.bottom))
  }
  return true
}
exports.addRowAfter = addRowAfter
