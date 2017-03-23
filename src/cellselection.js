const {Selection, TextSelection} = require("prosemirror-state")
const {Decoration, DecorationSet} = require("prosemirror-view")

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
    // FIXME grow along with rows/cols added the the sides
    let dir = this.anchor < this.head ? -1 : 1
    let $anchorCell = doc.resolve(mapping.map(this.$anchorCell.pos, dir))
    let $headCell = doc.resolve(mapping.map(this.$headCell.pos, -dir))
    if (pointsAtCell($anchorCell) && pointsAtCell($headCell) && inSameTable($anchorCell, $headCell))
      return new CellSelection($anchorCell, $headCell)
    return TextSelection.between($anchorCell, $headCell)
  }

  forEachCell(f) {
    let table = this.$anchorCell.node(-1), map = TableMap.get(table), start = this.$anchorCell.start(-1)
    let cells = map.cellsInRect(map.rectBetween(this.$anchorCell.pos - start, this.$headCell.pos - start))
    for (let i = 0; i < cells.length; i++)
      f(table.nodeAt(cells[i]), start + cells[i])
  }

  static fromJSON(doc, json) {
    let $anchor = doc.resolve(json.anchor), $head = doc.resolve(json.head)
    if ($anchor.pos == $head.pos ||
        $anchor.parent.type.name != "table_row" ||
        $head.parent.type.name != "table_row" ||
        !inSameTable($anchor, $head))
      return TextSelection.between($anchor, $head)
    let aCol = colCount($anchor), bCol = colCount($head)
    return aCol < bCol ? new CellSelection($anchor, moveCellBackward($head))
         : aCol > bCol ? new CellSelection(moveCellBackward($anchor), $head)
         : new CellSelection($anchor, $head)
  }

  // $anchor and $head must be pointing before cells in the same table
  static between($anchor, $head = $anchor) {
    let anchorCol = colCount($anchor), headCol = colCount($head)
    if (anchorCol < headCol) return new CellSelection($anchor, moveCellForward($head))
    else return new CellSelection(moveCellForward($anchor), $head)
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
