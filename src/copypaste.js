const {Slice, Fragment} = require("prosemirror-model")
const {Transform} = require("prosemirror-transform")

const {setAttr} = require("./util")
const {TableMap} = require("./tablemap")
const {CellSelection} = require("./cellselection")

// Utilities to help with copying and pasting table cells

// :: (Slice) → ?{width: number, height: number, rows: [Fragment]}
// Get a rectangular area of cells from a slice, or null if the outer
// nodes of the slice aren't table cells or rows.
exports.pastedCells = function(slice) {
  if (!slice.size) return null
  let {content, openLeft, openRight} = slice
  while (content.childCount == 1 && (openLeft > 0 && openRight > 0 || content.firstChild.type.name == "table")) {
    openLeft--
    openRight--
    content = content.firstChild.content
  }
  let first = content.firstChild, type = first.type.name
  let schema = first.type.schema, rows = []
  if (type == "table_row") {
    for (let i = 0; i < content.childCount; i++) {
      let cells = content.child(i).content
      let left = i ? 0 : Math.max(0, openLeft - 1)
      let right = i < content.childCount - 1 ? 0 : Math.max(0, openRight - 1)
      if (left || right) cells = fitSlice(schema.nodes.table_row, new Slice(cells, left, right)).content
      rows.push(cells)
    }
  } else if (type == "table_cell") {
    rows.push(openLeft || openRight ? fitSlice(schema.nodes.table_row, new Slice(content, openLeft, openRight)).content : content)
  } else {
    return null
  }
  return ensureRectangular(schema, rows)
}

// :: [Fragment] → {width: number, height: number, rows: [Fragment]}
// Compute the width and height of a set of cells, and make sure each
// row has the same number of cells.
function ensureRectangular(schema, rows) {
  let widths = []
  for (let i = 0; i < rows.length; i++) {
    let row = rows[i]
    for (let j = row.childCount - 1; j >= 0; j--) {
      let {rowspan, colspan} = row.child(j).attrs
      for (let r = i; r < i + rowspan; r++)
        widths[r] = (widths[r] || 0) + colspan
    }
  }
  let width = 0
  for (let r = 0; r < widths.length; r++) width = Math.max(width, widths[r])
  for (let r = 0; r < widths.length; r++) {
    if (r >= rows.length) rows.push(Fragment.empty)
    if (widths[r] < width) {
      let empty = schema.nodes.table_cell.createAndFill(), cells = []
      for (let i = widths[r]; i < width; i++) cells.push(empty)
      rows[r] = rows[r].append(Fragment.from(cells))
    }
  }
  return {height: rows.length, width, rows}
}

function fitSlice(nodeType, slice) {
  let node = nodeType.createAndFill()
  let tr = new Transform(node).replace(0, node.content.size, slice)
  return tr.doc
}

// Make sure a table has at least the given width and height. Return
// true if something was changed.
function growTable(tr, map, table, start, width, height, mapFrom) {
  let schema = tr.doc.type.schema, empty
  if (width > map.width) {
    empty = schema.nodes.table_cell.createAndFill()
    for (let row = 0, rowEnd = 0; row < map.height; row++) {
      rowEnd += table.child(row).nodeSize
      let cells = []
      for (let i = map.width; i < width; i++) cells.push(empty)
      tr.insert(tr.mapping.slice(mapFrom).map(rowEnd - 1 + start), cells)
    }
  }
  if (height > map.height) {
    empty = empty || schema.nodes.table_cell.createAndFill()
    let cells = []
    for (let i = 0; i < Math.max(map.width, width); i++) cells.push(empty)
    let emptyRow = schema.nodes.table_row.create(null, Fragment.from(cells)), rows = []
    for (let i = map.height; i < height; i++) rows.push(emptyRow)
    tr.insert(tr.mapping.slice(mapFrom).map(start + table.nodeSize - 2), rows)
  }
  return !!empty
}

