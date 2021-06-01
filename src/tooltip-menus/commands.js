import {deleteColumn, deleteRow, deleteTable, selectedRect} from '../commands';
import {CellSelection} from '../cellselection';

export function getDeleteCommand(state) {
  const {map, tableStart} = selectedRect(state);
  if (!(state.selection instanceof CellSelection)) return null;

  // check if all the table selected
  if (
    map.map[0] + tableStart === state.selection.$anchorCell.pos &&
    map.map[map.map.length - 1] + tableStart === state.selection.$headCell.pos
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

export const toggleTableHeaders = (state, dispatch) => {
  const rect = selectedRect(state);
  const {tr} = state;
  tr.setNodeMarkup(rect.tableStart - 1, rect.table.type, {
    headers: !rect.table.attrs.headers,
  });

  dispatch(tr);
};
