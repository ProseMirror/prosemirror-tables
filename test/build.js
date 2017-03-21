const {schema} = require("../src/schema")

let e = module.exports = require("prosemirror-test-builder/dist/build")(schema, {
  p: {nodeType: "paragraph"},
  tr: {nodeType: "table_row"},
  td: {nodeType: "table_cell"},
  th: {nodeType: "table_heading"}
})

e.c = function(colspan, rowspan) {
  return e.td({colspan, rowspan}, e.p("x"))
}
e.c11 = e.c(1, 1)
e.cE = e.td(e.p())
