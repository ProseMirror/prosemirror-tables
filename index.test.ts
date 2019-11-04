import {TableMap, TableRect} from 'prosemirror-tables';
import {Node as ProsemirrorNode} from 'prosemirror-model';

const map = new TableMap();
const table = new ProsemirrorNode();
const tableRect: TableRect = {
  left: 10,
  top: 20,
  right: 30,
  bottom: 40,
  tableStart: 20,
  map,
  table,
};
