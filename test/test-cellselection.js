const ist = require("ist")
const {EditorState} = require("prosemirror-state")
const {Slice} = require("prosemirror-model")

const {doc, table, tr, p, td, cEmpty, c11, cAnchor, cHead, c, eq, selectionFor} = require("./build")
const {CellSelection} = require("../src/cellselection")
const {addRowBefore, addRowAfter, addColumnBefore, addColumnAfter} = require("../src/commands")

let t = doc(table(tr(/* 2*/ cEmpty, /* 6*/ cEmpty, /*10*/ cEmpty),
                  tr(/*16*/ cEmpty, /*20*/ cEmpty, /*24*/ cEmpty),
                  tr(/*30*/ cEmpty, /*34*/ cEmpty, /*36*/ cEmpty)))

function run(anchor, head, command) {
  let state = EditorState.create({doc: t, selection: CellSelection.create(t, anchor, head)})
  command(state, tr => state = state.apply(tr))
  return state
}

describe("CellSelection", () => {
  it("will put its head/anchor after the node that's further to the right", () => {
    let s = CellSelection.create(t, 2, 24)
    ist(s.anchor, 2)
    ist(s.head, 28)
    s = CellSelection.create(t, 24, 2)
    ist(s.anchor, 28)
    ist(s.head, 2)
    s = CellSelection.create(t, 10, 30)
    ist(s.anchor, 14)
    ist(s.head, 30)
    s = CellSelection.create(t, 30, 10)
    ist(s.anchor, 30)
    ist(s.head, 14)
  })

  it("extends a row selection when adding a row", () => {
    let sel = run(34, 6, addRowBefore).selection
    ist(sel.$anchorCell.pos, 48)
    ist(sel.$headCell.pos, 6)
    sel = run(6, 30, addRowAfter).selection
    ist(sel.$anchorCell.pos, 6)
    ist(sel.$headCell.pos, 44)
  })

  it("extends a col selection when adding a column", () => {
    let sel = run(16, 24, addColumnAfter).selection
    ist(sel.$anchorCell.pos, 20)
    ist(sel.$headCell.pos, 32)
    sel = run(24, 30, addColumnBefore).selection
    ist(sel.$anchorCell.pos, 32)
    ist(sel.$headCell.pos, 38)
  })
})

describe("CellSelection.content", () => {
  function slice(doc) { return new Slice(doc.content, 1, 1) }

  it("contains only the selected cells", () =>
     ist(selectionFor(table(tr(c11, cAnchor, cEmpty), tr(c11, cEmpty, cHead), tr(c11, c11, c11))).content(),
         slice(table("<a>", tr(c11, cEmpty), tr(cEmpty, c11))), eq))

  it("understands spanning cells", () =>
     ist(selectionFor(table(tr(cAnchor, c(2, 2), c11, c11), tr(c11, cHead, c11, c11))).content(),
         slice(table(tr(c11, c(2, 2), c11), tr(c11, c11))), eq))

  it("cuts off cells sticking out horizontally", () =>
     ist(selectionFor(table(tr(c11, cAnchor, c(2, 1)), tr(c(4, 1)), tr(c(2, 1), cHead, c11))).content(),
         slice(table(tr(c11, c11), tr(td({colspan: 2}, p())), tr(cEmpty, c11))), eq))

  it("cuts off cells sticking out vertically", () =>
     ist(selectionFor(table(tr(c11, c(1, 4), c(1, 2)), tr(cAnchor), tr(c(1, 2), cHead), tr(c11))).content(),
         slice(table(tr(c11, td({rowspan: 2}, p()), cEmpty), tr(c11, c11))), eq))
})
