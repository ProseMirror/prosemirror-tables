import { CellSelection } from "../cellselection";

const EDITOR_LEFT_OFFSET = 220;
const EDITOR_TOP_OFFSET = 170;

export const enableDeleteItem = (view) => {
    const { selection: sel } = view.state;

    if(!(sel instanceof CellSelection)) return false;

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

export const generateMenuItemDOM = (type, className, text) => {
    const item = document.createElement(type);
    item.classList.add(className);

    if(text) item.innerText = text

    return item;
}

export const displayPopup = (view, popupDOM) => {
    // if current selection is not CellSelection don't show menu
    if (!(view.state.selection instanceof CellSelection)) {
        popupDOM.style.display = "none";
        return false;
    }

    popupDOM.style.display = "flex";

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
    const selectedCells = document.getElementsByClassName("selectedCell");

    const firstCellRect = selectedCells[0].getBoundingClientRect();
    let lastCellRect;

    if (state.selection.$anchorCell.pos === state.selection.$headCell.pos) {
      lastCellRect = firstCellRect;
    } else {
      lastCellRect = selectedCells[
        selectedCells.length - 1
      ].getBoundingClientRect();
    }

    // half the width of the menu
    const box = popupDOM.getBoundingClientRect();
    const menuHalf = box.width / 2;

    // scroll offset
    const offsetParentBox = popupDOM.offsetParent.getBoundingClientRect();

    popupDOM.style.left = `${
      firstCellRect.left +
      (lastCellRect.right - firstCellRect.left) / 2 -
      menuHalf - EDITOR_LEFT_OFFSET}px`;
    popupDOM.style.top = `${
      lastCellRect.bottom + 5 - (offsetParentBox.top || 0)
    }px`;

    if (
      state.selection instanceof CellSelection &&
      state.selection.isColSelection()
    ) {
      const { top } = view.coordsAtPos(state.selection.$anchorCell.pos);
      popupDOM.style.top = `${top + 5 - (offsetParentBox.top || 0)}px`;
    }

    if (
      state.selection instanceof CellSelection &&
      state.selection.isRowSelection()
    ) {
      let tableContainer = selectedCells[0];

      while (!tableContainer.classList.contains("tableWrapper")) {
        if (tableContainer.parentElement) {
          tableContainer = tableContainer.parentElement;
        } else {
          return;
        }
      }

      const tableContainerBox = tableContainer.getBoundingClientRect();
      popupDOM.style.left = `${
        tableContainerBox.left +
        tableContainerBox.width / 2 -
        menuHalf - EDITOR_LEFT_OFFSET}px`;
    }
}
