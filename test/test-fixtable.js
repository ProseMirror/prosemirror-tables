const ist = require("ist")
const {EditorState} = require("prosemirror-state")

const {doc, table, tr, c, c11, cEmpty, eq} = require("./build")
const {fixTables} = require("../src/fixtables")

function fix(table) {
  let state = EditorState.create({doc: doc(table)})
  let tr = fixTables(state)
  return tr && tr.doc.firstChild
}

describe("fixTable", () => {
  it("doesn't touch correct tables", () => {
    ist(fix(table(tr(c11, c11, c(1, 2)), tr(c11, c11))), null)
  })

  it("adds trivially missing cells", () => {
    ist(fix(table(tr(c11, c11, c(1, 2)), tr(c11))),
        table(tr(c11, c11, c(1, 2)), tr(c11, cEmpty)), eq)
  })

  it("can add to multiple rows", () => {
    ist(fix(table(tr(c11), tr(c11, c11), tr(c(3, 1)))),
        table(tr(c11, cEmpty, cEmpty), tr(cEmpty, c11, c11), tr(c(3, 1))), eq)
  })

  it("will default to adding at the start of the first row", () => {
    ist(fix(table(tr(c11), tr(c11, c11))),
        table(tr(cEmpty, c11), tr(c11, c11)), eq)
  })

  it("will default to adding at the end of the non-first row", () => {
    ist(fix(table(tr(c11, c11), tr(c11))),
        table(tr(c11, c11), tr(c11, cEmpty)), eq)
  })

  it("will fix overlapping cells", () => {
    ist(fix(table(tr(c11, c(1, 2), c11), tr(c(2, 1)))),
        table(tr(c11, c(1, 2), c11), tr(c11, cEmpty, cEmpty)), eq)
  })

  it("will fix a rowspan that sticks out of the table", () => {
    ist(fix(table(tr(c11, c11), tr(c(1, 2), c11))),
        table(tr(c11, c11), tr(c11, c11)), eq)
  })
})
