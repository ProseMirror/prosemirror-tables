import ist from 'ist';
import { columnResizing, columnResizingPluginKey } from '..';
import { EditorState, NodeSelection } from 'prosemirror-state';
import { doc, table, tr, td, cEmpty, p } from './build';

describe("columnresizing", () => {
  // setup document object for testing
  beforeEach(() => {
    /*global globalThis*/
    globalThis.document = {
      createElement: () => {
        return { className: "" };
      },
    };
  });

  // simple table is a table with colspan = 1 and rowspan = 1
  describe("3 x 2 simple table", () => {
    let state = null;
    let plugin = null;
    beforeEach(() => {
      let simpleTable = table(
        tr(cEmpty, cEmpty),
        tr(cEmpty, cEmpty),
        tr(cEmpty, cEmpty)
      );
      plugin = columnResizing();
      state = EditorState.create({ doc: doc(simpleTable), plugins: [plugin] });
    });
    afterEach(() => {
      state = null;
      plugin = null;
    });

    it("hovering on the first row border", () => {
      let transaction = state.tr.setMeta(columnResizingPluginKey, {
        setHandle: 2,
        setDragging: null,
      });
      let newState = state.apply(transaction);
      ist(plugin.props.decorations(newState).find().length, 3);
    });

    it("hovering on the second row border", () => {
      let transaction = state.tr.setMeta(columnResizingPluginKey, {
        setHandle: 12,
        setDragging: null,
      });
      let newState = state.apply(transaction);
      ist(plugin.props.decorations(newState).find().length, 3);
    });

    it("hovering on the third row border", () => {
      let transaction = state.tr.setMeta(columnResizingPluginKey, {
        setHandle: 22,
        setDragging: null,
      });
      let newState = state.apply(transaction);
      ist(plugin.props.decorations(newState).find().length, 3);
    });
  });

  // This is a labelled diagram of the table being tested.
  // Notice the left border is not labelled. This is because
  // all borders are referenced to the right of the cells.
  // The (x, pos) indicate where the user is hovering and the resolved
  // position. The initial editor state is a document with just an empty
  // table. All cells are empty.
  //
  //          border 1     border 2     border 3
  // |                                     |(1, 2)
  // --------------------------------------
  // |         |(2, 9)       |(3, 14)      |(4, 18)
  //            ---------------------------
  // |         |(5, 9)       |(6, 24)      |(7, 28)
  // --------------------------------------
  describe("3 x 3 table with rowspan and colspan", () => {
    let state = null;
    let plugin = null;
    beforeEach(() => {
      let complicatedTable = table(
        tr(td({ colspan: 3, rowspan: 1 }, p())),
        tr(td({ colspan: 1, rowspan: 2 }, p()), cEmpty, cEmpty),
        tr(cEmpty, cEmpty)
      );
      plugin = columnResizing();
      state = EditorState.create({
        doc: doc(complicatedTable),
        plugins: [plugin],
      });
    });
    afterEach(() => {
      state = null;
      plugin = null;
    });

    describe("border 1", () => {
      it("resolves for (2)", () => {
        let transaction = state.tr.setMeta(columnResizingPluginKey, {
          setHandle: 8,
          setDragging: null,
        });
        let newState = state.apply(transaction);

        // it is one cell so there should be only one decoration
        ist(plugin.props.decorations(newState).find().length, 1);
      });

      it("resolves for (5)", () => {
        let transaction = state.tr.setMeta(columnResizingPluginKey, {
          setHandle: 8, // this is the same as previous test this cell span over to 2 rows
          setDragging: null,
        });
        let newState = state.apply(transaction);

        // it is one cell so there should be only one decoration
        ist(plugin.props.decorations(newState).find().length, 1);
      });
    });

    describe("border 2", () => {
      it("resolves for (3)", () => {
        let transaction = state.tr.setMeta(columnResizingPluginKey, {
          setHandle: 12,
          setDragging: null,
        });
        let newState = state.apply(transaction);

        ist(plugin.props.decorations(newState).find().length, 2);
      });

      it("resolves for (6)", () => {
        let transaction = state.tr.setMeta(columnResizingPluginKey, {
          setHandle: 22, // this is the same as previous test because it resolves to the same cell
          setDragging: null,
        });
        let newState = state.apply(transaction);

        ist(plugin.props.decorations(newState).find().length, 2);
      });
    });

    describe("border 3", () => {
      it("resolves for (1)", () => {
        let transaction = state.tr.setMeta(columnResizingPluginKey, {
          setHandle: 2,
          setDragging: null,
        });
        let newState = state.apply(transaction);

        ist(plugin.props.decorations(newState).find().length, 3);
      });

      it("resolves for (4)", () => {
        let transaction = state.tr.setMeta(columnResizingPluginKey, {
          setHandle: 16,
          setDragging: null,
        });
        let newState = state.apply(transaction);

        ist(plugin.props.decorations(newState).find().length, 3);
      });

      it("resolves for (7)", () => {
        let transaction = state.tr.setMeta(columnResizingPluginKey, {
          setHandle: 26,
          setDragging: null,
        });

        let newState = state.apply(transaction);

        ist(plugin.props.decorations(newState).find().length, 3);
      });
    });
  });
  describe("table is deleted", () => {
    let state = null;
    let plugin = null;
    let simpleTable = table(
      tr(cEmpty, cEmpty),
      tr(cEmpty, cEmpty),
      tr(cEmpty, cEmpty)
    );
    beforeEach(() => {
      const docWithSimpleTable = doc(simpleTable);
      plugin = columnResizing();
      state = EditorState.create({
        doc: docWithSimpleTable,
        plugins: [plugin],
        selection: NodeSelection.create(docWithSimpleTable, 0)
      });
    });
    afterEach(() => {
      state = null;
      plugin = null;
    });
    it("decorations are removed", () => {
      let transaction = state.tr.deleteSelection().setMeta(columnResizingPluginKey, {
        setHandle: 2,
        setDragging: null,
      });
      let newState = state.apply(transaction);
      ist(plugin.props.decorations(newState).find().length, 0);
    })
  })
});
