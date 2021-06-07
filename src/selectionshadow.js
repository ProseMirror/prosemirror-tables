import {PluginKey, Plugin} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';
import {CellSelection} from './cellselection';
import {selectedRect} from './commands';
import {getColIndex, getRowIndex} from './util';

export const selectionShadowPlugin = () => {
  console.log('here');
  return new Plugin({
    key: new PluginKey('selectionShadowPlugin'),
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, value, oldState, newState) {
        if (!(tr.selection instanceof CellSelection))
          return DecorationSet.empty;

        if (!tr.selectionSet) return value;

        const {
          $anchorCell: {pos: from},
          $headCell: {pos: to},
        } = tr.selection;

        // sometimes prosemirror replaces head and anchor cells
        let reverse = false;
        if (from > to) reverse = true;

        const anchorCol = getColIndex(newState, !reverse ? from : to);
        const headCol = getColIndex(newState, !reverse ? to : from);
        const anchorRow = getRowIndex(newState, !reverse ? from : to);
        const headRow = getRowIndex(newState, !reverse ? to : from);

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
        console.log(decorations);
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
