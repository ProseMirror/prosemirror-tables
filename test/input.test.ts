import { Command, EditorState } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';

import { EditorView } from 'prosemirror-view';
import { arrow } from '../src/input';
import {
  TaggedNode,
  c11,
  cCursor,
  cCursorBefore,
  selectionFor,
  table,
  tr,
} from './build';

function test(
  doc: TaggedNode,
  command: Command,
  result: TaggedNode | null | undefined,
) {
  let state = EditorState.create({ doc, selection: selectionFor(doc) });
  const view = new EditorView(document.createElement('div'), { state });
  const ran = command(state, (tr) => (state = state.apply(tr)), view);
  if (result == null) {
    expect(ran).toBe(false);
  } else {
    const expected = {
      doc: result.toJSON(),
      selection: selectionFor(result).toJSON(),
    };
    const actual = state.toJSON();
    expect(actual).toEqual(expected);
  }
}

describe('arrow', () => {
  it('can move cursor to the right cell', () =>
    test(
      table(tr(c11, c11, c11), tr(c11, cCursor, c11), tr(c11, c11, c11)),
      arrow('horiz', 1),
      table(tr(c11, c11, c11), tr(c11, c11, cCursorBefore), tr(c11, c11, c11)),
    ));

  it('can move cursor to the left cell', () =>
    test(
      table(tr(c11, c11, c11), tr(c11, c11, cCursorBefore), tr(c11, c11, c11)),
      arrow('horiz', -1),
      table(tr(c11, c11, c11), tr(c11, cCursor, c11), tr(c11, c11, c11)),
    ));

  it('can move cursor to the bottom cell', () =>
    test(
      table(tr(c11, c11, c11), tr(c11, cCursorBefore, c11), tr(c11, c11, c11)),
      arrow('vert', 1),
      table(tr(c11, c11, c11), tr(c11, c11, c11), tr(c11, cCursorBefore, c11)),
    ));

  it('can move cursor to the top cell', () =>
    test(
      table(tr(c11, c11, c11), tr(c11, c11, c11), tr(c11, cCursorBefore, c11)),
      arrow('vert', -1),
      table(tr(c11, c11, c11), tr(c11, cCursorBefore, c11), tr(c11, c11, c11)),
    ));
});
