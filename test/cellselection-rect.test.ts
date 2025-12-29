import ist from 'ist';
import { describe, it } from 'vitest';

import { TableMap } from '../src';

import { table, tr, td, p } from './build';

describe('CellSelection rectangular constraint', () => {
  it('expands selection to include full rowspan cells', () => {
    // | A  | B (rowspan=2) | C  |
    // | D  | B             | E  |
    const tableNode = table(
      tr(
        /* 1*/ td(p('A')),
        /* 6*/ td({ rowspan: 2 }, p('B')),
        /*11*/ td(p('C')),
      ),
      tr(/*18*/ td(p('D')), /*23*/ td(p('E'))),
    );

    const map = TableMap.get(tableNode);
    const rect = map.rectBetween(1, 11, true);
    const cells = map.cellsInRect(rect);

    ist(rect.top, 0);
    ist(rect.bottom, 2);
    ist(rect.left, 0);
    ist(rect.right, 3);
    ist(cells.length, 5);
  });

  it('expands selection to include full colspan cells', () => {
    // | A  | B  | C  |
    // | D (colspan=2) | E  |
    const tableNode = table(
      tr(/* 1*/ td(p('A')), /* 6*/ td(p('B')), /*11*/ td(p('C'))),
      tr(/*18*/ td({ colspan: 2 }, p('D')), /*23*/ td(p('E'))),
    );

    const map = TableMap.get(tableNode);
    const rect = map.rectBetween(1, 23, true);
    const cells = map.cellsInRect(rect);

    ist(rect.top, 0);
    ist(rect.bottom, 2);
    ist(rect.left, 0);
    ist(rect.right, 3);
    ist(cells.length, 5);
  });

  it('expands selection with complex rowspan and colspan', () => {
    // | A  | B (colspan=2)     |
    // | C (rowspan=2) | D  | E |
    // | C             | F  | G |
    const tableNode = table(
      tr(/* 1*/ td(p('A')), /* 6*/ td({ colspan: 2 }, p('B'))),
      tr(
        /*13*/ td({ rowspan: 2 }, p('C')),
        /*18*/ td(p('D')),
        /*23*/ td(p('E')),
      ),
      tr(/*30*/ td(p('F')), /*35*/ td(p('G'))),
    );

    const map = TableMap.get(tableNode);
    const rect = map.rectBetween(1, 30, true);
    const cells = map.cellsInRect(rect);

    ist(rect.top, 0);
    ist(rect.bottom, 3);
    ist(rect.left, 0);
    ist(rect.right, 3);
    ist(cells.length, 7);
  });
});
