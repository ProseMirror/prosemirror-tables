import ist from 'ist';
import { describe, it } from 'vitest';

import { TableMap } from '../src';

import { table, tr, td, p } from './build';

describe('CellSelection rectangular constraint', () => {
  it('should expand selection to include full rowspan cells', () => {
    // Table structure:
    // | A  | B (rowspan=2) | C  |
    // | D  | B             | E  |
    const tableNode = table(
      tr(
        /* 1*/ td(p('A')),
        /* 6*/ td({ rowspan: 2 }, p('B')),
        /*11*/ td(p('C')),
      ),
      tr(
        /*18*/ td(p('D')),
        // B continues here
        /*23*/ td(p('E')),
      ),
    );

    const map = TableMap.get(tableNode);

    // Select from A (pos=1) to C (pos=11)
    // Because B has rowspan=2, the selection should expand to a rectangle
    // that includes D and E
    const rect = map.rectBetween(1, 11);

    // Expected: selection should include all cells A, B, C, D, E
    const cells = map.cellsInRect(rect);

    // Verify the selection is rectangular (should include the second row)
    ist(rect.top, 0);
    ist(rect.bottom, 2); // Should be 2, not 1
    ist(rect.left, 0);
    ist(rect.right, 3);

    // Should include all 5 cells
    ist(cells.length, 5);
  });

  it('should expand selection to include full colspan cells', () => {
    // Table structure:
    // | A  | B  | C  |
    // | D (colspan=2) | E  |
    // When selecting from A to E, crossing D (colspan=2),
    // the selection should be a complete rectangle
    const tableNode = table(
      tr(/* 1*/ td(p('A')), /* 6*/ td(p('B')), /*11*/ td(p('C'))),
      tr(/*18*/ td({ colspan: 2 }, p('D')), /*23*/ td(p('E'))),
    );

    const map = TableMap.get(tableNode);

    // Select from A (pos=1) to E (pos=23)
    // Should form a complete rectangle
    const rect = map.rectBetween(1, 23);

    const cells = map.cellsInRect(rect);

    // Verify the selection is rectangular
    ist(rect.top, 0);
    ist(rect.bottom, 2);
    ist(rect.left, 0);
    ist(rect.right, 3);

    // Should include all cells
    ist(cells.length, 5);
  });

  it('should expand selection with complex rowspan and colspan', () => {
    // Table structure:
    // | A  | B (colspan=2) |
    // | C (rowspan=2) | D  | E  |
    // | C             | F  | G  |
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

    // Select from cell "A" (pos=1) to cell "F" (pos=30)
    // This should expand to include all cells because:
    // - Cell "B" has colspan=2 and overlaps the selection
    // - Cell "C" has rowspan=2 and overlaps the selection
    const rect = map.rectBetween(1, 30);

    // Verify the selection is rectangular and includes all cells
    ist(rect.top, 0);
    ist(rect.bottom, 3);
    ist(rect.left, 0);
    ist(rect.right, 3);

    // Should include all 7 cells
    const cells = map.cellsInRect(rect);
    ist(cells.length, 7);
  });
});
