const {Selection, TextSelection} = require("prosemirror-state")
const {Decoration, DecorationSet} = require("prosemirror-view")
const {Fragment, Slice} = require("prosemirror-model")

const {colCount, inSameTable, moveCellForward, moveCellBackward, pointsAtCell} = require("./util")
const {TableMap} = require("./tablemap")

class CellSelection extends Selection {
  constructor($anchorCell, $headCell = $anchorCell) {
    let aCol = colCount($anchorCell), bCol = colCount($headCell)
    if (aCol < bCol) super($anchorCell, moveCellForward($headCell))
    else super(moveCellForward($anchorCell), $headCell)
    this.$anchorCell = $anchorCell
    this.$headCell = $headCell
  }

  map(doc, mapping) {
    let $anchorCell = doc.resolve(mapping.map(this.$anchorCell.pos))
    let $headCell = doc.resolve(mapping.map(this.$headCell.pos))
    if (pointsAtCell($anchorCell) && pointsAtCell($headCell) && inSameTable($anchorCell, $headCell)) {
      let tableChanged = this.$anchorCell.node(-1) != $anchorCell.node(-1)
      if (tableChanged && this.isColSelection())
        return CellSelection.colSelection($anchorCell, $headCell)
      else if (tableChanged && this.isRowSelection())
        return CellSelection.rowSelection($anchorCell, $headCell)
      else
        return new CellSelection($anchorCell, $headCell)
    }
    return TextSelection.between($anchorCell, $headCell)
  }

  content() {
    let table = this.$anchorCell.node(-1), map = TableMap.get(table), start = this.$anchorCell.start(-1)
    let rect = map.rectBetween(this.$anchorCell.pos - start, this.$headCell.pos - start)
    let seen = [], rows = []
    for (let row = rect.top; row < rect.bottom; row++) {
      let rowContent = []
      for (let index = row * map.width + rect.left, col = rect.left; col < rect.right; col++, index++) {
        let pos = map.map[index]
        if (seen.indexOf(pos) == -1) {
          seen.push(pos)
          rowContent.push(table.nodeAt(pos))
        }
      }
      rows.push(table.child(row).copy(Fragment.from(rowContent)))
    }
    return new Slice(Fragment.from(rows), 1, 1)
  }

  forEachCell(f) {
    let table = this.$anchorCell.node(-1), map = TableMap.get(table), start = this.$anchorCell.start(-1)
    let cells = map.cellsInRect(map.rectBetween(this.$anchorCell.pos - start, this.$headCell.pos - start))
    for (let i = 0; i < cells.length; i++)
      f(table.nodeAt(cells[i]), start + cells[i])
  }

  isRowSelection() {
    let anchorTop = this.$anchorCell.index(-1), headTop = this.$headCell.index(-1)
    if (Math.min(anchorTop, headTop) > 0) return false
    let anchorBot = anchorTop + this.$anchorCell.nodeAfter.attrs.rowspan,
        headBot = headTop + this.$headCell.nodeAfter.attrs.rowspan
    return Math.max(anchorBot, headBot) == this.$headCell.node(-1).childCount
  }

  static rowSelection($anchorCell, $headCell) {
    let map = TableMap.get($anchorCell.node(-1)), start = $anchorCell.start(-1)
    let anchorRect = map.findCell($anchorCell.pos - start), headRect = map.findCell($headCell.pos - start)
    let doc = $anchorCell.node(0)
    if (anchorRect.top <= headRect.top) {
      if (anchorRect.top > 0)
        $anchorCell = doc.resolve(start + map.map[anchorRect.left])
      if (headRect.bottom < map.height)
        $headCell = doc.resolve(start + map.map[map.width * (map.height - 1) + headRect.right - 1])
    } else {
      if (headRect.top > 0)
        $headCell = doc.resolve(start + map.map[headRect.left])
      if (anchorRect.bottom < map.height)
        $anchorCell = doc.resolve(start + map.map[map.width * (map.height - 1) + anchorRect.right - 1])
    }
    return new CellSelection($anchorCell, $headCell)
  }

  isColSelection() {
    let map = TableMap.get(this.$anchorCell.node(-1)), start = this.$anchorCell.start(-1)
    let anchorLeft = map.colCount(this.$anchorCell.pos - start),
        headLeft = map.colCount(this.$headCell.pos - start)
    if (Math.min(anchorLeft, headLeft) > 0) return false
    let anchorRight = anchorLeft + this.$anchorCell.nodeAfter.attrs.colspan,
        headRight = headLeft + this.$headCell.nodeAfter.attrs.colspan
    return Math.max(anchorRight, headRight) == map.width
  }

  static colSelection($anchorCell, $headCell) {
    let map = TableMap.get($anchorCell.node(-1)), start = $anchorCell.start(-1)
    let anchorRect = map.findCell($anchorCell.pos - start), headRect = map.findCell($headCell.pos - start)
    let doc = $anchorCell.node(0)
    if (anchorRect.left <= headRect.left) {
      if (anchorRect.left > 0)
        $anchorCell = doc.resolve(start + map.map[anchorRect.top * map.width])
      if (headRect.right < map.width)
        $headCell = doc.resolve(start + map.map[map.width * (headRect.top + 1) - 1])
    } else {
      if (headRect.left > 0)
        $headCell = doc.resolve(start + map.map[headRect.top * map.width])
      if (anchorRect.right < map.width)
        $anchorCell = doc.resolve(start + map.map[map.width * (anchorRect.top + 1) - 1])
    }
    return new CellSelection($anchorCell, $headCell)
  }

  static fromJSON(doc, json) {
    let $anchor = doc.resolve(json.anchor), $head = doc.resolve(json.head)
    if ($anchor.pos != $head.pos &&
        $anchor.parent.type.name == "table_row" &&
        $head.parent.type.name == "table_row" &&
        $head.parent.childCount && $anchor.parent.childCount &&
        inSameTable($anchor, $head)) {
      let headAtEnd = $head.index() == $head.parent.childCount, anchorAtEnd = $anchor.index() == $anchor.parent.childCount
      if (!headAtEnd || !anchorAtEnd) {
        if (headAtEnd) {
          $head = moveCellBackward($head)
        } else if (anchorAtEnd) {
          $anchor = moveCellBackward($anchor)
        } else {
          let aCol = colCount($anchor), bCol = colCount($head)
          if (aCol < bCol) $head = moveCellBackward($head)
          else if (aCol > bCol) $anchor = moveCellBackward($anchor)
        }
        return new CellSelection($anchor, $head)
      }
    }
    return TextSelection.between($anchor, $head)
  }

  // $anchor and $head must be pointing before cells in the same table
  static between($anchor, $head = $anchor) {
    let anchorCol = colCount($anchor), headCol = colCount($head)
    if (anchorCol < headCol) return new CellSelection($anchor, moveCellForward($head))
    else return new CellSelection(moveCellForward($anchor), $head)
  }

  static create(doc, anchorCell, headCell = anchorCell) {
    return new CellSelection(doc.resolve(anchorCell), doc.resolve(headCell))
  }
}
exports.CellSelection = CellSelection

CellSelection.prototype.visible = false

Selection.jsonID("cell", CellSelection)

exports.drawCellSelection = function(state) {
  if (!(state.selection instanceof CellSelection)) return null
  let cells = []
  state.selection.forEachCell((node, pos) => {
    cells.push(Decoration.node(pos, pos + node.nodeSize, {class: "selectedCell"}))
  })
  return DecorationSet.create(state.doc, cells)
}
