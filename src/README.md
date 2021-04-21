# ProseMirror table module

This module defines a schema extension to support tables with
rowspan/colspan support, a custom selection class for cell selections
in such a table, a plugin to manage such selections and enforce
invariants on such tables, and a number of commands to work with
tables.

The top-level directory contains a `demo.js` and `index.html`, which
can be built with `npm run build_demo` to show a simple demo of how the
module can be used.

## skiff-org npm publish modifications

To publish a new pkg to github registry:
1. bump version - `npm version x.x.x`
2. Authenticate to github package registry - 
```sh
npm login --scope=@OWNER --registry=https://npm.pkg.github.com

Username: GITHUB_USERNAME
Password: TOKEN 
Email: PUBLIC-EMAIL-ADDRESS

Where TOKEN is an SSO (to skiff-org) enabled github PAT, with at least `repo`, and `write:packages` permissions. 
```
3. `npm publish`

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