// Make sure the given line (left, top) to (right, top) doesn't cross
// any rowspan cells by splitting cells that cross it. Return true if
// something changed.
function isolateHorizontal(tr, map, table, start, left, right, top, mapFrom) {
  if (top == 0 || top == map.height) return false
  let found = false
  for (let col = left; col < right; col++) {
    let index = top * map.width + col, pos = map.map[index]
    if (map.map[index - map.width] == pos) {
      found = true
      let cell = table.nodeAt(pos)
      let {top: cellTop, left: cellLeft} = map.findCell(pos)
      tr.setNodeType(tr.mapping.slice(mapFrom).map(pos + start), null, setAttr(cell.attrs, "rowspan", top - cellTop))
      tr.insert(tr.mapping.slice(mapFrom).map(map.positionAt(top, cellLeft, table)),
                cell.type.createAndFill(setAttr(cell.attrs, "rowspan", (cellTop + cell.attrs.rowspan) - top)))
      col += cell.attrs.colspan - 1
    }
  }
  return found
}

// Make sure the given line (left, top) to (left, bottom) doesn't
// cross any colspan cells by splitting cells that cross it. Return
// true if something changed.
function isolateVertical(tr, map, table, start, top, bottom, left, mapFrom) {
  if (left == 0 || left == map.width) return false
  let found = false
  for (let row = top; row < bottom; row++) {
    let index = row * map.width + left, pos = map.map[index]
    if (map.map[index - 1] == pos) {
      found = true
      let cell = table.nodeAt(pos), cellLeft = map.colCount(pos)
      let updatePos = tr.mapping.slice(mapFrom).map(pos + start)
      tr.setNodeType(updatePos, null, setAttr(cell.attrs, "colspan", left - cellLeft))
      tr.insert(updatePos + cell.nodeSize,
                cell.type.createAndFill(setAttr(cell.attrs, "colspan", (cellLeft + cell.attrs.colspan) - left)))
      row += cell.attrs.rowspan - 1
    }
  }
  return found
}

// Insert the given set of cells (as returned by `pastedCells`) into a
// table, starting at the cell pointed at by `$start`.
exports.insertCells = function(state, dispatch, $start, cells) {
  let table = $start.node(-1), map = TableMap.get(table), start = $start.start(-1)
  let {top, left} = map.findCell($start.pos - start)
  let right = left + cells.width, bottom = top + cells.height
  let tr = state.tr, mapFrom = 0
  function recomp() {
    table = start ? tr.doc.nodeAt(start - 1) : tr.doc
    map = TableMap.get(table)
    mapFrom = tr.mapping.maps.length
  }
  // Prepare the table to be large enough and not have any cells
  // crossing the boundaries of the rectangle that we want to
  // insert into. If anything about it changes, recompute the table
  // map so that subsequent operations can see the current shape.
  if (growTable(tr, map, table, start, right, bottom, mapFrom)) recomp()
  if (isolateHorizontal(tr, map, table, start, left, right, top, mapFrom)) recomp()
  if (isolateHorizontal(tr, map, table, start, left, right, bottom, mapFrom)) recomp()
  if (isolateVertical(tr, map, table, start, top, bottom, left, mapFrom)) recomp()
  if (isolateVertical(tr, map, table, start, top, bottom, right, mapFrom)) recomp()

  for (let row = top; row < bottom; row++) {
    let from = map.positionAt(row, left, table), to = map.positionAt(row, right, table)
    tr.replace(tr.mapping.slice(mapFrom).map(from + start), tr.mapping.slice(mapFrom).map(to + start),
               new Slice(cells.rows[row - top], 0, 0))
  }
  recomp()
  tr.setSelection(new CellSelection(tr.doc.resolve(start + map.positionAt(top, left, table)),
                                    tr.doc.resolve(start + map.positionAt(bottom - 1, right - 1, table))))
  dispatch(tr)
}
