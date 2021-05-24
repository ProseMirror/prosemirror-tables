import { TextSelection } from "prosemirror-state";

export const switchRows = (view, tableRect, originIndex, insertIndex, rowPos) => {
    const rowsSlice = tableRect.table.content.content.slice();
    const [draggedRow] = rowsSlice.splice(originIndex, 1);

    rowsSlice.splice(originIndex > insertIndex ? insertIndex : insertIndex - 1, 0, draggedRow)

    const { tr } = view.state;
    tr.replaceWith(tableRect.tableStart, tableRect.tableStart + tableRect.table.content.size, rowsSlice);
    tr.setSelection(TextSelection.create(view.state.doc, rowPos));
    view.dispatch(tr)     
}