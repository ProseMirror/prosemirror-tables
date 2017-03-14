const {schema: baseSchema} = require("prosemirror-schema-basic")
const {Schema} = require("prosemirror-model")

const cellAttrs = {
  background: {default: null},
  colspan: {default: 1},
  rowspan: {default: 1}
}

function getCellAttrs(dom) {
  return {
    background: dom.style.backgroundColor || null,
    colspan: Number(dom.getAttribute("colspan") || 1),
    rowspan: Number(dom.getAttribute("rowspan") || 1)
  }
}

function setCellAttrs(node) {
  let attrs = {}
  if (node.attrs.colspan != 1) attrs.colspan = node.attrs.colspan
  if (node.attrs.rowspan != 1) attrs.rowspan = node.attrs.rowspan
  if (node.attrs.background) attrs.style = "background-color: " + node.attrs.background
  return attrs
}

exports.schema = new Schema({
  nodes: baseSchema.spec.nodes.append({
    table: {
      content: "table_row+",
      group: "block",
      parseDOM: [{tag: "table"}],
      toDOM() { return ["table", ["tbody", 0]] }
    },
    table_row: {
      content: "(table_cell | table_header)+",
      parseDOM: [{tag: "tr"}],
      toDOM() { return ["tr", 0] }
    },
    table_cell: {
      content: "block+",
      attrs: cellAttrs,
      parseDOM: [{tag: "td", getAttrs: getCellAttrs}],
      toDOM(node) { return ["td", setCellAttrs(node), 0] }
    },
    table_header: {
      content: "block+",
      attrs: cellAttrs,
      parseDOM: [{tag: "th", getAttrs: getCellAttrs}],
      toDOM(node) { return ["th", setCellAttrs(node), 0] }
    }
  }),
  marks: baseSchema.spec.marks
})
