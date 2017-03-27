const {TextSelection} = require("prosemirror-state")
const {Fragment} = require("prosemirror-model")

const {TableMap} = require("./tablemap")
const {CellSelection} = require("./cellselection")
const {setAttr, moveCellForward, isInTable, selectionCell} = require("./util")

function selectedRect(state) {
  let sel = state.selection, $pos = selectionCell(state)
  let table = $pos.node(-1), tableStart = $pos.start(-1), map = TableMap.get(table)
  let rect
  if (sel instanceof CellSelection)
    rect = map.rectBetween(sel.$anchorCell.pos - tableStart, sel.$headCell.pos - tableStart)
  else
    rect = map.findCell($pos.pos - tableStart)
  rect.tableStart = tableStart
  rect.map = map
  rect.table = table
  return rect
}

function addColumn(tr, {map, tableStart, table}, col) {
  for (let row = 0; row < map.height; row++) {
    let index = row * map.width + col
    // If this position falls inside a col-spanning cell
    if (col > 0 && col < map.width && map.map[index - 1] == map.map[index]) {
      let pos = map.map[index], cell = table.nodeAt(pos)
      tr.setNodeType(tr.mapping.map(tableStart + pos), null,
                     setAttr(cell.attrs, "colspan", cell.attrs.colspan + 1))
      // Skip ahead if rowspan > 1
      row += cell.attrs.rowspan - 1
    } else {
      let pos = map.positionAt(row, col, table)
      tr.insert(tr.mapping.map(tableStart + pos), table.type.schema.nodes.table_cell.createAndFill())
    }
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
  let cells = []
  for (let col = 0, index = map.width * row; col < map.width; col++, index++) {
    // Covered by a rowspan cell
    if (row > 0 && row < map.height && map.map[index] == map.map[index - map.width]) {
      let pos = map.map[index], attrs = table.nodeAt(pos).attrs
      tr.setNodeType(tableStart + pos, null, setAttr(attrs, "rowspan", attrs.rowspan + 1))
      col += attrs.colspan - 1
    } else {
      cells.push(table.type.schema.nodes.table_cell.createAndFill())
    }
  }
  tr.insert(rowPos, table.type.schema.nodes.table_row.create(null, cells))
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

function removeRow(tr, {map, table, tableStart}, row) {
  let rowPos = 0
  for (let i = 0; i < row; i++) rowPos += table.child(i).nodeSize
  let nextRow = rowPos + table.child(row).nodeSize

  let mapFrom = tr.mapping.maps.length
  tr.delete(rowPos + tableStart, nextRow + tableStart)

  for (let col = 0, index = row * map.width; col < map.width; col++, index++) {
    let pos = map.map[index]
    if (row > 0 && pos == map.map[index - map.width]) {
      // If this cell starts in the row above, simply reduce its rowspan
      let attrs = table.nodeAt(pos).attrs
      tr.setNodeType(tr.mapping.slice(mapFrom).map(pos + tableStart), null, setAttr(attrs, "rowspan", attrs.rowspan - 1))
      col += attrs.colspan - 1
    } else if (row < map.width && pos == map.map[index + map.width]) {
      // Else, if it continues in the row below, it has to be moved down
      let cell = table.nodeAt(pos)
      let copy = cell.type.create(setAttr(cell.attrs, "rowspan", cell.attrs.rowspan - 1), cell.content)
      let newPos = map.positionAt(row + 1, col, table)
      tr.insert(tr.mapping.slice(mapFrom).map(tableStart + newPos), copy)
      col += cell.attrs.colspan - 1
    }
  }
}

function deleteRow(state, dispatch) {
  if (!isInTable(state)) return false
  if (dispatch) {
    let rect = selectedRect(state), tr = state.tr
    for (let i = rect.bottom - 1;; i--) {
      removeRow(tr, rect, i)
      if (i == rect.top) break
      rect.table = rect.tableStart ? tr.doc.nodeAt(rect.tableStart - 1) : tr.doc
      rect.map = TableMap.get(rect.table)
    }
    dispatch(tr)
  }
  return true
}
exports.deleteRow = deleteRow

function isEmpty(cell) {
  let c = cell.content
  return c.childCount == 1 && c.firstChild.isTextblock && c.firstChild.childCount == 0
}

function cellsOverlapRectangle({width, height, map}, rect) {
  let indexTop = rect.top * width + rect.left, indexLeft = indexTop
  let indexBottom = (rect.bottom - 1) * width + rect.left, indexRight = indexTop + (rect.right - rect.left - 1)
  for (let i = rect.top; i < rect.bottom; i++) {
    if (rect.left > 0 && map[indexLeft] == map[indexLeft - 1] ||
        rect.right < width && map[indexRight] == map[indexRight + 1]) return true
    indexLeft += width; indexRight += width
  }
  for (let i = rect.left; i < rect.right; i++) {
    if (rect.top > 0 && map[indexTop] == map[indexTop - width] ||
        rect.bottom < height && map[indexBottom] == map[indexBottom + width]) return true
    indexTop++; indexBottom++
  }
  return false
}

function mergeCells(state, dispatch) {
  let sel = state.selection
  if (!(sel instanceof CellSelection) || sel.$anchorCell.pos == sel.$headCell.pos) return false
  let rect = selectedRect(state), {map} = rect
  if (cellsOverlapRectangle(map, rect)) return false
  if (dispatch) {
    let tr = state.tr, seen = [], content = Fragment.empty, mergedPos, mergedCell
    for (let row = rect.top; row < rect.bottom; row++) {
      for (let col = rect.left; col < rect.right; col++) {
        let cellPos = map.map[row * map.width + col], cell = rect.table.nodeAt(cellPos)
        if (seen.indexOf(cellPos) > -1) continue
        seen.push(cellPos)
        if (mergedPos == null) {
          mergedPos = cellPos
          mergedCell = cell
        } else {
          if (!isEmpty(cell)) content = content.append(cell.content)
          let mapped = tr.mapping.map(cellPos + rect.tableStart)
          tr.delete(mapped, mapped + cell.nodeSize)
        }
      }
    }
    tr.setNodeType(mergedPos + rect.tableStart, null,
                   setAttr(setAttr(mergedCell.attrs, "colspan", rect.right - rect.left),
                           "rowspan", rect.bottom - rect.top))
    if (content.size) {
      let end = mergedPos + 1 + mergedCell.content.size
      let start = isEmpty(mergedCell) ? mergedPos + 1 : end
      tr.replaceWith(start + rect.tableStart, end + rect.tableStart, content)
    }
    tr.setSelection(new CellSelection(tr.doc.resolve(mergedPos + rect.tableStart)))
    dispatch(tr)
  }
  return true
}
exports.mergeCells = mergeCells

function splitCell(state, dispatch) {
  let sel = state.selection
  if (!(sel instanceof CellSelection) || sel.$anchorCell.pos != sel.$headCell.pos) return false
  let cellNode = sel.$anchorCell.nodeAfter
  if (cellNode.attrs.colspan == 1 && cellNode.attrs.rowspan == 1) return false
  if (dispatch) {
    let attrs = setAttr(setAttr(cellNode.attrs, "colspan", 1), "rowspan", 1)
    let rect = selectedRect(state), tr = state.tr
    let newCell = state.schema.nodes.table_cell.createAndFill(attrs)
    let lastCell
    for (let row = 0; row < rect.bottom; row++) {
      if (row >= rect.top) {
        let pos = rect.map.positionAt(row, rect.left, rect.table)
        if (row == rect.top) pos += cellNode.nodeSize
        for (let col = rect.left; col < rect.right; col++) {
          if (col == rect.left && row == rect.top) continue
          tr.insert(lastCell = tr.mapping.map(pos + rect.tableStart, 1), newCell)
        }
      }
    }
    tr.setNodeType(sel.$anchorCell.pos, null, attrs)
    tr.setSelection(new CellSelection(tr.doc.resolve(sel.$anchorCell.pos),
                                      lastCell && tr.doc.resolve(lastCell)))
    dispatch(tr)
  }
  return true
}
exports.splitCell = splitCell

function setCellAttr(name, value) {
  return function(state, dispatch) {
    if (!isInTable(state)) return false
    let $cell = selectionCell(state)
    if ($cell.nodeAfter.attrs[name] === value) return false
    if (dispatch) {
      let tr = state.tr
      if (state.selection instanceof CellSelection)
        state.selection.forEachCell((node, pos) => {
          if (node.attrs[name] !== value)
            tr.setNodeType(pos, null, setAttr(node.attrs, name, value))
        })
      else
        tr.setNodeType($cell.pos, null, setAttr($cell.nodeAfter.attrs, name, value))
      dispatch(tr)
    }
    return true
  }
}
exports.setCellAttr = setCellAttr

function setTableHeader(side, value) {
  return function(state, dispatch) {
    if (!isInTable(state)) return false
    let $cell = selectionCell(state), table = $cell.node(-1)
    let attr = table.attrs.header, on = attr == "both" || attr == side
    if (on == !!value) return false
    if (dispatch) {
      let newAttr = value ? (attr ? "both" : side) : (attr == "both" ? (side == "left" ? "top" : "left") : null)
      dispatch(state.tr.setNodeType($cell.before(-1), null, setAttr(table.attrs, "header", newAttr)))
    }
    return true
  }
}
exports.setTableHeader = setTableHeader

function findNextCell($cell, dir) {
  if (dir < 0) {
    let before = $cell.nodeBefore
    if (before) return $cell.pos - before.nodeSize
    for (let row = $cell.index(-1) - 1, rowEnd = $cell.before(); row >= 0; row--) {
      let rowNode = $cell.node(-1).child(row)
      if (rowNode.childCount) return rowEnd - 1 - rowNode.lastChild.nodeSize
      rowEnd -= rowNode.nodeSize
    }
  } else {
    if ($cell.index() < $cell.parent.childCount - 1) return $cell.pos + $cell.nodeAfter.nodeSize
    let table = $cell.node(-1)
    for (let row = $cell.indexAfter(-1), rowStart = $cell.after(); row < table.childCount; row++) {
      let rowNode = table.child(row)
      if (rowNode.childCount) return rowStart + 1
      rowStart += rowNode.nodeSize
    }
  }
}

function goToNextCell(direction) {
  return function(state, dispatch) {
    if (!isInTable(state) || state.selection instanceof CellSelection) return false
    let cell = findNextCell(selectionCell(state), direction)
    if (cell == null) return
    if (dispatch) {
      let $cell = state.doc.resolve(cell)
      dispatch(state.tr.setSelection(TextSelection.between($cell, moveCellForward($cell))).scrollIntoView())
    }
    return true
  }
}
exports.goToNextCell = goToNextCell
