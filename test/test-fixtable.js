const ist = require("ist")
const {EditorState} = require("prosemirror-state")

const {doc, table, tr, c, c11, cE} = require("./build")
const {fixTable} = require("../src/fixtables")

function eq(a, b) { return a.eq(b) }

function fix(table) {
  let state = EditorState.create({doc: doc(table)})
  let tr = fixTable(state, table, 0)
  return tr && tr.doc.firstChild
}

describe("fixTable", () => {
  it("doesn't touch correct tables", () => {
    ist(fix(table(tr(c11, c11, c(1, 2)), tr(c11, c11))), null)
  })

  it("adds trivially missing cells", () => {
    ist(fix(table(tr(c11, c11, c(1, 2)), tr(c11))),
        table(tr(c11, c11, c(1, 2)), tr(c11, cE)), eq)
  })

  it("can add to multiple rows", () => {
    ist(fix(table(tr(c11), tr(c11, c11), tr(c(3, 1)))),
        table(tr(c11, cE, cE), tr(cE, c11, c11), tr(c(3, 1))), eq)
  })

  it("will default to adding at the start of the first row", () => {
    ist(fix(table(tr(c11), tr(c11, c11))),
        table(tr(cE, c11), tr(c11, c11)), eq)
  })

  it("will default to adding at the end of the non-first row", () => {
    ist(fix(table(tr(c11, c11), tr(c11))),
        table(tr(c11, c11), tr(c11, cE)), eq)
  })

  it("will fix overlapping cells", () => {
    ist(fix(table(tr(c11, c(1, 2), c11), tr(c(2, 1)))),
        table(tr(c11, c(1, 2), c11), tr(c11, cE, cE)), eq)
  })
})
