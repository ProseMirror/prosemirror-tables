const {Slice, Fragment} = require("prosemirror-model")

const {TableMap} = require("./tablemap")
const {setAttr} = require("./util")

exports.fixTables = function(trs, _, state) {
  let tr
  // FIXME refine this so that only tables that were actually touched
  // by the transforms are checked
  if (trs.some(tr => tr.docChanged)) state.doc.descendants((node, pos) => {
    if (node.type.name == "table") tr = fixTable(state, node, pos, tr)
  })
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
      let insertPos = tr.mapping.map(i == 0 || mustAdd[i - 1] > 0 ? pos + 1 : end - 1)
      tr.replace(insertPos, insertPos, new Slice(Fragment.from(nodes), 0, 0))
    }
    pos = end
  }
  return tr
}
