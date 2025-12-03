import { Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import type { TableRect } from '../../src';
import { CellSelection, tableEditing, TableMap, toggleHeader } from '../../src';

export const tableEditing1 = tableEditing();
export const tableWithNodeSelection = tableEditing({
  allowTableNodeSelection: true,
});

const map = new TableMap(0, 0, [], null);
const table = new ProsemirrorNode();

toggleHeader('column');
toggleHeader('row');
toggleHeader('row', { useDeprecatedLogic: false });
toggleHeader('row', { useDeprecatedLogic: true });

export const tableRect: TableRect = {
  left: 10,
  top: 20,
  right: 30,
  bottom: 40,
  tableStart: 20,
  map,
  table,
};

EditorState.create({
  doc: table,
  selection: CellSelection.create(table, 0),
});
