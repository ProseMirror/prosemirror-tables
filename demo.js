import {EditorView} from "prosemirror-view"
import {EditorState} from "prosemirror-state"
import {DOMParser, Schema}  from "prosemirror-model"
import {schema as baseSchema}  from "prosemirror-schema-basic"
import {baseKeymap}  from "prosemirror-commands"
import {keymap}  from "prosemirror-keymap"
import {exampleSetup, buildMenuItems}  from "prosemirror-example-setup"
import {MenuItem, Dropdown}  from "prosemirror-menu"

import {addColumnAfter, addColumnBefore, deleteColumn, addRowAfter, addRowBefore, deleteRow,
        mergeCells, splitCell, setCellAttr, toggleHeaderRow, toggleHeaderColumn, toggleHeaderCell,
        goToNextCell, deleteTable}  from "./src/commands"
import {tableEditing, columnResizing, tableNodes, fixTables}  from "./src"

let schema = new Schema({
  nodes: baseSchema.spec.nodes.append(tableNodes({
    tableGroup: "block",
    cellContent: "block+",
    cellAttributes: {
      background: {
        default: null,
        getFromDOM(dom) { return dom.style.backgroundColor || null },
        setDOMAttr(value, attrs) { if (value) attrs.style = (attrs.style || "") + `background-color: ${value};` }
      }
    }
  })),
  marks: baseSchema.spec.marks
})

let menu = buildMenuItems(schema).fullMenu
function item(label, cmd) { return new MenuItem({label, select: cmd, run: cmd}) }
let tableMenu = [
  item("Insert column before", addColumnBefore),
  item("Insert column after", addColumnAfter),
  item("Delete column", deleteColumn),
  item("Insert row before", addRowBefore),
  item("Insert row after", addRowAfter),
  item("Delete row", deleteRow),
  item("Delete table", deleteTable),
  item("Merge cells", mergeCells),
  item("Split cell", splitCell),
  item("Toggle header column", toggleHeaderColumn),
  item("Toggle header row", toggleHeaderRow),
  item("Toggle header cells", toggleHeaderCell),
  item("Make cell green", setCellAttr("background", "#dfd")),
  item("Make cell not-green", setCellAttr("background", null))
]
menu.splice(2, 0, [new Dropdown(tableMenu, {label: "Table"})])

let doc = DOMParser.fromSchema(schema).parse(document.querySelector("#content"))
let state = EditorState.create({doc, plugins: [
  columnResizing(),
  tableEditing(),
  keymap({
    "Tab": goToNextCell(1),
    "Shift-Tab": goToNextCell(-1)
  })
].concat(exampleSetup({schema, menuContent: menu}))})
let fix = fixTables(state)
if (fix) state = state.apply(fix.setMeta("addToHistory", false))

window.view = new EditorView(document.querySelector("#editor"), {state})

document.execCommand("enableObjectResizing", false, false)
document.execCommand("enableInlineTableEditing", false, false)
