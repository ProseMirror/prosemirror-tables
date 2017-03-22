const ist = require("ist")
const {EditorState} = require("prosemirror-state")

const {doc, table, tr, p, td, c, c11, cEmpty, cCursor, cHead, cAnchor, eq, selectionFor} = require("./build")
const {addColumnAfter, addColumnBefore, deleteColumn, addRowAfter, addRowBefore, deleteRow} = require("../src/commands")

function test(doc, command, result) {
  if (result == null) result = doc
  let state = EditorState.create({doc, selection: selectionFor(doc)})
  command(state, tr => state = state.apply(tr))
  ist(state.doc, result, eq)
}

describe("addColumnAfter", () => {
  it("can add a plain column", () =>
     test(table(tr(c11, c11, c11), tr(c11, cCursor, c11), tr(c11, c11, c11)),
          addColumnAfter,
          table(tr(c11, c11, cEmpty, c11), tr(c11, c11, cEmpty, c11), tr(c11, c11, cEmpty, c11))))

  it("can add a column at the right of the table", () =>
     test(table(tr(c11, c11, c11), tr(c11, c11, c11), tr(c11, c11, cCursor)),
          addColumnAfter,
          table(tr(c11, c11, c11, cEmpty), tr(c11, c11, c11, cEmpty), tr(c11, c11, c11, cEmpty))))

  it("can add a second cell", () =>
     test(table(tr(cCursor)),
          addColumnAfter,
          table(tr(c11, cEmpty))))

  it("can grow a colspan cell", () =>
     test(table(tr(cCursor, c11), tr(c(2, 1))),
          addColumnAfter,
          table(tr(c11, cEmpty, c11), tr(c(3, 1)))))

  it("places new cells in the right spot when there's row spans", () =>
     test(table(tr(c11, c(1, 2), c(1, 2)), tr(c11), tr(c11, cCursor, c11)),
          addColumnAfter,
          table(tr(c11, c(1, 2), cEmpty, c(1, 2)), tr(c11, cEmpty), tr(c11, c11, cEmpty, c11))))

  it("can place new cells into an empty row", () =>
     test(table(tr(c(1, 2), c(1, 2)), tr(), tr(cCursor, c11)),
          addColumnAfter,
          table(tr(c(1, 2), cEmpty, c(1, 2)), tr(cEmpty), tr(c11, cEmpty, c11))))

  it("will skip ahead when growing a rowspan cell", () =>
     test(table(tr(c(2, 2), c11), tr(c11), tr(cCursor, c11, c11)),
          addColumnAfter,
          table(tr(c(3, 2), c11), tr(c11), tr(cCursor, cEmpty, c11, c11))))

  it("will use the right side of a single cell selection", () =>
     test(table(tr(cAnchor, c11), tr(c11, c11)),
          addColumnAfter,
          table(tr(c11, cEmpty, c11), tr(c11, cEmpty, c11))))

  it("will use the right side of a bigger cell selection", () =>
     test(table(tr(cHead, c11, c11), tr(c11, cAnchor, c11)),
          addColumnAfter,
          table(tr(c11, c11, cEmpty, c11), tr(c11, c11, cEmpty, c11))))

  it("properly handles a cell node selection", () =>
     test(table(tr("<node>", c11, c11), tr(c11, c11)),
          addColumnAfter,
          table(tr(c11, cEmpty, c11), tr(c11, cEmpty, c11))))

  it("does nothing outside of a table", () =>
     test(doc(p("foo<cursor>")),
          addColumnAfter,
          null))
})

describe("addColumnBefore", () => {
  it("can add a plain column", () =>
     test(table(tr(c11, c11, c11), tr(c11, cCursor, c11), tr(c11, c11, c11)),
          addColumnBefore,
          table(tr(c11, cEmpty, c11, c11), tr(c11, cEmpty, c11, c11), tr(c11, cEmpty, c11, c11))))

  it("can add a column at the left of the table", () =>
     test(table(tr(cCursor, c11, c11), tr(c11, c11, c11), tr(c11, c11, c11)),
          addColumnBefore,
          table(tr(cEmpty, c11, c11, c11), tr(cEmpty, c11, c11, c11), tr(cEmpty, c11, c11, c11))))

  it("will use the left side of a single cell selection", () =>
     test(table(tr(cAnchor, c11), tr(c11, c11)),
          addColumnBefore,
          table(tr(cEmpty, c11, c11), tr(cEmpty, c11, c11))))

  it("will use the left side of a bigger cell selection", () =>
     test(table(tr(c11, cHead, c11), tr(c11, c11, cAnchor)),
          addColumnBefore,
          table(tr(c11, cEmpty, c11, c11), tr(c11, cEmpty, c11, c11))))
})

