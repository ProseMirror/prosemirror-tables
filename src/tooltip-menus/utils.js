import { CellSelection } from "../cellselection";

export const enableDeleteItem = (view) => {
    const { selection: sel } = view.state;

    console.log(sel);

    if(!(sel instanceof CellSelection)) return false;
    console.log(sel.isColSelection() || sel.isRowSelection(), sel);
    return sel.isColSelection() || sel.isRowSelection()
}

export const generateMenuPopup = (menuType) => {
    const menuElement = document.createElement("div");
    menuElement.className = `${menuType}Popup`;
    menuElement.dataset.test = `${menuType}-popup`;
    menuElement.style.display = "none";
    menuElement.style.position = "absolute";
    menuElement.style.zIndex = "200"

    return menuElement;
};

export const displayPopup = (view, popupDOM) => {
    // if current selection is not CellSelection don't show menu
    if (!(view.state.selection instanceof CellSelection)) {
        popupDOM.style.display = "none";
        return false;
    }

    popupDOM.style.display = "block";

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
    const { selection: sel } = view.state;

    if(!(sel instanceof CellSelection)) return;

    let selectionRect;

    if(sel.isRowSelection()) {
        selectionRect = getRowsRect(view, sel)
    }
    // if(sel.isColSelection()) {

    // }

    const popupRect = popupDOM.getBoundingClientRect();

    return {
        left: selectionRect.left - ((popupRect.width || 0) / 2),
        top: selectionRect.top
    }
}

const getRowsRect = (view, selection) => {
    const {top, left} = view.coordsAtPos(selection.$anchorCell.pos);
    console.log(top, left);

    return {
        top,
        left
    }
}