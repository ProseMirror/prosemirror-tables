// Helper for creating a schema that supports tables.

function getCellAttrs(dom, extraAttrs) {
  let result = {
    colspan: Number(dom.getAttribute("colspan") || 1),
    rowspan: Number(dom.getAttribute("rowspan") || 1)
  }
  for (let prop in extraAttrs) {
    let getter = extraAttrs[prop].getFromDOM
    let value = getter && getter(dom)
    if (value != null) result[prop] = value
  }
  return result
}

function setCellAttrs(node, extraAttrs) {
  let attrs = {}
  if (node.attrs.colspan != 1) attrs.colspan = node.attrs.colspan
  if (node.attrs.rowspan != 1) attrs.rowspan = node.attrs.rowspan
  for (let prop in extraAttrs) {
    let setter = extraAttrs[prop].setDOMAttr
    if (setter) setter(node.attrs[prop], attrs)
  }
  return attrs
}

// :: (Object) → Object
// Create a set of node specs for `table`, `table_row`, and
// `table_cell` nodes as used by this module.
//
//   options::- The following options are understood:
//
//     tableGroup:: ?string
//     A group name (something like `"block"`) to add to the table
//     node type.
//
//     cellContent:: string
//     The content expression for table cells.
//
//     cellAttributes:: Object
//     Additional attributes to add to cells. Maps attribute names to
//     objects with the following properties:
//
//       default:: any
//       The attribute's default value.
//
//       getFromDOM:: ?(dom.Node) → any
//       A function to read the attribute's value from a DOM node.
//
//       setDOMAttr:: ?(value: any, attrs: Object)>
//       A function to add the attribute's value to an attribute
//       object that's used to render the cell's DOM.
function tableNodes(options) {
  let extraAttrs = options.cellAttributes || {}
  let cellAttrs = {
    colspan: {default: 1},
    rowspan: {default: 1}
  }
  for (let prop in extraAttrs)
    cellAttrs[prop] = {default: extraAttrs[prop].default}

  return {
    table: {
      content: "table_row+",
      tableRole: "table",
      group: options.tableGroup,
      parseDOM: [{tag: "table"}],
      toDOM() { return ["table", ["tbody", 0]] }
    },
    table_row: {
      content: "(table_cell | table_header)*",
      tableRole: "row",
      parseDOM: [{tag: "tr"}],
      toDOM() { return ["tr", 0] }
    },
    table_cell: {
      content: options.cellContent,
      attrs: cellAttrs,
      tableRole: "cell",
      isolating: true,
      parseDOM: [{tag: "td", getAttrs: dom => getCellAttrs(dom, extraAttrs)}],
      toDOM(node) { return ["td", setCellAttrs(node, extraAttrs), 0] }
    },
    table_header: {
      content: options.cellContent,
      attrs: cellAttrs,
      tableRole: "header_cell",
      isolating: true,
      parseDOM: [{tag: "th", getAttrs: dom => getCellAttrs(dom, extraAttrs)}],
      toDOM(node) { return ["th", setCellAttrs(node, extraAttrs), 0] }
    }
  }
}
exports.tableNodes = tableNodes

function tableNodeTypes(schema) {
  let result = schema.cached.tableNodeTypes
  if (!result) {
    result = schema.cached.tableNodeTypes = {}
    for (let name in schema.nodes) {
      let type = schema.nodes[name], role = type.spec.tableRole
      if (role) result[role] = type
    }
  }
  return result
}
exports.tableNodeTypes = tableNodeTypes
