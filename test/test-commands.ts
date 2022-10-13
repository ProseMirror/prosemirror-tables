import ist from 'ist';
import { EditorState } from 'prosemirror-state';

import {
  doc,
  table,
  tr,
  p,
  td,
  th,
  c,
  h,
  c11,
  h11,
  cEmpty,
  hEmpty,
  cCursor,
  hCursor,
  cHead,
  cAnchor,
  eq,
  selectionFor,
} from './build';
import {
  addColumnAfter,
  addColumnBefore,
  deleteColumn,
  addRowAfter,
  addRowBefore,
  deleteRow,
  mergeCells,
  splitCell,
  splitCellWithType,
  setCellAttr,
  toggleHeader,
  toggleHeaderRow,
  toggleHeaderColumn,
} from '../src/';

function test(doc, command, result) {
  let state = EditorState.create({ doc, selection: selectionFor(doc) });
  let ran = command(state, (tr) => (state = state.apply(tr)));
  if (result == null) ist(ran, false);
  else ist(state.doc, result, eq);
}

describe('addColumnAfter', () => {
  it('can add a plain column', () =>
    test(
      table(tr(c11, c11, c11), tr(c11, cCursor, c11), tr(c11, c11, c11)),
      addColumnAfter,
      table(
        tr(c11, c11, cEmpty, c11),
        tr(c11, c11, cEmpty, c11),
        tr(c11, c11, cEmpty, c11),
      ),
    ));

  it('can add a column at the right of the table', () =>
    test(
      table(tr(c11, c11, c11), tr(c11, c11, c11), tr(c11, c11, cCursor)),
      addColumnAfter,
      table(
        tr(c11, c11, c11, cEmpty),
        tr(c11, c11, c11, cEmpty),
        tr(c11, c11, c11, cEmpty),
      ),
    ));

  it('can add a second cell', () =>
    test(table(tr(cCursor)), addColumnAfter, table(tr(c11, cEmpty))));

  it('can grow a colspan cell', () =>
    test(
      table(tr(cCursor, c11), tr(c(2, 1))),
      addColumnAfter,
      table(tr(c11, cEmpty, c11), tr(c(3, 1))),
    ));

  it("places new cells in the right spot when there's row spans", () =>
    test(
      table(tr(c11, c(1, 2), c(1, 2)), tr(c11), tr(c11, cCursor, c11)),
      addColumnAfter,
      table(
        tr(c11, c(1, 2), cEmpty, c(1, 2)),
        tr(c11, cEmpty),
        tr(c11, c11, cEmpty, c11),
      ),
    ));

  it('can place new cells into an empty row', () =>
    test(
      table(tr(c(1, 2), c(1, 2)), tr(), tr(cCursor, c11)),
      addColumnAfter,
      table(tr(c(1, 2), cEmpty, c(1, 2)), tr(cEmpty), tr(c11, cEmpty, c11)),
    ));

  it('will skip ahead when growing a rowspan cell', () =>
    test(
      table(tr(c(2, 2), c11), tr(c11), tr(cCursor, c11, c11)),
      addColumnAfter,
      table(tr(c(3, 2), c11), tr(c11), tr(cCursor, cEmpty, c11, c11)),
    ));

  it('will use the right side of a single cell selection', () =>
    test(
      table(tr(cAnchor, c11), tr(c11, c11)),
      addColumnAfter,
      table(tr(c11, cEmpty, c11), tr(c11, cEmpty, c11)),
    ));

  it('will use the right side of a bigger cell selection', () =>
    test(
      table(tr(cHead, c11, c11), tr(c11, cAnchor, c11)),
      addColumnAfter,
      table(tr(c11, c11, cEmpty, c11), tr(c11, c11, cEmpty, c11)),
    ));

  it('properly handles a cell node selection', () =>
    test(
      table(tr('<node>', c11, c11), tr(c11, c11)),
      addColumnAfter,
      table(tr(c11, cEmpty, c11), tr(c11, cEmpty, c11)),
    ));

  it('preserves header rows', () =>
    test(
      table(tr(h11, h11), tr(c11, cCursor)),
      addColumnAfter,
      table(tr(h11, h11, hEmpty), tr(c11, c11, cEmpty)),
    ));

  it('uses column after as reference when header column before', () =>
    test(
      table(tr(h11, h11), tr(hCursor, c11)),
      addColumnAfter,
      table(tr(h11, hEmpty, h11), tr(h11, cEmpty, c11)),
    ));

  it('creates regular cells when only next to a header column', () =>
    test(
      table(tr(c11, h11), tr(c11, hCursor)),
      addColumnAfter,
      table(tr(c11, h11, cEmpty), tr(c11, h11, cEmpty)),
    ));

  it('does nothing outside of a table', () =>
    test(doc(p('foo<cursor>')), addColumnAfter, null));

  it('preserves column widths', () =>
    test(
      table(
        tr(cAnchor, c11),
        tr(td({ colspan: 2, colwidth: [100, 200] }, p('a'))),
      ),
      addColumnAfter,
      table(
        tr(cAnchor, cEmpty, c11),
        tr(td({ colspan: 3, colwidth: [100, 0, 200] }, p('a'))),
      ),
    ));
});

