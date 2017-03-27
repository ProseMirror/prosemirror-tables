const {PluginKey, NodeSelection} = require("prosemirror-state")

const {TableMap} = require("./tablemap")

exports.key = new PluginKey("selectingCells")

exports.cellAround = function($pos) {
  for (let d = $pos.depth - 1; d > 0; d--)
    if ($pos.node(d).type.name == "table_row") return $pos.node(0).resolve($pos.before(d + 1))
  return null
}

exports.isInTable = function(state) {
  let $head = state.selection.$head
  for (let d = $head.depth; d > 0; d--) if ($head.node(d).type.name == "table_row") return true
  return false
}

exports.selectionCell = function(state) {
  let sel = state.selection
  if (sel instanceof NodeSelection && sel.$from.parent.type.name == "table_row") return sel.$from
  return sel.$anchorCell || exports.cellAround(sel.$head)
}

exports.pointsAtCell = function($pos) {
  return $pos.parent.type.name == "table_row" && $pos.nodeAfter
}

exports.moveCellForward = function($pos) {
  return $pos.node(0).resolve($pos.pos + $pos.nodeAfter.nodeSize)
}

exports.moveCellBackward = function($pos) {
  return $pos.node(0).resolve($pos.pos - $pos.nodeBefore.nodeSize)
}

exports.inSameTable = function($a, $b) {
  return $a.depth == $b.depth && $a.pos >= $b.start(-1) && $a.pos <= $b.end(-1)
}

exports.findCell = function($pos) {
  return TableMap.get($pos.node(-1)).findCell($pos.pos - $pos.start(-1))
}

exports.colCount = function($pos) {
  return TableMap.get($pos.node(-1)).colCount($pos.pos - $pos.start(-1))
}

exports.nextCell = function($pos, axis, dir) {
  let start = $pos.start(-1), map = TableMap.get($pos.node(-1))
  let moved = map.nextCell($pos.pos - start, axis, dir)
  return moved == null ? null : $pos.node(0).resolve(start + moved)
}

exports.setAttr = function(attrs, name, value) {
  let result = {}
  for (let prop in attrs) result[prop] = attrs[prop]
  result[name] = value
  return result
}
