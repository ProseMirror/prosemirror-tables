const {Slice, Fragment, DOMSerializer} = require("prosemirror-model")
const {Selection, TextSelection} = require("prosemirror-state")
const {Transform} = require("prosemirror-transform")
const {keydownHandler} = require("prosemirror-keymap")

const {key, nextCell, moveCellForward, moveCellBackward, cellAround, inSameTable} = require("./util")
const {CellSelection} = require("./cellselection")
const {TableMap} = require("./tablemap")

exports.handleKeyDown = keydownHandler({
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
      dispatch(state.tr.setSelection(Selection.near(sel.$headCell, dir)))
      return true
    }
    if (axis != "horiz" && !sel.empty) return false
    let end = atEndOfCell(view, axis, dir)
    if (end == null) return false
    if (axis == "horiz") {
      dispatch(state.tr.setSelection(Selection.near(state.doc.resolve(sel.head + dir), dir)))
      return true
    } else {
      let $cell = state.doc.resolve(end), $next = nextCell($cell, axis, dir), newSel
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
      sel = new CellSelection(state.doc.resolve(end))
    }
    let $head = nextCell(sel.$headCell, axis, dir)
    if (!$head) return false
    if (dispatch) dispatch(state.tr.setSelection(new CellSelection(sel.$anchorCell, $head)))
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

exports.handleTripleClick = function(view, pos) {
  let doc = view.state.doc, $cell = cellAround(doc.resolve(pos))
  if (!$cell) return false
  view.dispatch(view.state.tr.setSelection(new CellSelection($cell)))
  return true
}

exports.handleTextInput = function(view, _from, _to, text) {
  let {selection} = view.state
  if (!(selection instanceof CellSelection)) return false
  let $cell = selection.$headCell
  view.dispatch(view.state.tr
                .setSelection(TextSelection.between(moveCellForward($cell), $cell))
                .insertText(text))
  return true
}

function pastedCells(slice) {
  if (!slice.size) return null
  slice = slice.normalize()
  let type = slice.content.firstChild.type.name
  if (type == "table_row") {
    let rows = []
    for (let i = 0; i < slice.content.childCount; i++)
      rows.push(new Slice(slice.content.child(i).content,
                          i ? 0 : Math.max(0, slice.openLeft - 1),
                          i < slice.content.childCount ? 0 : Math.max(0, slice.openRight - 1)))
    return rows
  } else if (type == "table_cell") {
    return [slice]
  }
}

function fitSliceIntoCell(schema, slice) {
  let cell = schema.nodes.table_cell.createAndFill()
  let tr = new Transform(cell).replace(0, cell.content.size, slice)
  return new Slice(Fragment.from(tr.doc.content), 0, 0)
}

exports.handlePaste = function(view, _, slice) {
  let {selection} = view.state, cellSelection = selection instanceof CellSelection
  let $cell = cellSelection ? selection.$anchorCell : cellAround(selection.$head)
  if (!$cell) return false
  let cells = pastedCells(slice)
  if (!cells && !cellSelection) return false

  let table = $cell.node(-1), map = TableMap.get(table), start = $cell.start(-1)
  let tr = view.state.tr
  if (cellSelection) {
    if (!cells) cells = [fitSliceIntoCell(view.state.schema, slice)]
    let rect = map.rectBetween(selection.$anchorCell.pos - start, selection.$headCell.pos - start)
    let seen = []
    for (let row = rect.top; row < rect.bottom; row++) {
      let sourceRow = cells[(row - rect.top) % cells.length], sourceLen = sourceRow.content.childCount
      for (let index = row * map.width + rect.left, col = rect.left, sourceIndex = 0; col < rect.right; col++, index++) {
        let pos = map.map[index]
        if (seen.indexOf(pos) == -1) {
          seen.push(pos)
          let i = sourceIndex++ % sourceLen
          let cellSlice = new Slice(Fragment.from(sourceRow.content.child(i)),
                                    i ? 1 : Math.max(1, sourceRow.openLeft),
                                    i == sourceLen - 1 ? Math.max(1, sourceRow.openRight) : 1)
          let from = tr.mapping.map(pos + start)
          tr.replace(from + 1, from + table.nodeAt(pos).nodeSize - 1, cellSlice)
        }
      }
    }
  } else {
    let endOfCell = selection.head + (selection.$head.depth - $cell.depth) == $cell.pos + $cell.nodeAfter.nodeSize
    let rect = map.findCell($cell.pos - start), col = endOfCell ? rect.right : rect.left
    let firstInsert, lastInsert
    for (let i = 0; i < cells.length; i++) {
      lastInsert = map.positionAt(rect.top + i, col, table) + start
      if (firstInsert == null) firstInsert = lastInsert
      let pos = tr.mapping.map(lastInsert)
      tr.replace(pos, pos, cells[i])
    }
    tr.setSelection(new CellSelection(tr.doc.resolve(firstInsert), moveCellBackward(tr.doc.resolve(tr.mapping.map(lastInsert)))))
  }
  view.dispatch(tr)
  return true
}

exports.handleCopyCut = function(view, event) {
  let sel = view.state.selection
  if (!(sel instanceof CellSelection)) return false

  let table = sel.$anchorCell.node(-1), map = TableMap.get(table), start = sel.$anchorCell.start(-1)
  let rect = map.rectBetween(sel.$anchorCell.pos - start, sel.$headCell.pos - start)
  let seen = [], output = document.createElement("tbody")
  let serializer = view.someProp("clipboardSerializer") || DOMSerializer.fromSchema(view.state.schema)
  for (let row = rect.top; row < rect.bottom; row++) {
    let tr = output.appendChild(document.createElement("tr"))
    for (let index = row * map.width + rect.left, col = rect.left; col < rect.right; col++, index++) {
      let pos = map.map[index]
      if (seen.indexOf(pos) == -1) {
        seen.push(pos)
        tr.appendChild(serializer.serializeNode(table.nodeAt(pos)))
      }
    }
  }
  event.clipboardData.setData("text/html", output.innerHTML)
  event.clipboardData.setData("text/plain", output.textContent)

  if (event.type == "cut") deleteCellSelection(view.state, view.dispatch)
  return true
}

exports.mousedown = function(view, startEvent) {
  if (startEvent.ctrlKey || startEvent.metaKey) return

  let startDOMCell = domInCell(view, startEvent.target), $anchor
  if (startEvent.shiftKey && (view.state.selection instanceof CellSelection)) {
    setCellSelection(view.state.selection.$anchorCell, startEvent)
    startEvent.preventDefault()
  } else if (startEvent.shiftKey && startDOMCell &&
             ($anchor = cellAround(view.state.selection.$anchor)) != null &&
             cellUnderMouse(view, startEvent).pos != $anchor.pos) {
    setCellSelection($anchor, startEvent)
    startEvent.preventDefault()
  } else if (!startDOMCell) {
    return
  }

  function setCellSelection($anchor, event) {
    let $head = cellUnderMouse(view, event)
    let starting = key.getState(view.state) == null
    if (!$head || !inSameTable($anchor, $head)) {
      if (starting) $head = $anchor
      else return
    }
    let selection = new CellSelection($anchor, $head)
    if (starting || !view.state.selection.eq(selection)) {
      let tr = view.state.tr.setSelection(selection)
      if (starting) tr.setMeta(key, $anchor.pos)
      view.dispatch(tr)
    }
  }

  function stop() {
    view.root.removeEventListener("mouseup", stop)
    view.root.removeEventListener("mousemove", move)
    if (key.getState(view.state) != null) view.dispatch(view.state.tr.setMeta(key, -1))
  }

  function move(event) {
    let anchor = key.getState(view.state), $anchor
    if (anchor != null) {
      $anchor = view.state.doc.resolve(anchor)
    } else if (domInCell(view, event.target) != startDOMCell) {
      $anchor = cellUnderMouse(view, startEvent)
      if (!$anchor) return stop()
    }
    if ($anchor) setCellSelection($anchor, event)
  }
  view.root.addEventListener("mouseup", stop)
  view.root.addEventListener("mousemove", move)
}

function atEndOfCell(view, axis, dir) {
  if (!(view.state.selection instanceof TextSelection)) return null
  let {$head} = view.state.selection
  if (!$head) return null
  for (let d = $head.depth - 1; d >= 0; d--) {
    let parent = $head.node(d), index = dir < 0 ? $head.index(d) : $head.indexAfter(d)
    if (index != (dir < 0 ? 0 : parent.childCount)) return null
    if (parent.type.name == "table_cell") {
      let cellPos = $head.before(d)
      let dirStr = axis == "vert" ? (dir > 0 ? "down" : "up") : (dir > 0 ? "right" : "left")
      return view.endOfTextblock(dirStr) ? cellPos : null
    }
  }
  return null
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