describe('addColumnBefore', () => {
  it('can add a plain column', () =>
    test(
      table(tr(c11, c11, c11), tr(c11, cCursor, c11), tr(c11, c11, c11)),
      addColumnBefore,
      table(
        tr(c11, cEmpty, c11, c11),
        tr(c11, cEmpty, c11, c11),
        tr(c11, cEmpty, c11, c11),
      ),
    ));

  it('can add a column at the left of the table', () =>
    test(
      table(tr(cCursor, c11, c11), tr(c11, c11, c11), tr(c11, c11, c11)),
      addColumnBefore,
      table(
        tr(cEmpty, c11, c11, c11),
        tr(cEmpty, c11, c11, c11),
        tr(cEmpty, c11, c11, c11),
      ),
    ));

  it('will use the left side of a single cell selection', () =>
    test(
      table(tr(cAnchor, c11), tr(c11, c11)),
      addColumnBefore,
      table(tr(cEmpty, c11, c11), tr(cEmpty, c11, c11)),
    ));

  it('will use the left side of a bigger cell selection', () =>
    test(
      table(tr(c11, cHead, c11), tr(c11, c11, cAnchor)),
      addColumnBefore,
      table(tr(c11, cEmpty, c11, c11), tr(c11, cEmpty, c11, c11)),
    ));

  it('preserves header rows', () =>
    test(
      table(tr(h11, h11), tr(cCursor, c11)),
      addColumnBefore,
      table(tr(hEmpty, h11, h11), tr(cEmpty, c11, c11)),
    ));
});

