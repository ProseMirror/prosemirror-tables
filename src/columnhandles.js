import {Plugin, PluginKey} from "prosemirror-state"
import {Decoration, DecorationSet} from "prosemirror-view"
import {selectionCell} from "./util"
import {addBottomRow, addRightColumn} from "./commands"


export const key = new PluginKey("tableColumnHandles")

export function columnHandles({} = {}) {
  let plugin = new Plugin({
    key,
    props: {
        handleClick(view, pos, node, nodePos, event, direct) {
            if (node.target.classList.contains('tableAddBottomRow')) {
              addBottomRow(view.state, view.dispatch)
            }
            if (node.target.classList.contains('tableAddRightColumn')) {
              addRightColumn(view.state, view.dispatch)
            }
        },
        decorations(state) {
          const $pos = selectionCell(state)
          if (!$pos) {
            // In case there's no cell
            return DecorationSet.empty
          }
          const tableNode = $pos.node(-1)
          const tableStart = $pos.start(-1) - 1;
          const decoration = Decoration.node(tableStart, tableStart + tableNode.nodeSize, {class: 'tableFocus'});
          return DecorationSet.create(state.doc, [decoration]);
        }
    }
  })
  return plugin
}
