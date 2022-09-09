// Helper for creating a schema that supports tables.

function getCellAttrs(dom, extraAttrs) {
  let widthAttr = dom.getAttribute("data-colwidth")
  let widths = widthAttr && /^\d+(,\d+)*$/.test(widthAttr) ? widthAttr.split(",").map(s => Number(s)) : null
  let colspan = Number(dom.getAttribute("colspan") || 1)
  let result = {
    colspan,
    rowspan: Number(dom.getAttribute("rowspan") || 1),
    colwidth: widths && widths.length == colspan ? widths : null
  }
  for (let prop in extraAttrs) {
    let getter = extraAttrs[prop].getFromDOM
    let value = getter && getter(dom)
    if (value != null) result[prop] = value
  }
  return result
}

function setCellAttrs(node, extraAttrs, conversionFactor = 1) {
  let attrs = {}
  if (node.attrs.colspan != 1) attrs.colspan = node.attrs.colspan
  if (node.attrs.rowspan != 1) attrs.rowspan = node.attrs.rowspan
  if (node.attrs.colwidth) {
    const widths = node.attrs.colwidth.map(w => w * conversionFactor);
    attrs.colwidth = getColWidth(widths);
    attrs["data-colwidth"] = widths.join(",")
  }
  for (let prop in extraAttrs) {
    let setter = extraAttrs[prop].setDOMAttr
    if (setter) setter(node.attrs[prop], attrs)
  }
  return attrs
}

export function getColWidth(colwidths) {
  return colwidths && colwidths.length ? colwidths.reduce((total, n) => total + n, 0) : 0;
}

// :: (Object) → Object
//
// This function creates a set of [node
// specs](http://prosemirror.net/docs/ref/#model.SchemaSpec.nodes) for
// `table`, `table_row`, and `table_cell` nodes types as used by this
// module. The result can then be added to the set of nodes when
// creating a a schema.
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
//     cellAttributes:: ?Object
//     Additional attributes to add to cells. Maps attribute names to
//     objects with the following properties:
//
//     maxTableWidth:: ?number
//     Maximum with a table is allowed to be
//
//       default:: any
//       The attribute's default value.
//
//       getFromDOM:: ?(dom.Node) → any
//       A function to read the attribute's value from a DOM node.
//
//       setDOMAttr:: ?(value: any, attrs: Object)
//       A function to add the attribute's value to an attribute
//       object that's used to render the cell's DOM.
export function tableNodes(options) {
  let tableConversionFactor = 1;
  const extraAttrs = options.cellAttributes || {}
  const cellAttrs = {
    colspan: {default: 1},
    rowspan: {default: 1},
    colwidth: {default: null}
  }
  for (let prop in extraAttrs) {
    cellAttrs[prop] = {default: extraAttrs[prop].default}
  }

  return {
    table: {
      content: "table_row+",
      tableRole: "table",
      isolating: true,
      group: options.tableGroup,
      parseDOM: [{tag: "table"}],
      toDOM(node) {
        let attrs;
        let initialRow = false;
        let totalWidth = 0;
        const colWidths = [];
        const content = [["tbody", 0]];
        const wrapperAttrs = { class: 'tableWrapper' };
        tableConversionFactor = 1;

        node.descendants((n) => {
          if (n.type.name === 'table_row') {
            if (initialRow) {
              return false;
            } else {
              initialRow = true;
              return true;
            }
          }
          if (initialRow && (n.type.name === 'table_cell' || n.type.name === 'table_header')) {
            totalWidth += getColWidth(n.attrs.colwidth);
            colWidths.push(...n.attrs.colwidth);
          }
        });

        if (totalWidth > 0) {
          tableConversionFactor = options.maxTableWidth && totalWidth > options.maxTableWidth ? options.maxTableWidth / totalWidth : 1;

          attrs = { style: `width: ${totalWidth * tableConversionFactor}px` };
          const cols = colWidths.map(width =>(["col", {style: `width: ${width * tableConversionFactor}px`}]));
          content.unshift(["colgroup", ...cols]);
        }

        return ["div", wrapperAttrs, ["table", attrs, ...content]];
      }
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
      toDOM(node) {
        return ["td", setCellAttrs(node, extraAttrs, tableConversionFactor), 0];
      }
    },
    table_header: {
      content: options.cellContent,
      attrs: cellAttrs,
      tableRole: "header_cell",
      isolating: true,
      parseDOM: [{tag: "th", getAttrs: dom => getCellAttrs(dom, extraAttrs)}],
      toDOM(node) { return ["th", setCellAttrs(node, extraAttrs, tableConversionFactor), 0] }
    }
  }
}

export function tableNodeTypes(schema) {
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
