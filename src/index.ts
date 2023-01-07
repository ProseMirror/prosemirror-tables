// This file defines a plugin that handles the drawing of cell
// selections and the basic user interactions for creating and working
// with such selections. It also makes sure that, after each
// transaction, the shapes of tables are normalized to be rectangular
// and not contain overlapping cells.

import { Plugin } from 'prosemirror-state';

import { drawCellSelection, normalizeSelection } from './cellselection';
import { fixTables, fixTablesKey } from './fixtables';
import {
  handleKeyDown,
  handleMouseDown,
  handlePaste,
  handleTripleClick,
} from './input';
import { tableEditingKey } from './util';

export { CellBookmark, CellSelection } from './cellselection';
export type { CellSelectionJSON } from './cellselection';
export {
  columnResizing,
  columnResizingPluginKey,
  ResizeState,
} from './columnresizing';
export type { ColumnResizingOptions, Dragging } from './columnresizing';
export * from './commands';
export {
  clipCells as __clipCells,
  insertCells as __insertCells,
  pastedCells as __pastedCells,
} from './copypaste';
export type { Area as __Area } from './copypaste';
export type { Direction } from './input';
export { tableNodes, tableNodeTypes } from './schema';
export type {
  CellAttributes,
  getFromDOM,
  setDOMAttr,
  TableNodes,
  TableNodesOptions,
  TableRole,
} from './schema';
export { TableMap } from './tablemap';
export type { ColWidths, Problem, Rect } from './tablemap';
export { TableView, updateColumnsOnResize } from './tableview';
export {
  addColSpan,
  cellAround,
  colCount,
  columnIsHeader,
  findCell,
  inSameTable,
  isInTable,
  moveCellForward,
  nextCell,
  pointsAtCell,
  removeColSpan,
  selectionCell,
} from './util';
export type { MutableAttrs } from './util';
export { fixTables, handlePaste, fixTablesKey };
export { tableEditingKey };

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
        return tableEditingKey.getState(view.state) != null
          ? view.state.selection
          : null;
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
