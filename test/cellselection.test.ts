import ist from 'ist';
import { Node, Slice } from 'prosemirror-model';
import {
  Command,
  EditorState,
  NodeSelection,
  Selection,
} from 'prosemirror-state';
import { describe, it } from 'vitest';

import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  CellSelection,
  tableEditing,
} from '../src/';
import {
  c,
  c11,
  cAnchor,
  cEmpty,
  cHead,
  doc,
  eq,
  p,
  selectionFor,
  table,
  td,
  tr,
} from './build';

describe('CellSelection', () => {
  const t = doc(
    table(
      tr(/* 2*/ cEmpty, /* 6*/ cEmpty, /*10*/ cEmpty),
      tr(/*16*/ cEmpty, /*20*/ cEmpty, /*24*/ cEmpty),
      tr(/*30*/ cEmpty, /*34*/ cEmpty, /*36*/ cEmpty),
    ),
  );

  function run(anchor: number, head: number, command: Command): EditorState {
    let state = EditorState.create({
      doc: t,
      selection: CellSelection.create(t, anchor, head),
    });
    command(state, (tr) => (state = state.apply(tr)));
    return state;
  }

  it('will put its head/anchor around the head cell', () => {
    let s = CellSelection.create(t, 2, 24);
    ist(s.anchor, 25);
    ist(s.head, 27);
    s = CellSelection.create(t, 24, 2);
    ist(s.anchor, 3);
    ist(s.head, 5);
    s = CellSelection.create(t, 10, 30);
    ist(s.anchor, 31);
    ist(s.head, 33);
    s = CellSelection.create(t, 30, 10);
    ist(s.anchor, 11);
    ist(s.head, 13);
  });

  it('extends a row selection when adding a row', () => {
    let sel = run(34, 6, addRowBefore).selection as CellSelection;
    ist(sel.$anchorCell.pos, 48);
    ist(sel.$headCell.pos, 6);
    sel = run(6, 30, addRowAfter).selection as CellSelection;
    ist(sel.$anchorCell.pos, 6);
    ist(sel.$headCell.pos, 44);
  });

  it('extends a col selection when adding a column', () => {
    let sel = run(16, 24, addColumnAfter).selection as CellSelection;
    ist(sel.$anchorCell.pos, 20);
    ist(sel.$headCell.pos, 32);
    sel = run(24, 30, addColumnBefore).selection as CellSelection;
    ist(sel.$anchorCell.pos, 32);
    ist(sel.$headCell.pos, 38);
  });
});

describe('CellSelection.content', () => {
  function slice(doc: Node) {
    return new Slice(doc.content, 1, 1);
  }

  it('contains only the selected cells', () =>
    ist(
      selectionFor(
        table(
          tr(c11, cAnchor, cEmpty),
          tr(c11, cEmpty, cHead),
          tr(c11, c11, c11),
        ),
      ).content(),
      slice(table('<a>', tr(c11, cEmpty), tr(cEmpty, c11))),
      eq,
    ));

  it('understands spanning cells', () =>
    ist(
      selectionFor(
        table(tr(cAnchor, c(2, 2), c11, c11), tr(c11, cHead, c11, c11)),
      ).content(),
      slice(table(tr(c11, c(2, 2), c11), tr(c11, c11))),
      eq,
    ));

  it('cuts off cells sticking out horizontally', () =>
    ist(
      selectionFor(
        table(tr(c11, cAnchor, c(2, 1)), tr(c(4, 1)), tr(c(2, 1), cHead, c11)),
      ).content(),
      slice(table(tr(c11, c11), tr(td({ colspan: 2 }, p())), tr(cEmpty, c11))),
      eq,
    ));

  it('cuts off cells sticking out vertically', () =>
    ist(
      selectionFor(
        table(
          tr(c11, c(1, 4), c(1, 2)),
          tr(cAnchor),
          tr(c(1, 2), cHead),
          tr(c11),
        ),
      ).content(),
      slice(table(tr(c11, td({ rowspan: 2 }, p()), cEmpty), tr(c11, c11))),
      eq,
    ));

  it('preserves column widths', () =>
    ist(
      selectionFor(
        table(
          tr(c11, cAnchor, c11),
          tr(td({ colspan: 3, colwidth: [100, 200, 300] }, p('x'))),
          tr(c11, cHead, c11),
        ),
      ).content(),
      slice(table(tr(c11), tr(td({ colwidth: [200] }, p())), tr(c11))),
      eq,
    ));
});

describe('normalizeSelection', () => {
  const t = doc(
    table(
      tr(/* 2*/ c11, /* 7*/ c11, /*12*/ c11),
      tr(/*19*/ c11, /*24*/ c11, /*29*/ c11),
      tr(/*36*/ c11, /*41*/ c11, /*46*/ c11),
    ),
  );

  function normalize(
    selection: Selection,
    { allowTableNodeSelection = false } = {},
  ) {
    const state = EditorState.create({
      doc: t,
      selection,
      plugins: [tableEditing({ allowTableNodeSelection })],
    });
    return state.apply(state.tr).selection;
  }

  it('converts a table node selection into a selection of all cells in the table', () => {
    ist(
      normalize(NodeSelection.create(t, 0)),
      CellSelection.create(t, 2, 46),
      eq,
    );
  });

  it('retains a table node selection if the allowTableNodeSelection option is true', () => {
    ist(
      normalize(NodeSelection.create(t, 0), { allowTableNodeSelection: true }),
      NodeSelection.create(t, 0),
      eq,
    );
  });

  it('converts a row node selection into a cell selection', () => {
    ist(
      normalize(NodeSelection.create(t, 1)),
      CellSelection.create(t, 2, 12),
      eq,
    );
  });

  it('converts a cell node selection into a cell selection', () => {
    ist(
      normalize(NodeSelection.create(t, 2)),
      CellSelection.create(t, 2, 2),
      eq,
    );
  });
});
