const {Selection, TextSelection} = require("prosemirror-state")
const {Decoration, DecorationSet} = require("prosemirror-view")

const {colCount, inSameTable, moveCellForward} = require("./util")
const {TableMap} = require("./tablemap")

class CellSelection extends Selection {
  map(doc, mapping) {
    return CellSelection.from(doc, mapping.map(this.anchor), mapping.map(this.head))
  }

  forEachCell(f) {
    let map = TableMap.get(this.$anchor.node(-1)), start = this.$anchor.start(-1)
    let {left, right, top, bottom} = map.rect(this.$anchor.pos - start, this.$head.pos - start)
    let table = this.$head.node(-1)
    for (let row = 0, pos = this.$head.start(-1); row < table.childCount; row++) {
      let rowNode = table.child(row)
      pos++
      for (let i = 0, col = 0; i < rowNode.childCount; i++) {
        let cellNode = rowNode.child(i), colEnd = col + cellNode.attrs.colspan
        if (col < right && colEnd > left &&
            row < bottom && row + cellNode.attrs.rowspan > top)
          f(cellNode, pos)
        col = colEnd
        pos += cellNode.nodeSize
      }
      pos++
    }
  }

  get anchorCellPos() {
    let anchorCol = colCount(this.$anchor), headCol = colCount(this.$head)
    return this.anchor - (anchorCol < headCol ? 0 : this.$anchor.nodeBefore.nodeSize)
  }

  get headCellPos() {
    let anchorCol = colCount(this.$anchor), headCol = colCount(this.$head)
    return this.head - (headCol < anchorCol ? 0 : this.$head.nodeBefore.nodeSize)
  }

  static fromJSON(doc, json) {
    return CellSelection.from(doc, json.anchor, json.head)
  }

  static from(doc, anchor, head) {
    let $anchor = doc.resolve(anchor), $head = doc.resolve(head)
    if ($anchor.parent.type.name == "table_row" &&
        $head.parent.type.name == "table_row" &&
        $head.pos != $anchor.pos &&
        inSameTable($anchor, $head))
      return new CellSelection($anchor, $head)
    return TextSelection.between($anchor, $head)
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
