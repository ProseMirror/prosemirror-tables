import { TableMap, toggleHeader, TableRect, tableEditing } from '../../';
import { Node as ProsemirrorNode } from 'prosemirror-model';

const tableEditing1 = tableEditing();
const tableWithNodeSelection = tableEditing({ allowTableNodeSelection: true });

const map = new TableMap();
const table = new ProsemirrorNode();

toggleHeader('column');
toggleHeader('row');
toggleHeader('row', { useDeprecatedLogic: false });
toggleHeader('row', { useDeprecatedLogic: true });

const tableRect: TableRect = {
  left: 10,
  top: 20,
  right: 30,
  bottom: 40,
  tableStart: 20,
  map,
  table,
};
