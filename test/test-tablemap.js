import ist from 'ist';

import { table, tr, c, c11 } from './build';
import { TableMap } from '../src/';

function eqRect(a, b) {
  return (
    a.left == b.left &&
    a.right == b.right &&
    a.top == b.top &&
    a.bottom == b.bottom
  );
}

describe('TableMap', () => {
  it('finds the right shape for a simple table', () => {
    ist(
      TableMap.get(
        table(
          tr(c11, c11, c11),
          tr(c11, c11, c11),
          tr(c11, c11, c11),
          tr(c11, c11, c11),
        ),
      ).map.join(', '),
      '1, 6, 11, 18, 23, 28, 35, 40, 45, 52, 57, 62',
    );
  });

  it('finds the right shape for colspans', () => {
    ist(
      TableMap.get(
        table(tr(c11, c(2, 1)), tr(c(2, 1), c11), tr(c11, c11, c11)),
      ).map.join(', '),
      '1, 6, 6, 13, 13, 18, 25, 30, 35',
    );
  });

  it('finds the right shape for rowspans', () => {
    ist(
      TableMap.get(table(tr(c(1, 2), c11, c(1, 2)), tr(c11))).map.join(', '),
      '1, 6, 11, 1, 18, 11',
    );
  });

  it('finds the right shape for deep rowspans', () => {
    ist(
      TableMap.get(
        table(tr(c(1, 4), c(2, 1)), tr(c(1, 2), c(1, 2)), tr()),
      ).map.join(', '),
      '1, 6, 6, 1, 13, 18, 1, 13, 18',
    );
  });

  it('finds the right shape for larger rectangles', () => {
    ist(
      TableMap.get(table(tr(c11, c(4, 4)), tr(c11), tr(c11), tr(c11))).map.join(
        ', ',
      ),
      '1, 6, 6, 6, 6, 13, 6, 6, 6, 6, 20, 6, 6, 6, 6, 27, 6, 6, 6, 6',
    );
  });

  let map = TableMap.get(
    table(tr(c(2, 3), c11, c(1, 2)), tr(c11), tr(c(2, 1))),
  );
  //  1  1  6 11
  //  1  1 18 11
  //  1  1 25 25

  it('can accurately find cell sizes', () => {
    ist(map.width, 4);
    ist(map.height, 3);
    ist(map.findCell(1), { left: 0, right: 2, top: 0, bottom: 3 }, eqRect);
    ist(map.findCell(6), { left: 2, right: 3, top: 0, bottom: 1 }, eqRect);
    ist(map.findCell(11), { left: 3, right: 4, top: 0, bottom: 2 }, eqRect);
    ist(map.findCell(18), { left: 2, right: 3, top: 1, bottom: 2 }, eqRect);
    ist(map.findCell(25), { left: 2, right: 4, top: 2, bottom: 3 }, eqRect);
  });

  it('can find the rectangle between two cells', () => {
    ist(map.cellsInRect(map.rectBetween(1, 6)).join(', '), '1, 6, 18, 25');
    ist(map.cellsInRect(map.rectBetween(1, 25)).join(', '), '1, 6, 11, 18, 25');
    ist(map.cellsInRect(map.rectBetween(1, 1)).join(', '), '1');
    ist(map.cellsInRect(map.rectBetween(6, 25)).join(', '), '6, 11, 18, 25');
    ist(map.cellsInRect(map.rectBetween(6, 11)).join(', '), '6, 11, 18');
    ist(map.cellsInRect(map.rectBetween(11, 6)).join(', '), '6, 11, 18');
    ist(map.cellsInRect(map.rectBetween(18, 25)).join(', '), '18, 25');
    ist(map.cellsInRect(map.rectBetween(6, 18)).join(', '), '6, 18');
  });

  it('can find adjacent cells', () => {
    ist(map.nextCell(1, 'horiz', 1), 6);
    ist(map.nextCell(1, 'horiz', -1), null);
    ist(map.nextCell(1, 'vert', 1), null);
    ist(map.nextCell(1, 'vert', -1), null);

    ist(map.nextCell(18, 'horiz', 1), 11);
    ist(map.nextCell(18, 'horiz', -1), 1);
    ist(map.nextCell(18, 'vert', 1), 25);
    ist(map.nextCell(18, 'vert', -1), 6);

    ist(map.nextCell(25, 'vert', 1), null);
    ist(map.nextCell(25, 'vert', -1), 18);
    ist(map.nextCell(25, 'horiz', 1), null);
    ist(map.nextCell(25, 'horiz', -1), 1);
  });
});
