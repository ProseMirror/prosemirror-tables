import {columnTypesMap} from './types.config';
import {TableMap} from '../tablemap';

export const typeInheritance = (view, node, pos) => {
  if (!view || !node) return;
  // we don't allow cells merging, so we fill comfortable to check only the first row
  const tableMap = TableMap.get(node);
  const {tr} = view.state;
  for (let col = tableMap.width - 1; col >= 0; col--) {
    const header = node.child(0).child(col);
    const colType = header.attrs.type;

    for (let row = tableMap.height - 1; row >= 0; row--) {
      const cell = node.child(row).child(col);
      if (cell.attrs.type !== colType) {
        const cellPos = tableMap.map[row * tableMap.width + col] + pos + 1;
        const typeHandler = columnTypesMap[colType].handler;

        tr.replaceRangeWith(
          cellPos + 1,
          cellPos + cell.nodeSize - 1,
          typeHandler.renderContentNode(
            view.state.schema,
            typeHandler.convertContent(cell),
            tr,
            cellPos
          )
        );

        const newAttrs = Object.assign(cell.attrs, {
          type: colType,
        });

        tr.setNodeMarkup(cellPos, undefined, newAttrs);
      }
    }
  }

  if (tr.steps.length) view.dispatch(tr);
};
