import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Slice } from 'prosemirror-model';
import { tableNodeTypes } from './schema';
import { EditorState, TextSelection, Transaction } from 'prosemirror-state';

import { Decoration, DecorationSet } from 'prosemirror-view';
import { getAllCell } from './util';

import { CellSelection } from './cellselection';

interface StateAttr {
  isCellSelectionNow: boolean;
}

/**
 * @public
 */
const supportSafariIMEPluginKey = new PluginKey<StateAttr>('supportSafariIME');

const isSafari: boolean = /^((?!chrome|android).)*safari/i.test(
  navigator.userAgent,
);

let editorView: EditorView;
const isStopFromKey = (event: KeyboardEvent) => {
  return (
    event.key !== 'Backspace' &&
    !event.metaKey &&
    !event.ctrlKey &&
    event.key.indexOf('Arrow') !== 0
  );
};
const keydownEvent = (event: KeyboardEvent) => {
  if (
    editorView?.editable &&
    supportSafariIMEPluginKey.getState?.(editorView.state)
      ?.isCellSelectionNow &&
    isStopFromKey(event)
  ) {
    event.preventDefault();
  }
};
function deleteCellSelection(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
) {
  const sel = state.selection;
  if (!(sel instanceof CellSelection)) return false;
  if (dispatch) {
    const tr = state.tr;
    const baseContent = tableNodeTypes(state.schema).cell.createAndFill()!
      .content;
    let lastCellPos = 0;
    sel.forEachCell((cell, pos) => {
      lastCellPos = lastCellPos || pos;
      if (!cell.content.eq(baseContent))
        tr.replace(
          tr.mapping.map(pos + 1),
          tr.mapping.map(pos + cell.nodeSize - 1),
          new Slice(baseContent, 0, 0),
        );
    });
    // Map the old positions of the nodes to the new positions.
    const mappedPos = tr.mapping.map(lastCellPos);

    // Get new document
    const doc = tr.doc;
    const resolvedPos = doc.resolve(mappedPos);

    // Position of the modified node.
    const posAfter = resolvedPos.pos;

    // Set the cursor focus to the first selected cell.
    // To locate the textNode add 2, posAfter is the position of the tableCell.
    tr.setSelection(TextSelection.create(doc, posAfter + 2));

    dispatch(tr);
  }
  return true;
}

/**
 * @public
 */
export function supportSafariIME(): Plugin {
  const plugin = new Plugin({
    key: supportSafariIMEPluginKey,
    view: (view: EditorView) => {
      editorView = view;
      return {};
    },
    state: {
      init() {
        return {
          isCellSelectionNow: false,
        };
      },
      apply(tr, value, oldState, newState) {
        const isCellSelectionBefore =
          oldState.selection instanceof CellSelection;
        const isCellSelectionNow = newState.selection instanceof CellSelection;
        // When selecting a cell, register keyboard blocking events, and unbind when canceled.
        if (!isCellSelectionBefore && isCellSelectionNow) {
          document.addEventListener('keydown', keydownEvent, true);
        } else if (!isCellSelectionNow && isCellSelectionBefore) {
          document.removeEventListener('keydown', keydownEvent, true);
        }
        return {
          isCellSelectionNow,
        };
      },
    },
    props: {
      decorations: (state) => {
        const decorations: Decoration[] = [];
        const { doc, selection } = state;
        const isCellSelectionNow = state.selection instanceof CellSelection;

        if (editorView?.editable && isCellSelectionNow) {
          const tableNode = state.selection.$anchor.node(1);
          if (tableNode?.type?.name !== 'table') {
            return DecorationSet.empty;
          }
          const tableNodePos = state.selection.$anchor.posAtIndex(0, 1) - 1;
          decorations.push(
            Decoration.node(tableNodePos, tableNodePos + tableNode.nodeSize, {
              contenteditable: String(
                editorView?.editable && !isCellSelectionNow,
              ),
            }),
          );
        }

        if (isSafari) {
          const allCellsArr = getAllCell(selection);
          if (allCellsArr) {
            // In order to solve the issue of safari removing the <p> tags and then re-adding them when inputting in empty cells in tables with IME on Safari.
            allCellsArr.forEach(({ pos }) => {
              decorations.push(
                Decoration.widget(pos + 1, () => {
                  const grip = document.createElement('span');
                  grip.setAttribute('style', 'display: block;line-height:0px;');
                  grip.innerHTML = '&ZeroWidthSpace;';
                  return grip;
                }),
              );
            });
          }
        }

        return DecorationSet.create(doc, decorations);
      },
      handleKeyDown: (view, event) => {
        // After selecting a cell and pressing the delete key, the cursor will move to the first selected cell after clearing the cell.
        if (event.code === 'Backspace') {
          const isCellSelection = view.state.selection instanceof CellSelection;
          if (isCellSelection) {
            return deleteCellSelection(view.state, view.dispatch);
          }
        }
      },
    },
  });
  return plugin;
}
