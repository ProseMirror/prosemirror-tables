import ist from 'ist';
import { EditorState } from 'prosemirror-state';
import { DecorationSet } from 'prosemirror-view';
import { handleDecorations } from '../src/columnresizing';
import { table, doc, tr, cEmpty } from './build';
import { describe, it } from 'vitest';

describe('handleDecorations', () => {
  it('returns an empty DecorationSet if cell is null or undefined', () => {
    const state = EditorState.create({
      doc: doc(table(tr(/* 2*/ cEmpty, /* 6*/ cEmpty, /*10*/ cEmpty))),
    });
    // @ts-expect-error: null is not a valid number
    ist(handleDecorations(state, null), DecorationSet.empty);
  });
});
