import {columnTypesMap} from '../columnsTypes/types.config';
import {selectedRect} from '../commands';
import {CellSelection} from '../cellselection';

export const changeCellsBackgroundColor = (state, dispatch, color) => {
  if (!(state.selection instanceof CellSelection)) return;

  const {tr} = state;
  state.selection.forEachCell((cell, pos, parent) => {
    if(parent.attrs.hidden) return;
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

  if (table.attrs.headers) {
    const cellsSelection = CellSelection.create(
      tr.doc,
      tableStart + map.map[0],
      tableStart + map.map[map.map.length - 1]
    );
    const textType = columnTypesMap.text.handler;
    const reversedCells = [];
    cellsSelection.forEachCell((cell, pos) =>
      reversedCells.unshift({cell, pos})
    );

    reversedCells.forEach(({cell, pos}) => {
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
    });
  }

  dispatch(tr);
};
