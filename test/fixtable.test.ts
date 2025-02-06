import ist from 'ist';
import { EditorState } from 'prosemirror-state';
import { describe, it } from 'vitest';

import {
  c,
  c11,
  cEmpty,
  doc,
  eq,
  h11,
  hEmpty,
  p,
  table,
  td,
  tr,
} from './build';

import { Node } from 'prosemirror-model';
import { fixTables } from '../src/';

const cw100 = td({ colwidth: [100] }, p('x'));
const cw200 = td({ colwidth: [200] }, p('x'));

function fix(node: Node) {
  const isDoc = node.type === node.type.schema.topNodeType;
  const state = EditorState.create({ doc: isDoc ? node : doc(node) });
  const tr = fixTables(state);
  return tr && (isDoc ? tr.doc : tr.doc.firstChild)!;
}

describe('fixTable', () => {
  it("doesn't touch correct tables", () => {
    ist(fix(table(tr(c11, c11, c(1, 2)), tr(c11, c11))), null);
  });

  it('adds trivially missing cells', () => {
    ist(
      fix(table(tr(c11, c11, c(1, 2)), tr(c11))),
      table(tr(c11, c11, c(1, 2)), tr(c11, cEmpty)),
      eq,
    );
  });

  it('can add to multiple rows', () => {
    ist(
      fix(table(tr(c11), tr(c11, c11), tr(c(3, 1)))),
      table(tr(c11, cEmpty, cEmpty), tr(cEmpty, c11, c11), tr(c(3, 1))),
      eq,
    );
  });

  it('will default to adding at the start of the first row', () => {
    ist(
      fix(table(tr(c11), tr(c11, c11))),
      table(tr(cEmpty, c11), tr(c11, c11)),
      eq,
    );
  });

  it('will default to adding at the end of the non-first row', () => {
    ist(
      fix(table(tr(c11, c11), tr(c11))),
      table(tr(c11, c11), tr(c11, cEmpty)),
      eq,
    );
  });

  it('will fix overlapping cells', () => {
    ist(
      fix(table(tr(c11, c(1, 2), c11), tr(c(2, 1)))),
      table(tr(c11, c(1, 2), c11), tr(c11, cEmpty, cEmpty)),
      eq,
    );
  });

  it('will fix a rowspan that sticks out of the table', () => {
    ist(
      fix(table(tr(c11, c11), tr(c(1, 2), c11))),
      table(tr(c11, c11), tr(c11, c11)),
      eq,
    );
  });

  it('makes sure column widths are coherent', () => {
    ist(
      fix(table(tr(c11, c11, cw200), tr(cw100, c11, c11))),
      table(tr(cw100, c11, cw200), tr(cw100, c11, cw200)),
      eq,
    );
  });

  it('can update column widths on colspan cells', () => {
    ist(
      fix(table(tr(c11, c11, cw200), tr(c(3, 2)), tr())),
      table(
        tr(c11, c11, cw200),
        tr(td({ colspan: 3, rowspan: 2, colwidth: [0, 0, 200] }, p('x'))),
        tr(),
      ),
      eq,
    );
  });

  it('will update the odd one out when column widths disagree', () => {
    ist(
      fix(
        table(
          tr(cw100, cw100, cw100),
          tr(cw200, cw200, cw100),
          tr(cw100, cw200, cw200),
        ),
      ),
      table(
        tr(cw100, cw200, cw100),
        tr(cw100, cw200, cw100),
        tr(cw100, cw200, cw100),
      ),
      eq,
    );
  });

  it('respects table role when inserting a cell', () => {
    ist(
      fix(table(tr(h11), tr(c11, c11), tr(c(3, 1)))),
      table(tr(h11, hEmpty, hEmpty), tr(cEmpty, c11, c11), tr(c(3, 1))),
      eq,
    );
  });

  it('will remove zero-sized table', () => {
    ist(fix(doc(table(tr()), table(tr(c11)))), doc(table(tr(c11))), eq);
  });
});
