const {EditorView} = require("prosemirror-view")
const {EditorState} = require("prosemirror-state")
const {DOMParser, Schema} = require("prosemirror-model")
const {schema: baseSchema} = require("prosemirror-schema-basic")
const {baseKeymap} = require("prosemirror-commands")
const {keymap} = require("prosemirror-keymap")
const {exampleSetup, buildMenuItems} = require("prosemirror-example-setup")
const {MenuItem, Dropdown} = require("prosemirror-menu")

const {addColumnAfter, addColumnBefore, deleteColumn, addRowAfter, addRowBefore, deleteRow,
       mergeCells, splitCell, setCellAttr, setTableHeader} = require("./src/commands")
const {tableEditing, addTableNodes} = require("./src")

let schema = new Schema({
  nodes: addTableNodes(baseSchema.spec.nodes, {
    cellAttributes: {
      background: {
        default: null,
        getFromDOM(dom) { return dom.style.backgroundColor || null },
        setDOMAttr(value, attrs) { if (value) attrs.style = (attrs.style || "") + `background-color: ${value};` }
      }
    }
  }),
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
  item("Merge cells", mergeCells),
  item("Split cell", splitCell),
  item("Remove left header", setTableHeader("left", false)),
  item("Add left header", setTableHeader("left", true)),
  item("Remove top header", setTableHeader("top", false)),
  item("Add top header", setTableHeader("top", true)),
  item("Make cell green", setCellAttr("background", "#dfd")),
  item("Make cell not-green", setCellAttr("background", null))
]
menu.splice(2, 0, [new Dropdown(tableMenu, {label: "Table"})])

let doc = DOMParser.fromSchema(schema).parse(document.querySelector("#content"))
let state = EditorState.create({doc, plugins: [
  tableEditing(),
  keymap(baseKeymap)
].concat(exampleSetup({schema, menuContent: menu}))})

window.view = new EditorView(document.querySelector("#editor"), {state})

document.execCommand("enableObjectResizing", false, "false")
document.execCommand("enableInlineTableEditing", false, "false")
