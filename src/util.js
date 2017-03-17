const {PluginKey} = require("prosemirror-state")

exports.key = new PluginKey("selectingCells")

exports.cellAround = function($pos) {
  for (let d = $pos.depth - 1; d > 0; d--)
    if ($pos.node(d).type.name == "table_row") return $pos.before(d + 1)
  return null
}

exports.moveCellForward = function($pos) {
  return $pos.node(0).resolve($pos.pos + $pos.nodeAfter.nodeSize)
}

exports.inSameTable = function($a, $b) {
  return $a.depth == $b.depth && $a.pos >= $b.start(-1) && $a.pos <= $b.end(-1)
}

exports.colCount = function($pos) {
  let count = 0
  for (let i = $pos.index() - 1; i >= 0; i--)
    count += $pos.parent.child(i).attrs.colspan
  return count
}

exports.moveCellPos = function($pos, axis, dir) {
  if (axis == "horiz") {
    if ($pos.index() == (dir < 0 ? 0 : $pos.parent.childCount)) return null
    return $pos.node(0).resolve($pos.pos + (dir < 0 ? -$pos.nodeBefore.nodeSize : $pos.nodeAfter.nodeSize))
  } else {
    let table = $pos.node(-1), index = $pos.index(-1)
    if (index == (dir < 0 ? 0 : table.childCount)) return null
    let targetCol = exports.colCount($pos), row = table.child(index + dir)
    let pos = $pos.before() + (dir < 0 ? -row.nodeSize : $pos.parent.nodeSize) + 1
    for (let i = 0, col = 0; col < targetCol && i < row.childCount - 1; i++) {
      let cell = row.child(i)
      col += cell.attrs.colspan
      pos += cell.nodeSize
    }
    return $pos.node(0).resolve(pos)
  }
}
