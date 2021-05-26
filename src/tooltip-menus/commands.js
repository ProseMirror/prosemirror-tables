import { deleteColumn, deleteRow, deleteTable } from "../commands";

export const getDeleteCommand = (state) => {
  const { map, tableStart } = selectedRect(state);
  if (!(state.selection instanceof CellSelection)) return;

  // check if all the table selected
  if (
    map.map[0] + tableStart === state.selection.$anchorCell.pos &&
    map.map[map.map.length - 1] + tableStart === state.selection.$headCell.pos
  ) {
      return deleteTable;
  }

  if(state.selection.isRowSelection()) return deleteRow
  if(state.selection.isColSelection()) return deleteColumn

}