describe('deleteColumn', () => {
  it('can delete a plain column', () =>
    test(
      table(tr(cEmpty, c11, c11), tr(c11, cCursor, c11), tr(c11, c11, cEmpty)),
      deleteColumn,
      table(tr(cEmpty, c11), tr(c11, c11), tr(c11, cEmpty)),
    ));

  it('can delete the first column', () =>
    test(
      table(tr(cCursor, cEmpty, c11), tr(c11, c11, c11), tr(c11, c11, c11)),
      deleteColumn,
      table(tr(cEmpty, c11), tr(c11, c11), tr(c11, c11)),
    ));

  it('can delete the last column', () =>
    test(
      table(tr(c11, cEmpty, cCursor), tr(c11, c11, c11), tr(c11, c11, c11)),
      deleteColumn,
      table(tr(c11, cEmpty), tr(c11, c11), tr(c11, c11)),
    ));

  it("can reduce a cell's colspan", () =>
    test(
      table(tr(c11, cCursor), tr(c(2, 1))),
      deleteColumn,
      table(tr(c11), tr(c11)),
    ));

  it('will skip rows after a rowspan', () =>
    test(
      table(tr(c11, cCursor), tr(c11, c(1, 2)), tr(c11)),
      deleteColumn,
      table(tr(c11), tr(c11), tr(c11)),
    ));

  it('will delete all columns under a colspan cell', () =>
    test(
      table(tr(c11, td({ colspan: 2 }, p('<cursor>'))), tr(cEmpty, c11, c11)),
      deleteColumn,
      table(tr(c11), tr(cEmpty)),
    ));

  it('deletes a cell-selected column', () =>
    test(
      table(tr(cEmpty, cAnchor), tr(c11, cHead)),
      deleteColumn,
      table(tr(cEmpty), tr(c11)),
    ));

  it('deletes multiple cell-selected columns', () =>
    test(
      table(tr(c(1, 2), cAnchor, c11), tr(c11, cEmpty), tr(cHead, c11, c11)),
      deleteColumn,
      table(tr(c11), tr(cEmpty), tr(c11)),
    ));

  it('leaves column widths intact', () =>
    test(
      table(
        tr(c11, cAnchor, c11),
        tr(td({ colspan: 3, colwidth: [100, 200, 300] }, p('y'))),
      ),
      deleteColumn,
      table(tr(c11, c11), tr(td({ colspan: 2, colwidth: [100, 300] }, p('y')))),
    ));

  it('resets column width when all zeroes', () =>
    test(
      table(
        tr(c11, cAnchor, c11),
        tr(td({ colspan: 3, colwidth: [0, 200, 0] }, p('y'))),
      ),
      deleteColumn,
      table(tr(c11, c11), tr(td({ colspan: 2 }, p('y')))),
    ));
});

describe('addRowAfter', () => {
  it('can add a simple row', () =>
    test(
      table(tr(cCursor, c11), tr(c11, c11)),
      addRowAfter,
      table(tr(c11, c11), tr(cEmpty, cEmpty), tr(c11, c11)),
    ));

  it('can add a row at the end', () =>
    test(
      table(tr(c11, c11), tr(c11, cCursor)),
      addRowAfter,
      table(tr(c11, c11), tr(c11, c11), tr(cEmpty, cEmpty)),
    ));

  it('increases rowspan when needed', () =>
    test(
      table(tr(cCursor, c(1, 2)), tr(c11)),
      addRowAfter,
      table(tr(c11, c(1, 3)), tr(cEmpty), tr(c11)),
    ));

  it('skips columns for colspan cells', () =>
    test(
      table(tr(cCursor, c(2, 2)), tr(c11)),
      addRowAfter,
      table(tr(c11, c(2, 3)), tr(cEmpty), tr(c11)),
    ));

  it('picks the row after a cell selection', () =>
    test(
      table(tr(cHead, c11, c11), tr(c11, cAnchor, c11), tr(c(3, 1))),
      addRowAfter,
      table(
        tr(c11, c11, c11),
        tr(c11, c11, c11),
        tr(cEmpty, cEmpty, cEmpty),
        tr(c(3, 1)),
      ),
    ));

  it('preserves header columns', () =>
    test(
      table(tr(c11, hCursor), tr(c11, h11)),
      addRowAfter,
      table(tr(c11, h11), tr(cEmpty, hEmpty), tr(c11, h11)),
    ));

  it('uses next row as reference when row before is a header', () =>
    test(
      table(tr(h11, hCursor), tr(c11, h11)),
      addRowAfter,
      table(tr(h11, h11), tr(cEmpty, hEmpty), tr(c11, h11)),
    ));

  it('creates regular cells when no reference row is available', () =>
    test(
      table(tr(h11, hCursor)),
      addRowAfter,
      table(tr(h11, h11), tr(cEmpty, cEmpty)),
    ));
});

