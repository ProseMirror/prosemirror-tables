const {EditorView} = require("prosemirror-view")
const {EditorState} = require("prosemirror-state")
const {DOMParser, Schema} = require("prosemirror-model")
const {schema: baseSchema} = require("prosemirror-schema-basic")
const {baseKeymap} = require("prosemirror-commands")
const {keymap} = require("prosemirror-keymap")
const {exampleSetup, buildMenuItems} = require("prosemirror-example-setup")
const {MenuItem, Dropdown} = require("prosemirror-menu")

const {addColumnAfter, addColumnBefore, deleteColumn, addRowAfter, addRowBefore, deleteRow,
       mergeCells, splitCell, setCellAttr} = require("./src/commands")
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
let tableMenu = [
  new MenuItem({label: "Insert column before", select: addColumnBefore, run: addColumnBefore}),
  new MenuItem({label: "Insert column after", select: addColumnAfter, run: addColumnAfter}),
  new MenuItem({label: "Delete column", select: deleteColumn, run: deleteColumn}),
  new MenuItem({label: "Insert row before", select: addRowBefore, run: addRowBefore}),
  new MenuItem({label: "Insert row after", select: addRowAfter, run: addRowAfter}),
  new MenuItem({label: "Delete row", select: deleteRow, run: deleteRow}),
  new MenuItem({label: "Merge cells", select: mergeCells, run: mergeCells}),
  new MenuItem({label: "Split cell", select: splitCell, run: splitCell}),
  new MenuItem({label: "Make cell green", select: setCellAttr(), run: setCellAttr("background", "#dfd")}),
  new MenuItem({label: "Make cell not-green", select: setCellAttr(), run: setCellAttr("background", null)})
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
