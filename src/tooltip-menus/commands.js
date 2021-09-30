import { types } from '../columnsTypes/types.config';
import {deleteColumn, deleteRow, deleteTable, selectedRect} from '../commands';
import {CellSelection} from '../cellselection';

export function getDeleteCommand(state) {
  const {map, tableStart} = selectedRect(state);
  if (!(state.selection instanceof CellSelection)) return null;

  let selStart, selEnd;

  if (state.selection.$anchorCell.pos > state.selection.$headCell.pos) {
    selStart = state.selection.$headCell.pos;
    selEnd = state.selection.$anchorCell.pos;
  } else {
    selEnd = state.selection.$headCell.pos;
    selStart = state.selection.$anchorCell.pos;
  }

  // check if all the table selected
  if (
    map.map[0] + tableStart === selStart &&
    map.map[map.map.length - 1] + tableStart === selEnd
  ) {
    return deleteTable;
  }

  if (state.selection.isRowSelection()) return deleteRow;
  if (state.selection.isColSelection()) return deleteColumn;

  return null;
}

export const changeCellsBackgroundColor = (state, dispatch, color) => {
  if (!(state.selection instanceof CellSelection)) return;

  const {tr} = state;
  state.selection.forEachCell((cell, pos) => {
    tr.setNodeMarkup(
      pos,
      undefined,
      Object.assign({}, cell.attrs, {background: color})
    );
  });
  dispatch(tr);
};

export const toggleTableHeaders = (state, dispatch, view) => {
  const {map, tableStart, table} = selectedRect(state);
  const {tr} = state;
  tr.setNodeMarkup(tableStart - 1, table.type, {
    headers: !table.attrs.headers,
  });
 
  if(table.attrs.headers) {
    const cellsSelection = CellSelection.create(tr.doc, tableStart + map.map[0], tableStart + map.map[map.map.length - 1])
    const textType = types.find(type => type.id === 'text').handler;

    cellsSelection.forEachCell((cell, pos) => {
      console.log(cell);
      tr.replaceRangeWith(
        pos + 1,
        pos + cell.nodeSize - 1,
        textType.renderContentNode(
          view.state.schema,
          textType.convertContent(cell),
          tr,
          pos
        )
      );

      const newAttrs = Object.assign(cell.attrs, {
        type: 'text',
      });

      tr.setNodeMarkup(pos, undefined, newAttrs);
    })
  }
  
  dispatch(tr);
};
