const {TableMap} = require("./tablemap")
const {setAttr} = require("./util")

function changedDescendants(old, cur, offset, f) {
  let oldSize = old.childCount, curSize = cur.childCount
  outer: for (let i = 0, j = 0; i < curSize; i++) {
    let child = cur.child(i)
    for (let scan = j, e = Math.min(oldSize, i + 3); scan < e; scan++) {
      if (old.child(scan) == child) {
        j = scan + 1
        offset += child.nodeSize
        continue outer
      }
    }
    f(child, offset)
    if (j < oldSize && old.child(j).sameMarkup(child))
      changedDescendants(old.child(j), child, offset + 1, f)
    else
      child.nodesBetween(0, child.content.size, f, offset + 1)
    offset += child.nodeSize
  }
}

exports.fixTables = function(state, oldState) {
  let tr, check = (node, pos) => {
    if (node.type.name == "table") tr = fixTable(state, node, pos, tr)
  }
  if (!oldState) state.doc.descendants(check)
  else if (oldState.doc != state.doc) changedDescendants(oldState.doc, state.doc, 0, check)
  return tr
}

function fixTable(state, table, tablePos, tr) {
  let map = TableMap.get(table)
  if (!map.problems) return tr
  if (!tr) tr = state.tr

  let mustAdd = []
  for (let i = 0; i < map.height; i++) mustAdd.push(0)
  for (let i = 0; i < map.problems.length; i++) {
    let prob = map.problems[i]
    if (prob.type == "collision") {
      let cell = table.nodeAt(prob.pos)
      for (let j = 0; j < cell.attrs.rowspan; j++) mustAdd[prob.row + j] += prob.n
      tr.setNodeType(tr.mapping.map(tablePos + 1 + prob.pos), null, setAttr(cell.attrs, "colspan", cell.attrs.colspan - prob.n))
    } else if (prob.type == "missing") {
      mustAdd[prob.row] += prob.n
    }
  }
  for (let i = 0, pos = tablePos + 1; i < map.height; i++) {
    let end = pos + table.child(i).nodeSize
    let add = mustAdd[i]
    if (add > 0) {
      let nodes = []
      for (let j = 0; j < add; j++)
        nodes.push(state.schema.nodes.table_cell.createAndFill())
      let side = (i == 0 ? !mustAdd[i + 1] : mustAdd[i - 1]) ? pos + 1 : end - 1
      tr.insert(tr.mapping.map(side), nodes)
    }
    pos = end
  }
  return tr
}
