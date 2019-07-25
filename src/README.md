# ProseMirror table module

This module defines a schema extension to support tables with
rowspan/colspan support, a custom selection class for cell selections
in such a table, a plugin to manage such selections and enforce
invariants on such tables, and a number of commands to work with
tables.

The top-level directory contains a `demo.js` and `index.html`, which
can be built with `npm run build_demo` to show a simple demo of how the
module can be used.

## Documentation

The module's main file exports everything you need to work with it.
The first thing you'll probably want to do is create a table-enabled
schema. That's what `tableNodes` is for:

@tableNodes

@tableEditing

@CellSelection

### Commands

The following commands can be used to make table-editing functionality
available to users.

@addColumnBefore

@addColumnAfter

@deleteColumn

@addRowBefore

@addRowAfter

@deleteRow

@mergeCells

@splitCell

@splitCellWithType

@setCellAttr

@toggleHeaderRow

@toggleHeaderColumn

@toggleHeaderCell

@toggleHeader

@goToNextCell

@deleteTable

### Utilities

@fixTables

@TableMap
