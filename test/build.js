const {Schema} = require("prosemirror-model")
const {TextSelection, NodeSelection} = require("prosemirror-state")
const {schema: baseSchema} = require("prosemirror-schema-basic")
const {tableNodes} = require("../src/schema")
const {cellAround} = require("../src/util")
const {CellSelection} = require("../src/cellselection")

let schema = new Schema({
  nodes: baseSchema.spec.nodes.append(tableNodes({
    tableGroup: "block",
    cellContent: "block+",
    cellAttributes: {
      test: {default: "default"}
    }
  })),
  marks: baseSchema.spec.marks
})

let e = module.exports = require("prosemirror-test-builder").builders(schema, {
  p: {nodeType: "paragraph"},
  tr: {nodeType: "table_row"},
  td: {nodeType: "table_cell"},
  th: {nodeType: "table_header"}
})

e.c = function(colspan, rowspan) {
  return e.td({colspan, rowspan}, e.p("x"))
}
e.c11 = e.c(1, 1)
e.cEmpty = e.td(e.p())
e.cCursor = e.td(e.p("x<cursor>"))
e.cAnchor = e.td(e.p("x<anchor>"))
e.cHead = e.td(e.p("x<head>"))

e.h = function(colspan, rowspan) {
  return e.th({colspan, rowspan}, e.p("x"))
}
e.h11 = e.h(1, 1)
e.hEmpty = e.th(e.p())
e.hCursor = e.th(e.p("x<cursor>"))

e.eq = function(a, b) { return a.eq(b) }

function resolveCell(doc, tag) {
  if (tag == null) return null
  return cellAround(doc.resolve(tag))
}

e.selectionFor = function(doc) {
  let cursor = doc.tag.cursor
  if (cursor != null) return new TextSelection(doc.resolve(cursor))
  let $anchor = resolveCell(doc, doc.tag.anchor)
  if ($anchor) return new CellSelection($anchor, resolveCell(doc, doc.tag.head) || undefined)
  let node = doc.tag.node
  if (node != null) return new NodeSelection(doc.resolve(node))
}
