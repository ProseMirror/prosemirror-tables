import { EditorState } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { cellAround } from '../src/util';
import { c, c11, cCursor, table, tr, selectionFor } from './build';

describe('cellAround', () => {
    it('cursor is in text', () => {
    const doc = table(
      tr(cCursor, c11, c11),
    );
    const state = EditorState.create({ doc, selection: selectionFor(doc) });

    expect(cellAround(state.doc.resolve(state.selection.anchor))).not.toBeNull();
    expect(cellAround(state.doc.resolve(doc.content.size))).toBeNull();
  });
  // Test finding a cell in a regular cell
  it('finds a regular cell', () => {
    // Create a simple table with cursor in the middle cell
    const doc = table(
      tr(c11, c11, c11),
      tr(c11, cCursor, c11),
      tr(c11, c11, c11),
    );
    const state = EditorState.create({ doc, selection: selectionFor(doc) });
    const $pos = state.doc.resolve(state.selection.anchor);
    const $cell = cellAround($pos);

    // Verify that the cell was found
    expect($cell).not.toBeNull();
    // Verify that the found cell is the expected merged cell
    const cellNode = $cell!.nodeAfter;
    expect(cellNode!.attrs.colspan).toBe(1);
    expect(cellNode!.attrs.rowspan).toBe(1);
  });

  // Test finding a cell when cursor is inside a merged cell
  it('finds a merged cell when cursor is inside', () => {
    // Create a table with a merged cell, cursor inside the merged cell
    const doc = table(
      tr(c11, c(2, 2, 'x<cursor>'), c11),
      tr(c11, c11),
      tr(c11, c11, c11),
    );

    const state = EditorState.create({ doc, selection: selectionFor(doc) });
    const $pos = state.doc.resolve(state.selection.anchor);
    const $cell = cellAround($pos);

    // Verify that the cell was found
    expect($cell).not.toBeNull();
    // Verify that the found cell is a merged cell
    const cellNode = $cell!.nodeAfter;
    expect(cellNode!.attrs.colspan).toBe(2);
    expect(cellNode!.attrs.rowspan).toBe(2);
  });


});