describe("deleteColumn", () => {
  it("can delete a plain column", () =>
     test(table(tr(cEmpty, c11, c11), tr(c11, cCursor, c11), tr(c11, c11, cEmpty)),
          deleteColumn,
          table(tr(cEmpty, c11), tr(c11, c11), tr(c11, cEmpty))))

  it("can delete the first column", () =>
     test(table(tr(cCursor, cEmpty, c11), tr(c11, c11, c11), tr(c11, c11, c11)),
          deleteColumn,
          table(tr(cEmpty, c11), tr(c11, c11), tr(c11, c11))))

  it("can delete the last column", () =>
     test(table(tr(c11, cEmpty, cCursor), tr(c11, c11, c11), tr(c11, c11, c11)),
          deleteColumn,
          table(tr(c11, cEmpty), tr(c11, c11), tr(c11, c11))))

  it("can reduce a cell's colspan", () =>
     test(table(tr(c11, cCursor), tr(c(2, 1))),
          deleteColumn,
          table(tr(c11), tr(c11))))

  it("will skip rows after a rowspan", () =>
     test(table(tr(c11, cCursor), tr(c11, c(1, 2)), tr(c11)),
          deleteColumn,
          table(tr(c11), tr(c11), tr(c11))))

  it("will delete all columns under a colspan cell", () =>
     test(table(tr(c11, td({colspan: 2}, p("<cursor>"))), tr(cEmpty, c11, c11)),
          deleteColumn,
          table(tr(c11), tr(cEmpty))))

  it("deletes a cell-selected column", () =>
     test(table(tr(cEmpty, cAnchor), tr(c11, cHead)),
          deleteColumn,
          table(tr(cEmpty), tr(c11))))

  it("deletes multiple cell-selected columns", () =>
     test(table(tr(c(1, 2), cAnchor, c11), tr(c11, cEmpty), tr(cHead, c11, c11)),
          deleteColumn,
          table(tr(c11), tr(cEmpty), tr(c11))))
})

describe("addRowAfter", () => {
  it("can add a simple row", () =>
     test(table(tr(cCursor, c11), tr(c11, c11)),
          addRowAfter,
          table(tr(c11, c11), tr(cEmpty, cEmpty), tr(c11, c11))))

  it("can add a row at the end", () =>
     test(table(tr(c11, c11), tr(c11, cCursor)),
          addRowAfter,
          table(tr(c11, c11), tr(c11, c11), tr(cEmpty, cEmpty))))

  it("increases rowspan when needed", () =>
     test(table(tr(cCursor, c(1, 2)), tr(c11)),
          addRowAfter,
          table(tr(c11, c(1, 3)), tr(cEmpty), tr(c11))))

  it("skips columns for colspan cells", () =>
     test(table(tr(cCursor, c(2, 2)), tr(c11)),
          addRowAfter,
          table(tr(c11, c(2, 3)), tr(cEmpty), tr(c11))))

  it("picks the row after a cell selection", () =>
     test(table(tr(cHead, c11, c11), tr(c11, cAnchor, c11), tr(c(3, 1))),
          addRowAfter,
          table(tr(c11, c11, c11), tr(c11, c11, c11), tr(cEmpty, cEmpty, cEmpty), tr(c(3, 1)))))
})

describe("addRowBefore", () => {
  it("can add a simple row", () =>
     test(table(tr(c11, c11), tr(cCursor, c11)),
          addRowBefore,
          table(tr(c11, c11), tr(cEmpty, cEmpty), tr(c11, c11))))

  it("can add a row at the start", () =>
     test(table(tr(cCursor, c11), tr(c11, c11)),
          addRowBefore,
          table(tr(cEmpty, cEmpty), tr(c11, c11), tr(c11, c11))))

  it("picks the row before a cell selection", () =>
     test(table(tr(c11, c(2, 1)), tr(cAnchor, c11, c11), tr(c11, cHead, c11)),
          addRowBefore,
          table(tr(c11, c(2, 1)), tr(cEmpty, cEmpty, cEmpty), tr(c11, c11, c11), tr(c11, c11, c11))))
})

describe("deleteRow", () => {
  it("can delete a simple row", () =>
    test(table(tr(c11, cEmpty), tr(cCursor, c11), tr(c11, cEmpty)),
         deleteRow,
         table(tr(c11, cEmpty), tr(c11, cEmpty))))

  it("can delete the first row", () =>
    test(table(tr(c11, cCursor), tr(cEmpty, c11), tr(c11, cEmpty)),
         deleteRow,
         table(tr(cEmpty, c11), tr(c11, cEmpty))))

  it("can delete the last row", () =>
    test(table(tr(cEmpty, c11), tr(c11, cEmpty), tr(c11, cCursor)),
         deleteRow,
         table(tr(cEmpty, c11), tr(c11, cEmpty))))

  it("can shrink rowspan cells", () =>
     test(table(tr(c(1, 2), c11, c(1, 3)), tr(cCursor), tr(c11, c11)),
          deleteRow,
          table(tr(c11, c11, c(1, 2)), tr(c11, c11))))

  it("can move cells that start in the deleted row", () =>
     test(table(tr(c(1, 2), cCursor), tr(cEmpty)),
          deleteRow,
          table(tr(c11, cEmpty))))

  it("deletes multiple rows when the start cell has a rowspan", () =>
     test(table(tr(td({rowspan: 3}, p("<cursor>")), c11), tr(c11), tr(c11), tr(c11, c11)),
          deleteRow,
          table(tr(c11, c11))))

  it("skips columns when adjusting rowspan", () =>
     test(table(tr(cCursor, c(2, 2)), tr(c11)),
          deleteRow,
          table(tr(c11, c(2, 1)))))

  it("can delete a cell selection", () =>
     test(table(tr(cAnchor, c11), tr(c11, cEmpty)),
          deleteRow,
          table(tr(c11, cEmpty))))

  it("will delete all rows in the cell selection", () =>
     test(table(tr(c11, cEmpty), tr(cAnchor, c11), tr(c11, cHead), tr(cEmpty, c11)),
          deleteRow,
          table(tr(c11, cEmpty), tr(cEmpty, c11))))
})
