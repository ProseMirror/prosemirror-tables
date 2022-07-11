import { Schema } from 'prosemirror-model';
import { schema as baseSchema } from 'prosemirror-schema-basic';
import { NodeSelection, TextSelection } from 'prosemirror-state';
import { builders } from 'prosemirror-test-builder';
import { cellAround, CellSelection, tableNodes } from '../src/';

let schema = new Schema({
  nodes: baseSchema.spec.nodes.append(
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

function resolveCell(doc, tag) {
  if (tag == null) return null;
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
  let cursor = doc.tag.cursor;
  if (cursor != null) return new TextSelection(doc.resolve(cursor));
  let $anchor = resolveCell(doc, doc.tag.anchor);
  if ($anchor)
    return new CellSelection(
      $anchor,
      resolveCell(doc, doc.tag.head) || undefined,
    );
  let node = doc.tag.node;
  if (node != null) return new NodeSelection(doc.resolve(node));
};
