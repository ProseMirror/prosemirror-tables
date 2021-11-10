// Helper for creating a schema that supports tables.

import { cellExtraAttrs } from "./cellAttrs";
import { checkboxExtraAttrs, dateExtraAttrs, labelsExtraAttrs } from "./cellTypeAttrs";
import { tableExtraAttrs } from "./tableAttrs";

function getNodeAttrs(dom, extraAttrs) {
  const attrsFromNode = {};

  for (const prop in extraAttrs) {
    const getter = extraAttrs[prop].getFromDOM;
    const value = getter && getter(dom);
    if (value != null) attrsFromNode[prop] = value;
  }

  return attrsFromNode;
}

export function setNodeAttrs(node, extraAttrs) {
  const attrsForDOM = {};

  for (const prop in extraAttrs) {
    const setter = extraAttrs[prop].setDOMAttr;
    if (setter) setter(node.attrs[prop], attrsForDOM);
  }

  return attrsForDOM;
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
//     The group of the cell content, used to set all types nodes groups
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
  const tableCellExtraAttrs = {...options.cellAttributes || {}, ...cellExtraAttrs} ;
  const cellAttrs = {
    typesValues: {
      default: {
        text: '',
        number: '',
        currency: '',
        labels: [],
        date: -1,
        checkbox: false
      }
    }
  };
  for (const prop in tableCellExtraAttrs)
    cellAttrs[prop] = {default: tableCellExtraAttrs[prop].default};

  return {
    table: {
      content: 'table_row+',
      tableRole: 'table',
      isolating: true,
      group: options.tableGroup,
      attrs: {
        sort: {default: {col: null, dir: null}},
        headers: {default: true},
        labels: {default: []},
        filters: {default: []},
      },
      parseDOM: [{tag: 'table', getAttrs: (dom) => getNodeAttrs(dom, tableExtraAttrs)}],
      toDOM() {
        return ['table', setNodeAttrs(node, tableExtraAttrs), ['tbody',  0]];
      },
    },
    table_row: {
      content: '(table_cell | table_header)*',
      tableRole: 'row',
      attrs: {
        hidden: {default: false},
      },
      parseDOM: [{tag: 'tr'}],
      toDOM(node) {
        const {hidden} = node.attrs;
        return ['tr', {class: hidden ? 'hiddenRow' : ''}, 0];
      },
    },
    table_cell: {
      content: `${options.cellContent}`,
      attrs: cellAttrs,
      tableRole: 'cell',
      isolating: true,
      allowGapCursor: false,
      parseDOM: [{tag: 'td', getAttrs: (dom) => getNodeAttrs(dom, tableCellExtraAttrs)}],
      toDOM(node) {
        return ['td', setNodeAttrs(node, tableCellExtraAttrs), 0];
      },
    },
    table_header: {
      content: options.cellContent,
      attrs: cellAttrs,
      tableRole: 'header_cell',
      isolating: true,
      parseDOM: [{tag: 'th', getAttrs: (dom) => getNodeAttrs(dom, tableCellExtraAttrs)}],
      toDOM(node) {
        return ['th', setNodeAttrs(node, tableCellExtraAttrs), 0];
      },
    },
    checkbox: {
      attrs: {checked: {default: false}},
      group: options.cellContentGroup,
      draggable: false,
      selectable: false,
      parseDOM: [
        {
          tag: '.cell-checkbox',
          getAttrs: (dom) => getNodeAttrs(dom, checkboxExtraAttrs)
        },
      ],
      toDOM(node) {
        return [
          'div',
          {
            class: node.attrs.checked
              ? 'cell-checkbox checked'
              : 'cell-checkbox',
            ...setNodeAttrs(node, checkboxExtraAttrs)
          }
        ];
      },
    },
    date: {
      attrs: {value: {default: -1}},
      content: 'inline*',
      group: options.cellContentGroup,
      draggable: false,
      selectable: false,
      isolating: true,
      parseDOM: [
        {
          tag: '.cell-date',
          getAttrs: (dom) => getNodeAttrs(dom, dateExtraAttrs)

        },
      ],
      toDOM(node) {
        return [
          'div',
          {
            class: 'cell-date',
            ...setNodeAttrs(node, dateExtraAttrs)
          },
        ];
      },
    },
    label: {
      attrs: {labels: {default: []}},
      group: options.cellContentGroup,
      selectable: false,
      draggable: false,
      isolating: true,
      parseDOM: [
        {
          tag: '.cell-label',
          getAttrs: (dom) => getNodeAttrs(dom, labelsExtraAttrs)
        },
      ],
      toDOM(node) {
        return [
          'div',
          {
            class: 'cell-label',
            ...setNodeAttrs(node, labelsExtraAttrs)
          },
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
