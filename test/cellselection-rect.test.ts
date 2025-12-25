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
        td(p('A')), // pos 1
        td({ rowspan: 2 }, p('B')), // pos 6
        td(p('C')), // pos 11
      ),
      tr(
        td(p('D')), // pos 18
        // B continues here
        td(p('E')), // pos 23
      ),
    );

    const map = TableMap.get(tableNode);

    // Select from A (pos=1) to C (pos=11)
    // Because B has rowspan=2, the selection should expand to a rectangle
    // that includes D and E
    const rect = map.rectBetween(1, 11);

    console.log('Map:', map.map);
    console.log('Rect:', rect);
    console.log('Cells in rect:', map.cellsInRect(rect));

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
      tr(
        td(p('A')), // pos 1
        td(p('B')), // pos 6
        td(p('C')), // pos 11
      ),
      tr(
        td({ colspan: 2 }, p('D')), // pos 18
        td(p('E')), // pos 23
      ),
    );

    const map = TableMap.get(tableNode);

    // Select from A (pos=1) to E (pos=23)
    // Should form a complete rectangle
    const rect = map.rectBetween(1, 23);

    console.log('Map:', map.map);
    console.log('Rect:', rect);
    console.log('Cells in rect:', map.cellsInRect(rect));

    const cells = map.cellsInRect(rect);

    // Verify the selection is rectangular
    ist(rect.top, 0);
    ist(rect.bottom, 2);
    ist(rect.left, 0);
    ist(rect.right, 3);

    // Should include all cells
    ist(cells.length, 5);
  });
});
