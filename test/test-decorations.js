const {JSDOM} = require("jsdom")
const {EditorState, Plugin, PluginKey} = require("prosemirror-state")
const {EditorView, Decoration, DecorationSet} = require("prosemirror-view")

const {tr, c11, doc, table} = require("./build");
const {CellSelection} = require("../dist/");

const ist = require("ist");
const {decoPlugin} = require("../demo.large");

describe.only("Cell Selection performance with decorations", () => {
	beforeEach(() => {
		const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
		global.window = dom.window;
		global.document = dom.window.document;
	})

	const rows = new Array(1000).fill(undefined).map(x => tr(/* 2*/ c11, /* 7*/ c11, /*12*/ c11))
	let largeTable = doc(table(...rows))

	it("converts a table node selection into a selection of all cells in the table", () => {

		let dom = document.createElement("div")

		let view = new EditorView({
			mount: dom,
			plugins: [decoPlugin('decoration1')]
		}, {
			state: EditorState.create({doc: largeTable}),
		})

		let s = CellSelection.create(largeTable, 2, 24)
		ist(s.anchor, 25)
		ist(s.head, 28)
	})
})
