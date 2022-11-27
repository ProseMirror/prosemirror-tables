// This file defines a plugin that handles the drawing of cell
// selections and the basic user interactions for creating and working
// with such selections. It also makes sure that, after each
// transaction, the shapes of tables are normalized to be rectangular
// and not contain overlapping cells.

import { Plugin } from 'prosemirror-state';

import {
  handleKeyDown,
  handleMouseDown,
  handlePaste,
  handleTripleClick,
} from './input';
import { tableEditingKey } from './util';
import { drawCellSelection, normalizeSelection } from './cellselection';
import { fixTables, fixTablesKey } from './fixtables';

export { Direction } from './input';
export { CellSelectionJSON, CellBookmark } from './cellselection';

/**
 * @public
 */
export type TableEditingOptions = {
  allowTableNodeSelection?: boolean;
};

/**
 * Creates a [plugin](http://prosemirror.net/docs/ref/#state.Plugin)
 * that, when added to an editor, enables cell-selection, handles
 * cell-based copy/paste, and makes sure tables stay well-formed (each
 * row has the same width, and cells don't overlap).
 *
 * You should probably put this plugin near the end of your array of
 * plugins, since it handles mouse and arrow key events in tables
 * rather broadly, and other plugins, like the gap cursor or the
 * column-width dragging plugin, might want to get a turn first to
 * perform more specific behavior.
 *
 * @public
 */
export function tableEditing({
  allowTableNodeSelection = false,
}: TableEditingOptions = {}): Plugin {
  return new Plugin({
    key: tableEditingKey,

    // This piece of state is used to remember when a mouse-drag
    // cell-selection is happening, so that it can continue even as
    // transactions (which might move its anchor cell) come in.
    state: {
      init() {
        return null;
      },
      apply(tr, cur) {
        const set = tr.getMeta(tableEditingKey);
        if (set != null) return set == -1 ? null : set;
        if (cur == null || !tr.docChanged) return cur;
        const { deleted, pos } = tr.mapping.mapResult(cur);
        return deleted ? null : pos;
      },
    },

    props: {
      decorations: drawCellSelection,

      handleDOMEvents: {
        mousedown: handleMouseDown,
      },

      createSelectionBetween(view) {
        if (tableEditingKey.getState(view.state) != null)
          return view.state.selection;
      },

      handleTripleClick,

      handleKeyDown,

      handlePaste,
    },

    appendTransaction(_, oldState, state) {
      return normalizeSelection(
        state,
        fixTables(state, oldState),
        allowTableNodeSelection,
      );
    },
  });
}

export { fixTables, handlePaste, fixTablesKey };
export {
  cellAround,
  isInTable,
  selectionCell,
  moveCellForward,
  inSameTable,
  findCell,
  colCount,
  nextCell,
  pointsAtCell,
  removeColSpan,
  addColSpan,
  columnIsHeader,
  MutableAttrs,
} from './util';
export {
  tableNodes,
  tableNodeTypes,
  TableNodesOptions,
  TableRoles,
  CellAttributes,
  getFromDOM,
  setDOMAttr,
} from './schema';
export { CellSelection } from './cellselection';
export { TableMap, Problem, Rect, ColWidths } from './tablemap';
export { tableEditingKey };
export * from './commands';
export {
  columnResizing,
  columnResizingPluginKey,
  ResizeState,
  ColumnResizingOptions,
  Dragging,
} from './columnresizing';
export { updateColumnsOnResize, TableView } from './tableview';
export {
  pastedCells as __pastedCells,
  insertCells as __insertCells,
  clipCells as __clipCells,
  Area as __Area,
} from './copypaste';
