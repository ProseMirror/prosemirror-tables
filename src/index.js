// This file defines a plugin that handles the drawing of cell
// selections and the basic user interactions for creating and working
// with such selections. It also makes sure that, after each
// transaction, the shapes of tables are normalized to be rectangular
// and not contain overlapping cells.

const {Plugin} = require("prosemirror-state")

const {handleTripleClick, handleKeyDown, handlePaste, handleMouseDown} = require("./input")
const {key} = require("./util")
const {drawCellSelection, CellSelection} = require("./cellselection")
const {fixTables} = require("./fixtables")
const {addTableNodes} = require("./schema")
const commands = require("./commands")

exports.tableEditing = function() {
  return new Plugin({
    key,

    // This piece of state is used to remember when a mouse-drag
    // cell-selection is happening, so that it can continue even as
    // transactions (which might move its anchor cell) come in.
    state: {
      init() { return null },
      apply(tr, cur) {
        let set = tr.getMeta(key)
        if (set != null) return set == -1 ? null : set
        if (cur == null || !tr.docChanged) return cur
        let {deleted, pos} = tr.mapping.mapResult(cur)
        return deleted ? null : pos
      }
    },

    props: {
      decorations: drawCellSelection,

      handleDOMEvents: {
        mousedown: handleMouseDown
      },

      createSelectionBetween(view) {
        if (key.getState(view.state) != null) return view.state.selection
      },

      handleTripleClick,

      handleKeyDown,

      handlePaste
    },

    appendTransaction(_, oldState, state) { return fixTables(state, oldState) }
  })
}

exports.addTableNodes = addTableNodes
exports.CellSelection = CellSelection
for (let name in commands) exports[name] = commands[name]