describe('addRowBefore', () => {
  it('can add a simple row', () =>
    test(
      table(tr(c11, c11), tr(cCursor, c11)),
      addRowBefore,
      table(tr(c11, c11), tr(cEmpty, cEmpty), tr(c11, c11)),
    ));

  it('can add a row at the start', () =>
    test(
      table(tr(cCursor, c11), tr(c11, c11)),
      addRowBefore,
      table(tr(cEmpty, cEmpty), tr(c11, c11), tr(c11, c11)),
    ));

  it('picks the row before a cell selection', () =>
    test(
      table(tr(c11, c(2, 1)), tr(cAnchor, c11, c11), tr(c11, cHead, c11)),
      addRowBefore,
      table(
        tr(c11, c(2, 1)),
        tr(cEmpty, cEmpty, cEmpty),
        tr(c11, c11, c11),
        tr(c11, c11, c11),
      ),
    ));

  it('preserves header columns', () =>
    test(
      table(tr(hCursor, c11), tr(h11, c11)),
      addRowBefore,
      table(tr(hEmpty, cEmpty), tr(h11, c11), tr(h11, c11)),
    ));
});

describe('deleteRow', () => {
  it('can delete a simple row', () =>
    test(
      table(tr(c11, cEmpty), tr(cCursor, c11), tr(c11, cEmpty)),
      deleteRow,
      table(tr(c11, cEmpty), tr(c11, cEmpty)),
    ));

  it('can delete the first row', () =>
    test(
      table(tr(c11, cCursor), tr(cEmpty, c11), tr(c11, cEmpty)),
      deleteRow,
      table(tr(cEmpty, c11), tr(c11, cEmpty)),
    ));

  it('can delete the last row', () =>
    test(
      table(tr(cEmpty, c11), tr(c11, cEmpty), tr(c11, cCursor)),
      deleteRow,
      table(tr(cEmpty, c11), tr(c11, cEmpty)),
    ));

  it('can shrink rowspan cells', () =>
    test(
      table(tr(c(1, 2), c11, c(1, 3)), tr(cCursor), tr(c11, c11)),
      deleteRow,
      table(tr(c11, c11, c(1, 2)), tr(c11, c11)),
    ));

  it('can move cells that start in the deleted row', () =>
    test(
      table(tr(c(1, 2), cCursor), tr(cEmpty)),
      deleteRow,
      table(tr(c11, cEmpty)),
    ));

  it('deletes multiple rows when the start cell has a rowspan', () =>
    test(
      table(
        tr(td({ rowspan: 3 }, p('<cursor>')), c11),
        tr(c11),
        tr(c11),
        tr(c11, c11),
      ),
      deleteRow,
      table(tr(c11, c11)),
    ));

  it('skips columns when adjusting rowspan', () =>
    test(
      table(tr(cCursor, c(2, 2)), tr(c11)),
      deleteRow,
      table(tr(c11, c(2, 1))),
    ));

  it('can delete a cell selection', () =>
    test(
      table(tr(cAnchor, c11), tr(c11, cEmpty)),
      deleteRow,
      table(tr(c11, cEmpty)),
    ));

  it('will delete all rows in the cell selection', () =>
    test(
      table(tr(c11, cEmpty), tr(cAnchor, c11), tr(c11, cHead), tr(cEmpty, c11)),
      deleteRow,
      table(tr(c11, cEmpty), tr(cEmpty, c11)),
    ));
});

describe('mergeCells', () => {
  it("doesn't do anything when only one cell is selected", () =>
    test(table(tr(cAnchor, c11)), mergeCells, null));

  it("doesn't do anything when the selection cuts across spanning cells", () =>
    test(table(tr(cAnchor, c(2, 1)), tr(c11, cHead, c11)), mergeCells, null));

  it('can merge two cells in a column', () =>
    test(
      table(tr(cAnchor, cHead, c11)),
      mergeCells,
      table(tr(td({ colspan: 2 }, p('x'), p('x')), c11)),
    ));

  it('can merge two cells in a row', () =>
    test(
      table(tr(cAnchor, c11), tr(cHead, c11)),
      mergeCells,
      table(tr(td({ rowspan: 2 }, p('x'), p('x')), c11), tr(c11)),
    ));

  it('can merge a rectangle of cells', () =>
    test(
      table(
        tr(c11, cAnchor, cEmpty, cEmpty, c11),
        tr(c11, cEmpty, cEmpty, cHead, c11),
      ),
      mergeCells,
      table(
        tr(c11, td({ rowspan: 2, colspan: 3 }, p('x'), p('x')), c11),
        tr(c11, c11),
      ),
    ));

  it('can merge already spanning cells', () =>
    test(
      table(
        tr(c11, cAnchor, c(1, 2), cEmpty, c11),
        tr(c11, cEmpty, cHead, c11),
      ),
      mergeCells,
      table(
        tr(c11, td({ rowspan: 2, colspan: 3 }, p('x'), p('x'), p('x')), c11),
        tr(c11, c11),
      ),
    ));

  it('keeps the column width of the first col', () =>
    test(
      table(tr(td({ colwidth: [100] }, p('x<anchor>')), c11), tr(c11, cHead)),
      mergeCells,
      table(
        tr(
          td(
            { colspan: 2, rowspan: 2, colwidth: [100, 0] },
            p('x'),
            p('x'),
            p('x'),
            p('x'),
          ),
        ),
        tr(),
      ),
    ));
});

