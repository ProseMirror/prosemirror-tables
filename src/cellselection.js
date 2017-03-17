const {Plugin, PluginKey, Selection, TextSelection} = require("prosemirror-state")
const {Slice} = require("prosemirror-model")
const {Decoration, DecorationSet} = require("prosemirror-view")
const {keydownHandler} = require("prosemirror-keymap")

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

  get anchorCellPos() {
    let anchorCol = colCount(this.$anchor), headCol = colCount(this.$head)
    return this.anchor - (anchorCol < headCol ? 0 : this.$anchor.nodeBefore.nodeSize)
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

CellSelection.prototype.visible = false

Selection.jsonID("cell", CellSelection)

const key = new PluginKey("selectingCells")

const keyDown = keydownHandler({
  "ArrowLeft": arrow("horiz", -1),
  "ArrowRight": arrow("horiz", 1),
  "ArrowUp": arrow("vert", -1),
  "ArrowDown": arrow("vert", 1),

  "Shift-ArrowLeft": shiftArrow("horiz", -1),
  "Shift-ArrowRight": shiftArrow("horiz", 1),
  "Shift-ArrowUp": shiftArrow("vert", -1),
  "Shift-ArrowDown": shiftArrow("vert", 1),

  "Backspace": deleteCellSelection,
  "Mod-Backspace": deleteCellSelection,
  "Delete": deleteCellSelection,
  "Mod-Delete": deleteCellSelection
})

function arrow(axis, dir) {
  return (state, dispatch, view) => {
    let sel = state.selection
    if (sel instanceof CellSelection) {
      dispatch(state.tr.setSelection(Selection.near(sel.$head, dir)))
      return true
    }
    if (axis != "horiz" && !sel.empty) return false
    let end = atEndOfCell(view, axis, dir)
    if (end == null) return false
    if (axis == "horiz") {
      dispatch(state.tr.setSelection(Selection.near(state.doc.resolve(sel.head + dir), dir)))
      return true
    } else {
      let $cell = state.doc.resolve(end), $next = moveCellPos($cell, axis, dir), newSel
      if ($next) newSel = Selection.near($next, 1)
      else if (dir < 0) newSel = Selection.near(state.doc.resolve($cell.before(-1)), -1)
      else newSel = Selection.near(state.doc.resolve($cell.after(-1)), 1)
      dispatch(state.tr.setSelection(newSel))
      return true
    }
  }
}

function shiftArrow(axis, dir) {
  return (state, dispatch, view) => {
    let sel = state.selection
    if (!(sel instanceof CellSelection)) {
      let end = atEndOfCell(view, axis, dir)
      if (end == null) return false
      sel = CellSelection.between(state.doc.resolve(end))
    }
    let $head = moveCellPos(sel.$head, axis, dir), $anchor = sel.$anchor
    if (!$head) return false
    if ($head.pos == $anchor.pos) {
      $head = moveCellPos($anchor, axis, dir)
      if (!$head) return false
      $anchor = sel.$head
    }
    if (dispatch) dispatch(state.tr.setSelection(new CellSelection($anchor, $head)))
    return true
  }
}

function deleteCellSelection(state, dispatch) {
  let sel = state.selection
  if (!(sel instanceof CellSelection)) return false
  if (dispatch) {
    let tr = state.tr, baseContent = state.schema.nodes.table_cell.createAndFill().content
    sel.forEachCell((cell, pos) => {
      if (!cell.content.eq(baseContent))
        tr.replace(tr.mapping.map(pos + 1), tr.mapping.map(pos + cell.nodeSize - 1),
                   new Slice(baseContent, 0, 0))
    })
    if (tr.docChanged) dispatch(tr)
  }
  return true
}

function mousedown(view, startEvent) {
  if (startEvent.ctrlKey || startEvent.metaKey) return

  let startDOMCell = domInCell(view, startEvent.target), anchor
  if (startEvent.shiftKey && (view.state.selection instanceof CellSelection)) {
    setCellSelection(view.state.selection.anchorCellPos, startEvent)
    startEvent.preventDefault()
  } else if (startEvent.shiftKey && startDOMCell &&
             (anchor = cellAround(view.state.selection.$anchor)) != null &&
             cellUnderMouse(view, startEvent) != anchor) {
    setCellSelection(anchor, startEvent)
    startEvent.preventDefault()
  } else if (!startDOMCell) {
    return
  }

  function setCellSelection(anchor, event) {
    let $anchor = view.state.doc.resolve(anchor)
    let head = cellUnderMouse(view, event), $head
    let starting = key.getState(view.state) == null
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

  function stop() {
    view.root.removeEventListener("mouseup", stop)
    view.root.removeEventListener("mousemove", move)
    if (key.getState(view.state) != null) view.dispatch(view.state.tr.setMeta(key, -1))
  }

  function move(event) {
    let anchor = key.getState(view.state)
    if (anchor == null && domInCell(view, event.target) != startDOMCell) {
      anchor = cellUnderMouse(view, startEvent)
      if (anchor == null) return stop()
    }
    if (anchor != null) setCellSelection(anchor, event)
  }
  view.root.addEventListener("mouseup", stop)
  view.root.addEventListener("mousemove", move)
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

      handleDOMEvents: {mousedown},

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
      },

      handleKeyDown: keyDown

      // FIXME handle text insertion over a cell selection?
    }
  })
}

function domInCell(view, dom) {
  for (; dom && dom != view.dom; dom = dom.parentNode)
    if (dom.nodeName == "TD" || dom.nodeName == "TH") return dom
}

function cellUnderMouse(view, event) {
  let mousePos = view.posAtCoords({left: event.clientX, top: event.clientY})
  if (!mousePos) return null
  return mousePos ? cellAround(view.state.doc.resolve(mousePos.pos)) : null
}

function cellAround($pos) {
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

function moveCellPos($pos, axis, dir) {
  if (axis == "horiz") {
    if ($pos.index() == (dir < 0 ? 0 : $pos.parent.childCount)) return null
    return $pos.node(0).resolve($pos.pos + (dir < 0 ? -$pos.nodeBefore.nodeSize : $pos.nodeAfter.nodeSize))
  } else {
    let table = $pos.node(-1), index = $pos.index(-1)
    if (index == (dir < 0 ? 0 : table.childCount)) return null
    let targetCol = colCount($pos), row = table.child(index + dir)
    let pos = $pos.before() + (dir < 0 ? -row.nodeSize : $pos.parent.nodeSize) + 1
    for (let i = 0, col = 0; col < targetCol && i < row.childCount - 1; i++) {
      let cell = row.child(i)
      col += cell.attrs.colspan
      pos += cell.nodeSize
    }
    return $pos.node(0).resolve(pos)
  }
}

function atEndOfCell(view, axis, dir) {
  if (!(view.state.selection instanceof TextSelection)) return null
  let {$head} = view.state.selection
  if (!$head) return null
  for (let d = $head.depth - 1; d >= 0; d--) {
    let parent = $head.node(d), index = dir < 0 ? $head.index(d) : $head.indexAfter(d)
    if (index != (dir < 0 ? 0 : parent.childCount)) return null
    if (parent.type.name == "table_cell" || parent.type.name == "table_header") {
      let cellPos = $head.before(d)
      let dirStr = axis == "vert" ? (dir > 0 ? "down" : "up") : (dir > 0 ? "right" : "left")
      return view.endOfTextblock(dirStr) ? cellPos : null
    }
  }
  return null
}
