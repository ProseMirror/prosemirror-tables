import { CellSelection } from "../cellselection";
import { createElementWithClass } from "../util";

const EDITOR_LEFT_OFFSET = 224;
const EDITOR_TOP_OFFSET = 130;

export const enableDeleteItem = (view) => {
  const { selection: sel } = view.state;

  if (!(sel instanceof CellSelection)) return false;

  return sel.isColSelection() || sel.isRowSelection()
}

export const generateMenuPopup = () => {
  const menuElement = document.createElement("div");
  menuElement.className = `tablePopup`;
  menuElement.dataset.test = `table-popup`;
  menuElement.style.display = "none";
  menuElement.style.position = "absolute";
  menuElement.style.zIndex = "200"

  return menuElement;
};

export const generateColorItemDOM = (color) => {
  const container = createElementWithClass("div", "colorItemContainer");
  const button = createElementWithClass(color === "transparent" ? "span" : "button", "colorItemButton");
  const indicator = createElementWithClass("div", "colorItemIndicator");

  button.style.backgroundColor = color;

  if(color === "transparent") button.classList.add("default")

  indicator.style.backgroundColor = color;
  indicator.style.display = "none";

  container.appendChild(button);
  container.appendChild(indicator);

  return container
}

export const displayPopup = (view, popupDOM) => {
  // if current selection is not CellSelection don't show menu
  if (!(view.state.selection instanceof CellSelection)) {
    popupDOM.style.display = "none";
    return false;
  }

  // if current selection is not row/col don't show menu
  if (!(view.state.selection.isColSelection()) && !(view.state.selection.isRowSelection())) {
    popupDOM.style.display = "none";
    return false;
  }
  
  popupDOM.style.display = "flex"
  
  // if the popup cant find his parent don't show him
  if (!popupDOM.offsetParent) {
    if (popupDOM.style.display !== "none") {
      popupDOM.style.display = "none";
    }
    return false;
  }

  return true
}

export const calculatePopupPosition = (view, popupDOM) => {
  const { state } = view;
  // get all selected cells dom
  const selectedCells = document.getElementsByClassName("selectedCell");

  // get rects of first and last cells
  const firstCellRect = selectedCells[0].getBoundingClientRect();
  let lastCellRect;

  if (state.selection.$anchorCell.pos === state.selection.$headCell.pos) {
    lastCellRect = firstCellRect;
  } else {
    lastCellRect = selectedCells[
      selectedCells.length - 1
    ].getBoundingClientRect();
  }

  const offsetParentBox = popupDOM.offsetParent.getBoundingClientRect();

  // scroll offset
  const [ scrolledEl ] = document.getElementsByClassName("czi-editor-frame-body")

  const cellCenter = firstCellRect.left + (lastCellRect.right - firstCellRect.left) / 2;

  // ColSelection
  if (
    state.selection instanceof CellSelection &&
    state.selection.isColSelection()
  ) {
      const { top } = view.coordsAtPos(state.selection.$anchorCell.pos);
      popupDOM.style.top = `${top - 40 - (offsetParentBox.top || 0) + (scrolledEl.scrollTop || 0)}px`;
      popupDOM.style.left = `${cellCenter - EDITOR_LEFT_OFFSET}px`;
  }

  // RowSelection
  if (
    state.selection instanceof CellSelection &&
    state.selection.isRowSelection()
  ) {
      let tableContainer = selectedCells[0];

    // find the dom of the table wrapper
    while (!tableContainer.classList.contains("tableFocus")) {
      if (tableContainer.parentElement) {
        tableContainer = tableContainer.parentElement;
      } else {
        return;
      }
    }

    const tableContainerBox = tableContainer.getBoundingClientRect();
    popupDOM.style.left = `${tableContainerBox.left + (tableContainerBox.width / 2) - EDITOR_LEFT_OFFSET}px`;
    popupDOM.style.top = `${lastCellRect.bottom + (scrolledEl.scrollTop || 0) - EDITOR_TOP_OFFSET}px`;
  }
}

export const getCellsBackgroundColor = (view) =>{
  const { selection } = view.state;
  if (!(selection instanceof CellSelection)) return null;
  let color = null;

  selection.forEachCell((cell, pos) => {
    const { background } = cell.attrs;
    if(!color) {
        color = background;
    } 
    if(background !== color) {
        color =  "transparent"
    }
  });

  return color
}

export const isFirstRowSelected = (view) => {
  const { selection: sel } = view.state;
  if(!(sel instanceof CellSelection)) return false;

  let onlyFirstRow = true;

  sel.forEachCell((cell, pos) => {
    const resolvePos = view.state.doc.resolve(pos);
    const rowStart = pos - resolvePos.parentOffset - 1;
    const rowResolvedPos = view.state.doc.resolve(rowStart);

    onlyFirstRow = rowResolvedPos.parentOffset === 0 && onlyFirstRow;
  })

  return onlyFirstRow;
}

export const enableCellsColor = (view) => {
  const { selection: sel } = view.state;
  if(!(sel instanceof CellSelection)) return false;
  const tableAttrs = sel.$anchorCell.node(1).attrs;

  if (isFirstRowSelected(view)) return !tableAttrs.headers

  return true
}