describe('splitCell', () => {
  it('does nothing when cursor is inside of a cell with attributes colspan = 1 and rowspan = 1', () =>
    test(table(tr(cCursor, c11)), splitCell, null));

  it('can split when col-spanning cell with cursor', () =>
    test(
      table(tr(td({ colspan: 2 }, p('foo<cursor>')), c11)),
      splitCell,
      table(tr(td(p('foo')), cEmpty, c11)),
    ));

  it('can split when col-spanning header-cell with cursor', () =>
    test(
      table(tr(th({ colspan: 2 }, p('foo<cursor>')))),
      splitCell,
      table(tr(th(p('foo')), hEmpty)),
    ));

  it('does nothing for a multi-cell selection', () =>
    test(table(tr(cAnchor, cHead, c11)), splitCell, null));

  it("does nothing when the selected cell doesn't span anything", () =>
    test(table(tr(cAnchor, c11)), splitCell, null));

  it('can split a col-spanning cell', () =>
    test(
      table(tr(td({ colspan: 2 }, p('foo<anchor>')), c11)),
      splitCell,
      table(tr(td(p('foo')), cEmpty, c11)),
    ));

  it('can split a row-spanning cell', () =>
    test(
      table(tr(c11, td({ rowspan: 2 }, p('foo<anchor>')), c11), tr(c11, c11)),
      splitCell,
      table(tr(c11, td(p('foo')), c11), tr(c11, cEmpty, c11)),
    ));

  it('can split a rectangular cell', () =>
    test(
      table(
        tr(c(4, 1)),
        tr(c11, td({ rowspan: 2, colspan: 2 }, p('foo<anchor>')), c11),
        tr(c11, c11),
      ),
      splitCell,
      table(
        tr(c(4, 1)),
        tr(c11, td(p('foo')), cEmpty, c11),
        tr(c11, cEmpty, cEmpty, c11),
      ),
    ));

  it('distributes column widths', () =>
    test(
      table(tr(td({ colspan: 3, colwidth: [100, 0, 200] }, p('a<anchor>')))),
      splitCell,
      table(
        tr(
          td({ colwidth: [100] }, p('a')),
          cEmpty,
          td({ colwidth: [200] }, p()),
        ),
      ),
    ));

  describe('with custom cell type', () => {
    function createGetCellType(state) {
      return ({ row }) => {
        if (row === 0) {
          return state.schema.nodes.table_header;
        }
        return state.schema.nodes.table_cell;
      };
    }

    const splitCellWithOnlyHeaderInColumnZero = (state, dispatch) =>
      splitCellWithType(createGetCellType(state))(state, dispatch);

    it('can split a row-spanning header cell into a header and normal cell ', () =>
      test(
        table(tr(c11, td({ rowspan: 2 }, p('foo<anchor>')), c11), tr(c11, c11)),
        splitCellWithOnlyHeaderInColumnZero,
        table(tr(c11, th(p('foo')), c11), tr(c11, cEmpty, c11)),
      ));
  });
});

