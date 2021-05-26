import { generateMenuPopup, displayPopup, calculatePopupPosition } from "./utils";
import { renderGrouped } from "prosemirror-menu";
class TablePopUpMenuView {
    constructor(items, view) {
        this.view= view;
        this.items = items;
        this.popUpDOM = generateMenuPopup()

        // the dom element that contains the popup - should be css relative
        this.popUpRelativeContainer = document.getElementsByClassName("czi-editor-frame-body")[0];

        // render prosemirror menu to popUpDom
        const { dom: itemsDOM, update: updateMenuItems } = renderGrouped(this.view, this.items);

        // method to update menu items on view update
        this.updateMenuItems = updateMenuItems;

        // append popup to dom
        if (itemsDOM) this.popUpDOM.appendChild(itemsDOM);
        this.popUpRelativeContainer.appendChild(this.popUpDOM);

        // handle menu closing
        this.view.dom.addEventListener("click", () => this.popUpDOM.style.display = "none");

        // disable menu update while selecting
        this.duringSelection = false;
        this.view.dom.addEventListener("mousedown", () => this.duringSelection = true);
        this.view.dom.addEventListener("mouseup", () => {
            setTimeout(() => {
                this.duringSelection = false;
                this.updateMenu(this.view);
            }, 250)
        })
    }

    updateMenu(view) {
        // determine whether to display or hide popup - and change style accordingly
        if(!displayPopup(view, this.popUpDOM)) return;

        // Update the Content state before calculating the position
        this.updateMenuItems(view);

        // find popup position
        const rect = calculatePopupPosition(view, this.popUpDOM);

        return
    }

    update(view) {
        const { state, readOnly } = view;
        if (!state || readOnly || state.selection.empty) {
            if (this.popUpDOM.style.display !== "none") {
                this.popUpDOM.style.display = "none";
            }
        }
        if (!this.duringSelection) {
            this.updateMenu(view);
        }
    }

    destroy() {
        console.log("destroy");
    }
}

export default TablePopUpMenuView;