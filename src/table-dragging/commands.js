import { TextSelection } from "prosemirror-state";

export const switchRows = (view, tableRect, originIndex, insertIndex, selPos, tr) => {
    const rowsSlice = tableRect.table.content.content.slice();
    const [draggedRow] = rowsSlice.splice(originIndex, 1);

    rowsSlice.splice(originIndex > insertIndex ? insertIndex : insertIndex - 1, 0, draggedRow)

    const newTr = tr || view.state.tr;
    newTr.replaceWith(tableRect.tableStart, tableRect.tableStart + tableRect.table.content.size, rowsSlice);
    newTr.setSelection(TextSelection.create(view.state.doc, selPos));

    if(tr) {
        return newTr;
    }

    view.dispatch(newTr)     
}
