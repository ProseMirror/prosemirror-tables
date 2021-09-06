// Helper for creating a schema that supports tables.

function getCellAttrs(dom, extraAttrs) {
  const widthAttr = dom.getAttribute('data-colwidth');
  const widths =
    widthAttr && /^\d+(,\d+)*$/.test(widthAttr)
      ? widthAttr.split(',').map((s) => Number(s))
      : null;
  const colspan = Number(dom.getAttribute('colspan') || 1);
  const result = {
    colspan,
    rowspan: Number(dom.getAttribute('rowspan') || 1),
    colwidth: widths && widths.length == colspan ? widths : null,
  };
  for (const prop in extraAttrs) {
    const getter = extraAttrs[prop].getFromDOM;
    const value = getter && getter(dom);
    if (value != null) result[prop] = value;
  }
  return result;
}

export function setCellAttrs(node, extraAttrs) {
  const attrs = {};
  if (node.attrs.colspan != 1) attrs.colspan = node.attrs.colspan;
  if (node.attrs.rowspan != 1) attrs.rowspan = node.attrs.rowspan;
  if (node.attrs.colwidth)
    attrs['data-colwidth'] = node.attrs.colwidth.join(',');

  // maybe find way to take it from  the `tableNode` configuration?
  if (node.attrs.background)
    attrs.style = `${attrs.style || ''} background-color: ${
      node.attrs.background
    };`;
  if (node.attrs.borderColor)
    attrs.style = `${attrs.style || ''} border-color: ${
      node.attrs.borderColor
    };`;

  for (const prop in extraAttrs) {
    const setter = extraAttrs[prop].setDOMAttr;
    if (setter) setter(node.attrs[prop], attrs);
  }
  return attrs;
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
//     cellContentGroup:: string
//     The group of the cell content
//
//     cellAttributes:: ?Object
//     Additional attributes to add to cells. Maps attribute names to
//     objects with the following properties:
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
  const extraAttrs = options.cellAttributes || {};
  const cellAttrs = {
    colspan: {default: 1},
    rowspan: {default: 1},
    colwidth: {default: null},
    id: {default: false},
    type: {default: 'text'},
    header: {default: false},
    values: {
      default: {
        text: {default: ''},
        number: {default: ''},
        date: {default: ''},
        currency: {default: ''},
        label: {default: ''},
        text: {default: ''},
        checkbox: {default: false},
      },
    },
  };
  for (const prop in extraAttrs)
    cellAttrs[prop] = {default: extraAttrs[prop].default};

  return {
    table: {
      content: 'table_row+',
      tableRole: 'table',
      isolating: true,
      group: options.tableGroup,
      attrs: {
        sort: {default: {col: null, dir: null}},
        headers: {default: true},
      },
      parseDOM: [{tag: 'table'}],
      toDOM() {
        return ['table', ['tbody', 0]];
      },
    },
    table_row: {
      content: '(table_cell | table_header)*',
      tableRole: 'row',
      parseDOM: [{tag: 'tr'}],
      toDOM() {
        return ['tr', 0];
      },
    },
    table_cell: {
      content: `${options.cellContent}`,
      attrs: cellAttrs,
      tableRole: 'cell',
      isolating: true,
      parseDOM: [{tag: 'td', getAttrs: (dom) => getCellAttrs(dom, extraAttrs)}],
      toDOM(node) {
        return ['td', setCellAttrs(node, extraAttrs), 0];
      },
    },
    table_header: {
      content: options.cellContent,
      attrs: cellAttrs,
      tableRole: 'header_cell',
      isolating: true,
      parseDOM: [{tag: 'th', getAttrs: (dom) => getCellAttrs(dom, extraAttrs)}],
      toDOM(node) {
        return ['th', setCellAttrs(node, extraAttrs), 0];
      },
    },

    checkbox: {
      attrs: {checked: {default: false}},
      group: options.cellContentGroup,
      selectable: false,
      parseDOM: [
        {
          tag: '.cell-checkbox',
          getAttrs: (dom) => getCellAttrs(dom, extraAttrs),
        },
      ],
      toDOM(node) {
        return [
          'div',
          {
            class: node.attrs.checked
              ? 'cell-checkbox checked'
              : 'cell-checkbox',
          },
          0,
        ];
      },
    },
  };
}

export function tableNodeTypes(schema) {
  let result = schema.cached.tableNodeTypes;
  if (!result) {
    result = schema.cached.tableNodeTypes = {};
    for (const name in schema.nodes) {
      const type = schema.nodes[name],
        role = type.spec.tableRole;
      if (role) result[role] = type;
    }
  }
  return result;
}
