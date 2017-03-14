const {Plugin, Selection, TextSelection} = require("prosemirror-state")
const {Decoration, DecorationSet} = require("prosemirror-view")

class CellSelection extends Selection {
  eq(other) {
    return other instanceof CellSelection &&
      other.from == this.from && other.to == this.to
  }

  map(doc, mapping) {
    let from = mapping.mapResult(this.from, 1), $from = doc.resolve(from.pos)
    let to = mapping.mapResult(this.to, -1), $to = doc.resolve(to.pos)
    if (!from.deleted && !to.deleted && from.pos < to.pos &&
        $from.parent == $to.parent && $from.parent.type.name == "table")
      return new CellSelection($from, doc.resolve(to))
    else
      return TextSelection.between($from, $to)
  }

  toJSON() {
    return {type: "cell", from: this.from, to: this.to}
  }

  get left() { return colCount(this.$from) }

  get top() { return this.$from.index(-1) }

  get right() { return colCount(this.$to) }

  get bottom() { return this.$to.index(-1) + this.$to.nodeBefore.attrs.rowspan }

  forEachCell(f) {
    let {left, right, top, bottom} = this
    let table = this.$from.node(-1)
    for (let row = 0, pos = this.$from.start(-1); row < table.childCount; row++) {
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

  static fromJSON(doc, json) {
    let $from = doc.resolve(json.from), $to = doc.resolve(json.to)
    return this.create($from, $to) || TextSelection.between($from, $to)
  }

  static mapJSON(json, mapping) {
    return {type: "cell", from: mapping.map(json.from), to: mapping.map(json.to)}
  }

  static create($from, $to) {
    if ($from.pos == $to.pos) return null
    let same = $from.sharedDepth($to.pos), sharedParent = $from.node(same)
    let start, end
    if (sharedParent.type.name == "table") {
      start = $from.depth == same ? $from.pos + 1 : $from.before(same + 2)
      end = $to.depth == same ? $to.pos - 1 : $to.after(same + 2)
    } else if (sharedParent.type.name == "table_row") {
      start = $from.before(same + 1)
      end = $to.after(same + 1)
    } else {
      return null
    }
    return new CellSelection(maybeResolve($from, start), maybeResolve($to, end))
  }
}

CellSelection.prototype.visible = false

Selection.jsonID("cell", CellSelection)

function maybeResolve($pos, pos) {
  return $pos.pos == pos ? $pos : $pos.node(0).resolve(pos)
}

function colCount($pos) {
  let count = 0
  for (let i = $pos.index() - 1; i >= 0; i--)
    count += $pos.parent.child(i).attrs.colspan
  return count
}

// This plugin handles drawing and creating cell selections
exports.cellSelection = new Plugin({
  props: {
    decorations(state) {
      if (state.selection instanceof CellSelection) {
        let cells = []
        state.selection.forEachCell((node, pos) => {
          cells.push(Decoration.node(pos, pos + node.nodeSize, {class: "selectedCell"}))
        })
        return DecorationSet.create(state.doc, cells)
      }
    },

    createSelectionBetween(_, $anchor, $head) {
      if ($anchor.pos > $head.pos) { let tmp = $anchor; $anchor = $head; $head = tmp }
      return CellSelection.create($anchor, $head)
    }
  }
})
