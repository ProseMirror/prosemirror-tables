# ProseMirror table module

This module defines a schema extension to support tables with
rowspan/colspan support, a custom selection class for cell selections
in such a table, a plugin to manage such selections and enforce
invariants on such tables, and a number of commands to work with
tables.

The top-level directory contains a `demo.js` and `index.html`, which
can be built with `npm run build` to show a simple demo of how the
module can be used.

## Documentation

The module's main file exports everything you need to work with it.
The first thing you'll probably want to do is create a table-enabled
schema. That's what `addTableNodes` is for:

**`addTableNodes`**`(nodes: OrderedMap, options: Object) → OrderedMap`

This function takes a set of node types (as in `schema.spec.nodes`),
and extends it to add the `table`, `table_row`, and `table_cell` nodes
types as used by this module. The result can then be used as [`nodes`
spec](http://prosemirror.net/docs/ref/#model.SchemaSpec.nodes) when
creating a new schema.

The following options are recognized:

 * **`tableGroup`**`: ?string`  
   A group name (something like `"block"`) to add to the table
   node type.

 * **`cellContent`**`: string`  
   The content expression for table cells.

 * **`cellAttributes`**`: Object`  
   Additional attributes to add to cells. Maps attribute names to
   objects with the following properties:

   * **`default`**`: any`  
     The attribute's default value.

   * **`getFromDOM`**`: ?(dom.Node) → any`  
     A function to read the attribute's value from a DOM node.

   * **`setDOMAttr`**`: ?(value: any, attrs: Object)>`  
     A function to add the attribute's value to an attribute
     object that's used to render the cell's DOM.

**`tableEditing`**`() → Plugin`

Creates a [plugin](http://prosemirror.net/docs/ref/#state.Plugin)
that, when added to an editor, enables cell-selection, handles
cell-based copy/paste, and makes sure tables stay well-formed (each
row has the same width, and cells don't overlap).

**`CellSelection`** class

A [`Selection`](http://prosemirror.net/docs/ref/#state.Selection)
subclass that represents a cell selection spanning part of a table.
With the plugin enabled, these will be created when the user selects
across cells, and will be drawn by giving selected cells a
`selectedCell` CSS class.

A cell selection is identified by its anchor and head cells, and all
cells whose start falls within the rectangle spanned by those cells
are considered selected.

 * **`$anchorCell`**`: ResolvedPos`  
   A resolved position pointing _in front of_ the anchor cell (the one
   that doesn't move when extending the selection).

 * **`$headCell`**`: ResolvedPos`  
   A resolved position pointing in front of the head cell (the one
   moves when extending the selection).

 * **`constructor`**`($anchorCell: ResolvedPos, $headCell: ResolvedPos)`  
   Constructs a cell selection instance between the two given cells.

 * **`isRowSelection`**`() → bool`  
   True if this selection goes all the way from the left to the
   right of the table.

 * **`isColSelection`**`() → bool`  
   True if this selection goes all the way from the top to the
   bottom of the table.

 * `static `**`rowSelection`**`($anchorCell: ResolvedPos, $headCell: ?ResolvedPos) → CellSelection`  
   Returns the smallest row selection that covers the given anchor
   and head cell.

 * `static `**`colSelection`**`($anchorCell: ResolvedPos, $headCell: ?ResolvedPos) → CellSelection`  
   Returns the smallest column selection that covers the given anchor
   and head cell.

### Commands

The following commands can be used to make table-editing functionality
available to users.

**`addColumnBefore`**`(EditorState, dispatch: ?(tr: Transaction)) → bool`  
Add an empty column before the selected column.

**`addColumnAfter`**`(EditorState, dispatch: ?(tr: Transaction)) → bool`  
Add an empty column after the selected column.

**`deleteColumn`**`(EditorState, dispatch: ?(tr: Transaction)) → bool`  
Delete the selected column or columns.

**`addRowBefore`**`(EditorState, dispatch: ?(tr: Transaction)) → bool`  
Add an empty row before the selected row.

**`addRowAfter`**`(EditorState, dispatch: ?(tr: Transaction)) → bool`  
Add an empty row after the selected row.

**`deleteRow`**`(EditorState, dispatch: ?(tr: Transaction)) → bool`  
Delete the selected row or rows.

**`mergeCells`**`(EditorState, dispatch: ?(tr: Transaction)) → bool`  
Merge the selected cells into a single cell. Only available when the
selected cells' outline forms a rectangle.

**`splitCell`**`(EditorState, dispatch: ?(tr: Transaction)) → bool`  
Split a selected cell, whose rowpan or colspan is greater than one,
into smaller cells.

**`setCellAttr`**`(attr: string, value: any) → (EditorState, dispatch: ?(tr: Transaction)) → bool`  
Returns a command that sets the given attribute to the given value,
and is only available when the currently selected cell doesn't
already have that attribute set to that value.

**`setTableHeader`**`(side: union<"left", "top">, on: bool) → (EditorState, dispatch: ?(tr: Transaction)) → bool`  
Returns a comand to en- or disable the top or left heading for a
table. Table headers are implemented with an attribute on the table
node, as opposed to using different cell types, in order to support
having the headers strictly ad the top and/or left, without running
into consistency issues.

**`goToNextCell`**`(direction: number) → (EditorState, dispatch: ?(tr: Transaction)) → bool`  
Returns a command for selecting the next (direction=1) or previous
(direction=-1) cell in a table.

**`deleteTable`**`(EditorState, dispatch: ?(tr: Transaction)) → bool`  
Deletes the table around the selection, if any.
