const {schema} = require("../src/schema")

module.exports = require("prosemirror-test-builder/dist/build")(schema, {
  p: {nodeType: "paragraph"},
  tr: {nodeType: "table_row"},
  td: {nodeType: "table_cell"},
  th: {nodeType: "table_heading"}
})
