const {PluginKey, Plugin} = require("prosemirror-state");
const {DecorationSet, Decoration} = require("prosemirror-view");

const key = new PluginKey('decoration1')

function decoPlugin(decos = []) {
	return new Plugin({
		key,
		state: {
			init(config) { return DecorationSet.create(config.doc, decos.map(make)) },
			apply(tr, set, state) {
				// console.log("Apply decoration", tr.docChanged)
				if (tr.docChanged) set = set.map(tr.mapping, tr.doc)
				let change = tr.getMeta("updateDecorations")
				if (change) {
					if (change.remove) set = set.remove(change.remove)
					if (change.add) set = set.add(state.doc, change.add)
				}
				return set
			}
		},
		props: {
			decorations(state) { return this.getState(state) }
		}
	})
}

function make(d) {
	if (d.type) return d
	if (d.pos != null) return Decoration.widget(d.pos, d.widget || widget, d)
	if (d.node) return Decoration.node(d.from, d.to, d.attrs || {}, d)
	return Decoration.inline(d.from, d.to, d.attrs || {}, d)
}

module.exports = {decoPlugin}