import {Plugin, PluginKey} from 'prosemirror-state';
import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';
import {types} from './types.config';

const typesEnforcerKey = new PluginKey('typesEnforcer');

export const typesEnforcer = () => {
  return new Plugin({
    key: typesEnforcerKey,
    appendTransaction(transactions, oldState, newState) {
      const selectionChanged = transactions.reduce(
        (changed, tr) => changed || tr.selectionSet,
        false
      );

      // if the selection has not changed - return
      if (!selectionChanged) return null;

      const {schema} = newState;

      const oldParentCell = findParentNodeOfTypeClosestToPos(
        oldState.doc.resolve(oldState.selection.from),
        schema.nodes.table_cell
      );

      // if prev selection wasn't inside cell - return
      if (!oldParentCell) return null;

      const from = oldParentCell.pos;
      const to = oldParentCell.pos + oldParentCell.node.nodeSize;

      const newSel = newState.selection;

      if (
        (newSel.from < from || newSel.from > to) &&
        !oldParentCell.node.attrs.header
      ) {
        const type = types.find(
          (type) => type.id === oldParentCell.node.attrs.type
        );
        if (type.dontForce) return null;

        const typeHandler = type.handler;

        const {tr} = newState;

        const typeContent = typeHandler.convertContent(oldParentCell.node);

        tr.replaceRangeWith(
          from + 1,
          to - 1,
          typeHandler.renderContentNode(schema, typeContent)
        );

        return tr;
      }

      return null;
    },
  });
};
