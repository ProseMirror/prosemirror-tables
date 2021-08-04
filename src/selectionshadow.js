import {PluginKey, Plugin} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';
import {CellSelection} from './cellselection';
import {selectedRect} from './commands';
import {getColIndex, getRowIndex} from './util';

export const selectionShadowPlugin = () => {
  return new Plugin({
    key: new PluginKey('selectionShadowPlugin'),
    state: {
      init() {
        return null;
      },
      apply(tr, value, oldState, newState) {
        if (!(tr.selection instanceof CellSelection)) return null;

        if (!tr.selectionSet) return value.map(tr.mapping, tr.doc);

        const {
          $anchorCell: {pos: from},
          $headCell: {pos: to},
        } = tr.selection;

        let anchorCol = getColIndex(newState, Math.min(from, to));
        let headCol = getColIndex(newState, Math.max(from, to));

        // sometimes prosemirror replaces head and anchor cells
        if (anchorCol > headCol) {
          const temp = anchorCol;
          anchorCol = headCol;
          headCol = temp;
        }

        const anchorRow = getRowIndex(newState, Math.min(from, to));
        const headRow = getRowIndex(newState, Math.max(from, to));

        const {map, tableStart} = selectedRect(newState);

        const decorations = [];

        // cols decorations
        for (let i = anchorCol; i < headCol + 1; i++) {
          decorations.push(
            Decoration.node(
              map.map[i] + tableStart,
              map.map[i + 1] + tableStart - (i + 1 === map.width ? 2 : 0),
              {class: 'selection-shadow-col'}
            )
          );
        }

        // rows decorations
        for (let i = anchorRow; i < headRow + 1; i++) {
          decorations.push(
            Decoration.node(
              map.map[i * map.width] + tableStart,
              map.map[i * map.width + 1] + tableStart,
              {class: 'selection-shadow-row'}
            )
          );
        }
        return DecorationSet.create(newState.doc, decorations);
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
};