describe('setCellAttr', () => {
  let cAttr = td({ test: 'value' }, p('x'));

  it('can set an attribute on a parent cell', () =>
    test(
      table(tr(cCursor, c11)),
      setCellAttr('test', 'value'),
      table(tr(cAttr, c11)),
    ));

  it('does nothing when the attribute is already there', () =>
    test(table(tr(cCursor, c11)), setCellAttr('test', 'default'), null));

  it('will set attributes on all cells covered by a cell selection', () =>
    test(
      table(tr(c11, cAnchor, c11), tr(c(2, 1), cHead), tr(c11, c11, c11)),
      setCellAttr('test', 'value'),
      table(tr(c11, cAttr, cAttr), tr(c(2, 1), cAttr), tr(c11, c11, c11)),
    ));
});

describe('toggleHeaderRow', () => {
  it('turns a non-header row into header', () =>
    test(
      doc(table(tr(cCursor, c11), tr(c11, c11))),
      toggleHeaderRow,
      doc(table(tr(h11, h11), tr(c11, c11))),
    ));

  it('turns a header row into regular cells', () =>
    test(
      doc(table(tr(hCursor, h11), tr(c11, c11))),
      toggleHeaderRow,
      doc(table(tr(c11, c11), tr(c11, c11))),
    ));

  it('turns a partial header row into regular cells', () =>
    test(
      doc(table(tr(cCursor, h11), tr(c11, c11))),
      toggleHeaderRow,
      doc(table(tr(c11, c11), tr(c11, c11))),
    ));

  it('leaves cell spans intact', () =>
    test(
      doc(table(tr(cCursor, c(2, 2)), tr(c11), tr(c11, c11, c11))),
      toggleHeaderRow,
      doc(table(tr(h11, h(2, 2)), tr(c11), tr(c11, c11, c11))),
    ));
});

describe('toggleHeaderColumn', () => {
  it('turns a non-header column into header', () =>
    test(
      doc(table(tr(cCursor, c11), tr(c11, c11))),
      toggleHeaderColumn,
      doc(table(tr(h11, c11), tr(h11, c11))),
    ));

  it('turns a header column into regular cells', () =>
    test(
      doc(table(tr(hCursor, h11), tr(h11, c11))),
      toggleHeaderColumn,
      doc(table(tr(c11, h11), tr(c11, c11))),
    ));

  it('turns a partial header column into regular cells', () =>
    test(
      doc(table(tr(hCursor, c11), tr(c11, c11))),
      toggleHeaderColumn,
      doc(table(tr(c11, c11), tr(c11, c11))),
    ));
});

describe('toggleHeader', () => {
  it('turns a header row with colspan and rowspan into a regular cell', () =>
    test(
      doc(
        p('x'),
        table(tr(h(2, 1), h(1, 2)), tr(cCursor, c11), tr(c11, c11, c11)),
      ),
      toggleHeader('row', { useDeprecateLogic: false }),
      doc(
        p('x'),
        table(tr(c(2, 1), c(1, 2)), tr(cCursor, c11), tr(c11, c11, c11)),
      ),
    ));

  it('turns a header column with colspan and rowspan into a regular cell', () =>
    test(
      doc(
        p('x'),
        table(tr(h(2, 1), h(1, 2)), tr(cCursor, c11), tr(c11, c11, c11)),
      ),
      toggleHeader('column', { useDeprecateLogic: false }),
      doc(p('x'), table(tr(h(2, 1), h(1, 2)), tr(h11, c11), tr(h11, c11, c11))),
    ));

  it('should keep first cell as header when the column header is enabled', () =>
    test(
      doc(p('x'), table(tr(h11, c11), tr(hCursor, c11), tr(h11, c11))),
      toggleHeader('row', { useDeprecateLogic: false }),
      doc(p('x'), table(tr(h11, h11), tr(h11, c11), tr(h11, c11))),
    ));

  describe('new behavior', () => {
    it('turns a header column into regular cells without override header row', () =>
      test(
        doc(table(tr(hCursor, h11), tr(h11, c11))),
        toggleHeader('column', { useDeprecateLogic: false }),
        doc(table(tr(hCursor, h11), tr(c11, c11))),
      ));
  });
});
