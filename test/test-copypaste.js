import ist from 'ist';
import { EditorState } from 'prosemirror-state';
import { Fragment } from 'prosemirror-model';

import {
  doc,
  table,
  p,
  tr,
  td,
  cEmpty,
  c11,
  h11,
  hEmpty,
  c,
  cAnchor,
  eq,
} from './build';
import {
  cellAround,
  TableMap,
  __pastedCells as pastedCells,
  __insertCells as insertCells,
  __clipCells as clipCells,
} from '../src/';

describe('pastedCells', () => {
  function test(slice, width, height, content) {
    let result = pastedCells(slice.slice(slice.tag.a, slice.tag.b));
    if (width == null) return ist(result, null);
    ist(result.rows.length, result.height);
    ist(result.width, width);
    ist(result.height, height);
    if (content)
      result.rows.forEach((row, i) => ist(row, Fragment.from(content[i]), eq));
  }

  it('returns simple cells', () =>
    test(table(tr('<a>', cEmpty, cEmpty, '<b>')), 2, 1, [[cEmpty, cEmpty]]));

  it('returns cells wrapped in a row', () =>
    test(table('<a>', tr(cEmpty, cEmpty), '<b>'), 2, 1, [[cEmpty, cEmpty]]));

  it('returns cells when the cursor is inside them', () =>
    test(table(tr(td(p('<a>foo')), td(p('<b>bar')))), 2, 1, [
      [td(p('foo')), cEmpty],
    ]));

  it('returns multiple rows', () =>
    test(table(tr('<a>', cEmpty, cEmpty), tr(cEmpty, c11), '<b>'), 2, 2, [
      [cEmpty, cEmpty],
      [cEmpty, c11],
    ]));

  it('will enter a fully selected table', () =>
    test(doc('<a>', table(tr(c11)), '<b>'), 1, 1, [[c11]]));

  it('can normalize a partially-selected row', () =>
    test(table(tr(td(p(), '<a>'), cEmpty, c11), tr(c11, c11), '<b>'), 2, 2, [
      [cEmpty, c11],
      [c11, c11],
    ]));

  it('will make sure the result is rectangular', () =>
    test(table('<a>', tr(c(2, 2), c11), tr(), tr(c11, c11), '<b>'), 3, 3, [
      [c(2, 2), c11],
      [cEmpty],
      [c11, c11, cEmpty],
    ]));

  it('can handle rowspans sticking out', () =>
    test(table('<a>', tr(c(1, 3), c11), '<b>'), 2, 3, [
      [c(1, 3), c11],
      [cEmpty],
      [cEmpty],
    ]));

  it('returns null for non-cell selection', () =>
    test(doc(p('foo<a>bar'), p('baz<b>')), null));
});

describe('clipCells', () => {
  function test(slice, width, height, content) {
    let result = clipCells(
      pastedCells(slice.slice(slice.tag.a, slice.tag.b)),
      width,
      height,
    );
    ist(result.rows.length, result.height);
    ist(result.width, width);
    ist(result.height, height);
    if (content)
      result.rows.forEach((row, i) => ist(row, Fragment.from(content[i]), eq));
  }

  it('can clip off excess cells', () =>
    test(table('<a>', tr(cEmpty, c11), tr(c11, c11), '<b>'), 1, 1, [[cEmpty]]));

  it('will pad by repeating cells', () =>
    test(table('<a>', tr(cEmpty, c11), tr(c11, cEmpty), '<b>'), 4, 4, [
      [cEmpty, c11, cEmpty, c11],
      [c11, cEmpty, c11, cEmpty],
      [cEmpty, c11, cEmpty, c11],
      [c11, cEmpty, c11, cEmpty],
    ]));

  it('takes rowspan into account when counting width', () =>
    test(table('<a>', tr(c(2, 2), c11), tr(c11), '<b>'), 6, 2, [
      [c(2, 2), c11, c(2, 2), c11],
      [c11, c11],
    ]));

  it('clips off excess colspan', () =>
    test(table('<a>', tr(c(2, 2), c11), tr(c11), '<b>'), 4, 2, [
      [c(2, 2), c11, c(1, 2)],
      [c11],
    ]));

  it('clips off excess rowspan', () =>
    test(table('<a>', tr(c(2, 2), c11), tr(c11), '<b>'), 2, 3, [
      [c(2, 2)],
      [],
      [c(2, 1)],
    ]));

  it('clips off excess rowspan when new table height is bigger than the current table height', () =>
    test(table('<a>', tr(c(1, 2), c(2, 1)), tr(c11, c11), '<b>'), 3, 1, [
      [c(1, 1), c(2, 1)],
    ]));
});

describe('insertCells', () => {
  function test(table, cells, result) {
    let state = EditorState.create({ doc: table });
    let $cell = cellAround(table.resolve(table.tag.anchor)),
      map = TableMap.get(table);
    insertCells(
      state,
      (tr) => (state = state.apply(tr)),
      0,
      map.findCell($cell.pos),
      pastedCells(cells.slice(cells.tag.a, cells.tag.b)),
    );
    ist(state.doc, result, eq);
  }

  it('keeps the original cells', () =>
    test(
      table(tr(cAnchor, c11, c11), tr(c11, c11, c11)),
      table(tr(td(p('<a>foo')), cEmpty), tr(c(2, 1), '<b>')),
      table(tr(td(p('foo')), cEmpty, c11), tr(c(2, 1), c11)),
    ));

  it('makes sure the table is big enough', () =>
    test(
      table(tr(cAnchor)),
      table(tr(td(p('<a>foo')), cEmpty), tr(c(2, 1), '<b>')),
      table(tr(td(p('foo')), cEmpty), tr(c(2, 1))),
    ));

  it('preserves headers while growing a table', () =>
    test(
      table(tr(h11, h11, h11), tr(h11, c11, c11), tr(h11, c11, cAnchor)),
      table(tr(td(p('<a>foo')), cEmpty), tr(c11, c11, '<b>')),
      table(
        tr(h11, h11, h11, hEmpty),
        tr(h11, c11, c11, cEmpty),
        tr(h11, c11, td(p('foo')), cEmpty),
        tr(hEmpty, cEmpty, c11, c11),
      ),
    ));

  it('will split interfering rowspan cells', () =>
    test(
      table(
        tr(c11, c(1, 4), c11),
        tr(cAnchor, c11),
        tr(c11, c11),
        tr(c11, c11),
      ),
      table(tr('<a>', cEmpty, cEmpty, cEmpty, '<b>')),
      table(
        tr(c11, c11, c11),
        tr(cEmpty, cEmpty, cEmpty),
        tr(c11, td({ rowspan: 2 }, p()), c11),
        tr(c11, c11),
      ),
    ));

  it('will split interfering colspan cells', () =>
    test(
      table(tr(c11, cAnchor, c11), tr(c(2, 1), c11), tr(c11, c(2, 1))),
      table('<a>', tr(cEmpty), tr(cEmpty), tr(cEmpty), '<b>'),
      table(
        tr(c11, cEmpty, c11),
        tr(c11, cEmpty, c11),
        tr(c11, cEmpty, cEmpty),
      ),
    ));

  it('preserves widths when splitting', () =>
    test(
      table(
        tr(c11, cAnchor, c11),
        tr(td({ colspan: 3, colwidth: [100, 200, 300] }, p('x'))),
      ),
      table('<a>', tr(cEmpty), tr(cEmpty), '<b>'),
      table(
        tr(c11, cEmpty, c11),
        tr(
          td({ colwidth: [100] }, p('x')),
          cEmpty,
          td({ colwidth: [300] }, p()),
        ),
      ),
    ));
});
