const {EditorView} = require("prosemirror-view")
const {EditorState} = require("prosemirror-state")
const {DOMParser, Schema} = require("prosemirror-model")
const {schema: baseSchema} = require("prosemirror-schema-basic")
const {baseKeymap} = require("prosemirror-commands")
const {keymap} = require("prosemirror-keymap")

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

let doc = DOMParser.fromSchema(schema).parse(document.querySelector("#content"))
let state = EditorState.create({doc, plugins: [
  tableEditing(),
  keymap(baseKeymap)
]})

window.view = new EditorView(document.querySelector("#editor"), {state})

document.execCommand("enableObjectResizing", false, "false")
document.execCommand("enableInlineTableEditing", false, "false")
