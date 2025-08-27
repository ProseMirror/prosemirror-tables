import type { Node } from 'prosemirror-model';
import { describe, expect, it } from 'vitest';

import { p, table, td, tr } from './build';

import { convertTableNodeToArrayOfRows } from '../src/utils/convert';

describe('convertTableNodeToArrayOfRows', () => {
  const convert = (tableNode: Node): (string | null)[][] => {
    const rows = convertTableNodeToArrayOfRows(tableNode);
    return rows.map((row) => row.map((cell) => cell?.textContent ?? null));
  };

  it('should convert a simple table to array of rows', () => {
    const tableNode = table(tr(td('A1'), td('B1')), tr(td('A2'), td('B2')));

    expect(convert(tableNode)).toEqual([
      ['A1', 'B1'],
      ['A2', 'B2'],
    ]);
  });

  it('should handle empty cells', () => {
    const tableNode = table(tr(td('A1'), td()), tr(td(), td('B2')));

    expect(convert(tableNode)).toEqual([
      ['A1', ''],
      ['', 'B2'],
    ]);
  });

  it('should handle tables with equal row lengths', () => {
    const tableNode = table(
      tr(td('A1'), td('B1'), td('C1')),
      tr(td('A2'), td('B2'), td('C2')),
    );

    expect(convert(tableNode)).toEqual([
      ['A1', 'B1', 'C1'],
      ['A2', 'B2', 'C2'],
    ]);
  });

  it('should handle single row table', () => {
    const tableNode = table(tr(td('Single'), td('Row')));

    expect(convert(tableNode)).toEqual([['Single', 'Row']]);
  });

  it('should handle single column table', () => {
    const tableNode = table(tr(td('A1')), tr(td('A2')), tr(td('A3')));

    expect(convert(tableNode)).toEqual([['A1'], ['A2'], ['A3']]);
  });

  it('should handle table with merged cells', () => {
    // ┌──────┬──────┬─────────────┐
    // │  A1  │  B1  │     C1      │
    // ├──────┼──────┴──────┬──────┤
    // │  A2  │     B2      │      │
    // ├──────┼─────────────┤  D1  │
    // │  A3  │  B3  │  C3  │      │
    // └──────┴──────┴──────┴──────┘
    const tableNode = table(
      tr(td('A1'), td('B1'), td({ colspan: 2 }, p('C1'))),
      tr(td('A2'), td({ colspan: 2 }, p('B2')), td({ rowspan: 2 }, p('D1'))),
      tr(td('A3'), td('B3'), td('C3')),
    );

    expect(convert(tableNode)).toEqual([
      ['A1', 'B1', 'C1', null],
      ['A2', 'B2', null, 'D1'],
      ['A3', 'B3', 'C3', null],
    ]);
  });
});
