import { Schema } from 'prosemirror-model';
import { TextSelection, NodeSelection } from 'prosemirror-state';
import { schema as baseSchema } from 'prosemirror-schema-basic';
import { tableNodes, cellAround, CellSelection } from '../src/';

const schema = new Schema({
  // eslint-disable-next-line
  nodes: (baseSchema.spec.nodes as any).append(
    tableNodes({
      tableGroup: 'block',
      cellContent: 'block+',
      cellAttributes: {
        test: { default: 'default' },
      },
    }),
  ),
  marks: baseSchema.spec.marks,
});

import buildersPkg from 'prosemirror-test-builder';
const { builders } = buildersPkg;

function resolveCell(doc, tag) {
  if (tag == null) {
    return null;
  }
  return cellAround(doc.resolve(tag));
}

export const { doc, table, tr, p, td, th } = builders(schema, {
  p: { nodeType: 'paragraph' },
  tr: { nodeType: 'table_row' },
  td: { nodeType: 'table_cell' },
  th: { nodeType: 'table_header' },
});

export const c = function (colspan, rowspan) {
  return td({ colspan, rowspan }, p('x'));
};

export const c11 = c(1, 1);
export const cEmpty = td(p());
export const cCursor = td(p('x<cursor>'));
export const cAnchor = td(p('x<anchor>'));
export const cHead = td(p('x<head>'));

export const h = function (colspan, rowspan) {
  return th({ colspan, rowspan }, p('x'));
};
export const h11 = h(1, 1);
export const hEmpty = th(p());
export const hCursor = th(p('x<cursor>'));

export const eq = function (a, b) {
  return a.eq(b);
};

export const selectionFor = function (doc) {
  const cursor = doc.tag.cursor;
  if (cursor != null) {
    return new TextSelection(doc.resolve(cursor));
  }
  const $anchor = resolveCell(doc, doc.tag.anchor);
  if ($anchor) {
    return new CellSelection(
      $anchor,
      resolveCell(doc, doc.tag.head) || undefined,
    );
  }
  const node = doc.tag.node;
  if (!node) {
    throw new Error('There is no selection tag set');
  }

  return new NodeSelection(doc.resolve(node));
};
