const {Plugin, PluginKey, Selection, TextSelection} = require("prosemirror-state")
const {Decoration, DecorationSet} = require("prosemirror-view")

// Interactions:
// drag-select should reliably select the dragged range of cells
// shift-click should extend to a cell selection
// shift-arrow should expand/shrink the cell selection, or create one when crossing cell boundaries
// triple-click on a cell should select the cell

// So must listen to mousedown on the editor, and check for not being
// inside the selection and being inside of a table. Then register a
// mousemove handler and do nothing. When the mouse moves into another
// cell, set a cell selection. What when it moves back into its
// original cell? Should restore the original selection. Does
// preventDefault-ing mousemove help? I guess.
//
// Should also handle shift-drag.

class CellSelection extends Selection {
  map(doc, mapping) {
    return CellSelection.from(doc, mapping.map(this.anchor), mapping.map(this.head))
  }

  get rect() {
    let anchorCol = colCount(this.$anchor), headCol = colCount(this.$head)
    return {left: Math.min(anchorCol, headCol),
            top: this.$from.index(-1),
            right: Math.max(anchorCol, headCol),
            bottom: this.$to.index(-1) + 1}
  }

  forEachCell(f) {
    let {left, right, top, bottom} = this.rect
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
  static between($anchor, $head) {
    let anchorCol = colCount($anchor), headCol = colCount($head)
    if (anchorCol < headCol) return new CellSelection($anchor, moveCellForward($head))
    else return new CellSelection(moveCellForward($anchor), $head)
  }
}

CellSelection.prototype.visible = false

Selection.jsonID("cell", CellSelection)

const key = new PluginKey("selectingCells")

function stopSelecting(view) {
  view.dispatch(view.state.tr.setMeta(key, -1))
}

// This plugin handles drawing and creating cell selections
exports.cellSelection = function() {
  return new Plugin({
    key,

    state: {
      init() { return null },
      apply(tr, cur) {
        let set = tr.getMeta(key)
        if (set != null) return set == -1 ? null : set
        if (cur == null || !tr.docChanged) return cur
        let {deleted, pos} = tr.mapping.mapResult(cur)
        return deleted ? null : pos
      }
    },

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

      handleDOMEvents: {
        mousedown(view, startEvent) {
          let startDOMCell = isInCell(view, startEvent.target)
          if (!startDOMCell) return

          function stop() {
            view.root.removeEventListener("mouseup", stop)
            view.root.removeEventListener("mousemove", move)
            if (key.getState(view.state) != null) stopSelecting(view)
          }
          function move(event) {
            let anchor = key.getState(view.state), starting = false
            if (anchor == null && isInCell(view, event.target) != startDOMCell) {
              anchor = cellUnderMouse(view, startEvent)
              if (anchor == null) return stop()
              starting = true
            }
            if (anchor != null) {
              let $anchor = view.state.doc.resolve(anchor)
              let head = cellUnderMouse(view, event), $head
              if (head == null || !inSameTable($anchor, $head = view.state.doc.resolve(head))) {
                if (starting) $head = $anchor
                else return
              }
              let selection = CellSelection.between($anchor, $head)
              if (starting || !view.state.selection.eq(selection)) {
                let tr = view.state.tr.setSelection(selection)
                if (starting) tr.setMeta(key, anchor)
                view.dispatch(tr)
              }
            }
          }
          view.root.addEventListener("mouseup", stop)
          view.root.addEventListener("mousemove", move)
        }
      },

      createSelectionBetween(view) {
        if (key.getState(view.state) != null) return view.state.selection
      },

      handleTripleClick(view, pos) {
        let doc = view.state.doc, $pos = doc.resolve(pos)
        for (let i = $pos.depth; i > 0; i--) {
          let parent = $pos.node(i)
          if (parent.type.name == "table_cell" || parent.type.name == "table_header") {
            view.dispatch(view.state.tr.setSelection(new CellSelection(doc.resolve($pos.before(i)),
                                                                       doc.resolve($pos.after(i)))))
            return true
          }
        }
        return false
      }
    }
  })
}

function isInCell(view, dom) {
  for (; dom && dom != view.dom; dom = dom.parentNode)
    if (dom.nodeName == "TD" || dom.nodeName == "TH") return dom
}

function cellUnderMouse(view, event) {
  let mousePos = view.posAtCoords({left: event.clientX, top: event.clientY})
  if (!mousePos) return null
  let $pos = view.state.doc.resolve(mousePos.pos)
  for (let d = $pos.depth - 1; d > 0; d--)
    if ($pos.node(d).type.name == "table_row") return $pos.before(d + 1)
  return null
}

function moveCellForward($pos) {
  return $pos.node(0).resolve($pos.pos + $pos.nodeAfter.nodeSize)
}

function inSameTable($a, $b) {
  return $a.depth == $b.depth && $a.pos >= $b.start(-1) && $a.pos <= $b.end(-1)
}

function colCount($pos) {
  let count = 0
  for (let i = $pos.index() - 1; i >= 0; i--)
    count += $pos.parent.child(i).attrs.colspan
  return count
}
