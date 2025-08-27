import type { Node } from 'prosemirror-model';
import { describe, expect, it } from 'vitest';

import {
  convertArrayOfRowsToTableNode,
  convertTableNodeToArrayOfRows,
} from '../src/utils/convert';
import { c, p, table, td, tr } from './build';

describe('convertArrayOfRowsToTableNode', () => {
  const expectTableEquals = (a: Node, b: Node) => {
    // a and b are not the same node
    expect(a !== b).toBe(true);

    // a and b have the same data
    expect(a.eq(b)).toBe(true);
  };

  it('should convert array of rows back to table node (roundtrip)', () => {
    const originalTable = table(
      tr(c(1, 1, 'A1'), c(1, 1, 'B1')),
      tr(c(1, 1, 'A2'), c(1, 1, 'B2')),
    );

    const arrayOfRows = convertTableNodeToArrayOfRows(originalTable);
    const newTable = convertArrayOfRowsToTableNode(originalTable, arrayOfRows);

    expectTableEquals(originalTable, newTable);
  });

  it('should handle modified cell content', () => {
    const originalTable = table(
      tr(c(1, 1, 'A1'), c(1, 1, 'B1')),
      tr(c(1, 1, 'A2'), c(1, 1, 'B2')),
    );

    const arrayOfRows = convertTableNodeToArrayOfRows(originalTable);
    // Modify the content of one cell
    arrayOfRows[0][1] = td(p('Modified'));

    const newTable = convertArrayOfRowsToTableNode(originalTable, arrayOfRows);

    const expectedTable = table(
      tr(c(1, 1, 'A1'), c(1, 1, 'Modified')),
      tr(c(1, 1, 'A2'), c(1, 1, 'B2')),
    );

    expectTableEquals(expectedTable, newTable);
  });

  it('should handle empty cells in array', () => {
    const originalTable = table(
      tr(c(1, 1, 'A1'), c(1, 1, 'B1')),
      tr(c(1, 1, 'A2'), c(1, 1, 'B2')),
    );

    const arrayOfRows = convertTableNodeToArrayOfRows(originalTable);
    // Replace one cell with an empty cell
    arrayOfRows[1][0] = td(p());

    const newTable = convertArrayOfRowsToTableNode(originalTable, arrayOfRows);

    const expectedTable = table(
      tr(c(1, 1, 'A1'), c(1, 1, 'B1')),
      tr(c(1, 1, ''), c(1, 1, 'B2')),
    );

    expectTableEquals(expectedTable, newTable);
  });

  it('should handle multiple cell modifications', () => {
    const originalTable = table(
      tr(c(1, 1, 'A1'), c(1, 1, 'B1'), c(1, 1, 'C1')),
      tr(c(1, 1, 'A2'), c(1, 1, 'B2'), c(1, 1, 'C2')),
      tr(c(1, 1, 'A3'), c(1, 1, 'B3'), c(1, 1, 'C3')),
    );

    const arrayOfRows = convertTableNodeToArrayOfRows(originalTable);
    // Modify multiple cells
    arrayOfRows[0][0] = td(p('New A1'));
    arrayOfRows[1][1] = td(p('New B2'));
    arrayOfRows[2][2] = td(p('New C3'));

    const newTable = convertArrayOfRowsToTableNode(originalTable, arrayOfRows);

    const expectedTable = table(
      tr(c(1, 1, 'New A1'), c(1, 1, 'B1'), c(1, 1, 'C1')),
      tr(c(1, 1, 'A2'), c(1, 1, 'New B2'), c(1, 1, 'C2')),
      tr(c(1, 1, 'A3'), c(1, 1, 'B3'), c(1, 1, 'New C3')),
    );

    expectTableEquals(expectedTable, newTable);
  });

  it('should handle tables with merged cells', () => {
    const originalTable = table(
      tr(c(1, 1, 'A1'), c(1, 1, 'B1'), c(2, 1, 'C1')),
      tr(c(1, 1, 'A2'), c(2, 1, 'B2'), c(1, 2, 'D1')),
      tr(c(1, 1, 'A3'), c(1, 1, 'B3'), c(1, 1, 'C3')),
    );

    const arrayOfRows = convertTableNodeToArrayOfRows(originalTable);
    const newTable = convertArrayOfRowsToTableNode(originalTable, arrayOfRows);

    expectTableEquals(originalTable, newTable);
  });

  it('should handle modified cells in merged table', () => {
    const originalTable = table(
      tr(c(1, 1, 'A1'), c(1, 1, 'B1'), c(2, 1, 'C1')),
      tr(c(1, 1, 'A2'), c(2, 1, 'B2'), c(1, 2, 'D1')),
      tr(c(1, 1, 'A3'), c(1, 1, 'B3'), c(1, 1, 'C3')),
    );

    const arrayOfRows = convertTableNodeToArrayOfRows(originalTable);
    // Modify a cell in the merged table
    arrayOfRows[0][2] = td(
      { colspan: 2, rowspan: 1, colwidth: null },
      p('Modified C1'),
    );

    const newTable = convertArrayOfRowsToTableNode(originalTable, arrayOfRows);

    const expectedTable = table(
      tr(c(1, 1, 'A1'), c(1, 1, 'B1'), c(2, 1, 'Modified C1')),
      tr(c(1, 1, 'A2'), c(2, 1, 'B2'), c(1, 2, 'D1')),
      tr(c(1, 1, 'A3'), c(1, 1, 'B3'), c(1, 1, 'C3')),
    );

    expectTableEquals(expectedTable, newTable);
  });

  it('should handle single row table conversion', () => {
    const originalTable = table(
      tr(c(1, 1, 'Single'), c(1, 1, 'Row'), c(1, 1, 'Table')),
    );

    const arrayOfRows = convertTableNodeToArrayOfRows(originalTable);
    // Modify middle cell
    arrayOfRows[0][1] = td(p('Modified'));

    const newTable = convertArrayOfRowsToTableNode(originalTable, arrayOfRows);

    const expectedTable = table(
      tr(c(1, 1, 'Single'), c(1, 1, 'Modified'), c(1, 1, 'Table')),
    );

    expectTableEquals(expectedTable, newTable);
  });

  it('should handle single column table conversion', () => {
    const originalTable = table(
      tr(c(1, 1, 'A1')),
      tr(c(1, 1, 'A2')),
      tr(c(1, 1, 'A3')),
    );

    const arrayOfRows = convertTableNodeToArrayOfRows(originalTable);
    // Modify middle cell
    arrayOfRows[1][0] = td(p('Modified A2'));

    const newTable = convertArrayOfRowsToTableNode(originalTable, arrayOfRows);

    const expectedTable = table(
      tr(c(1, 1, 'A1')),
      tr(c(1, 1, 'Modified A2')),
      tr(c(1, 1, 'A3')),
    );

    expectTableEquals(expectedTable, newTable);
  });

  it('should preserve cell attributes when modifying content', () => {
    const originalTable = table(
      tr(c(1, 1, 'A1'), c(2, 1, 'B1')),
      tr(c(1, 2, 'A2'), c(1, 1, 'B2'), c(1, 1, 'C2')),
      tr(c(1, 1, 'B3'), c(1, 1, 'C3')),
    );

    const arrayOfRows = convertTableNodeToArrayOfRows(originalTable);
    // Modify content while preserving attributes
    arrayOfRows[0][1] = td(
      { colspan: 2, rowspan: 1, colwidth: null },
      p('Modified B1'),
    );
    arrayOfRows[1][0] = td(
      { colspan: 1, rowspan: 2, colwidth: null },
      p('Modified A2'),
    );

    const newTable = convertArrayOfRowsToTableNode(originalTable, arrayOfRows);

    const expectedTable = table(
      tr(c(1, 1, 'A1'), c(2, 1, 'Modified B1')),
      tr(c(1, 2, 'Modified A2'), c(1, 1, 'B2'), c(1, 1, 'C2')),
      tr(c(1, 1, 'B3'), c(1, 1, 'C3')),
    );

    expectTableEquals(expectedTable, newTable);
  });
});
