import { TextSelection, Selection } from "prosemirror-state";
import { CellSelection } from "../cellselection";

export const switchRows = (view, tableRect, originIndex, insertIndex, selPos, tr) => {
    const rowsSlice = tableRect.table.content.content.slice();
    const [draggedRow] = rowsSlice.splice(originIndex, 1);

    rowsSlice.splice(originIndex > insertIndex ? insertIndex : insertIndex - 1, 0, draggedRow)

    const newTr = tr || view.state.tr;
    newTr.replaceWith(tableRect.tableStart, tableRect.tableStart + tableRect.table.content.size, rowsSlice);
    newTr.setSelection(Selection.near(newTr.doc.resolve(selPos), 1));

    if(tr) {
        return newTr;
    }

    view.dispatch(newTr)    
}

export const switchCols = (view, tableRect, originIndex, insertIndex, selPos, tr) => {
    const rowsSlice = tableRect.table.content.content.slice();

    const newRowsSlice = rowsSlice.map((row) => switchCellsInRow(row, originIndex, insertIndex))

    const newTr = tr || view.state.tr;
    newTr.replaceWith(tableRect.tableStart, tableRect.tableStart + tableRect.table.content.size, newRowsSlice);
    newTr.setSelection(Selection.near(newTr.doc.resolve(selPos), 1));

    if(tr) {
        return newTr;
    }

    view.dispatch(newTr)  
    view.focus()   
}

export const switchCellsInRow = (row, originIndex, insertIndex) => {
    const cellsSlice = row.content.content.slice();
    const [movedCell] = cellsSlice.splice(originIndex, 1);

    cellsSlice.splice(insertIndex, 0, movedCell)

    const newRow = row.type.createAndFill({}, cellsSlice);

    return newRow;
}