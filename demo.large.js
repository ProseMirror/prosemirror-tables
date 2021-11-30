const {initialize, schema} = require('./demo.base')
const {decoPlugin} = require("./test/plugins/decorations");

const n = schema.nodes
const rows = new Array(1000).fill(undefined).map((x, R) => {
		return n.table_row.createAndFill(
			{},
			new Array(20).fill(undefined).map((x, C) => {
					return n.table_cell.createAndFill(
						{}, n.paragraph.create({}, [schema.text(R + ' | ' + C)])
					)
				}
			)
		)
	}
)

const largeTable = schema.nodes.table.createChecked({}, rows)
const doc = schema.nodes.doc.create({}, largeTable)

initialize(doc, {
	plugins: [decoPlugin(['Test Decoration'])],
	tableEditingOptions: {
		mouseMoveThrottleOptOut: window.location.search.includes('throttle=false')
	},
	columnResizingOptions: {}
})
