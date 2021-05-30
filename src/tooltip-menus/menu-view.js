import { generateMenuPopup, displayPopup, calculatePopupPosition } from "./utils";
import { renderGrouped } from "prosemirror-menu";
class TablePopUpMenuView {
    constructor(items, view) {
        this.view= view;
        this.items = items;
        this.popUpDOM = generateMenuPopup();

        // the dom element that contains the popup - should be css relative
        this.popUpRelativeContainer = document.getElementsByClassName("czi-editor-frame-body")[0];

        // append popup to dom
        this.popUpRelativeContainer.appendChild(this.popUpDOM);

        // add event listeners to color in red before deleting rows/cols
        this.popUpDOM.addEventListener("mouseover", (e) => {
            if(e.target.className !== "deleteMenuButton") return;

            const [ tableWrapper ] = document.getElementsByClassName("tableFocus");
            tableWrapper.classList.add("markDeleteCells");
        })

        this.popUpDOM.addEventListener("mouseout", (e) => {
            if(e.target.className !== "deleteMenuButton") return;

            const [ tableWrapper ] = document.getElementsByClassName("tableFocus");
            tableWrapper.classList.remove("markDeleteCells");
        })
        
        // render prosemirror menu to popUpDom
        const { dom: itemsDOM, update: updateMenuItems } = renderGrouped(this.view, this.items(this.popUpDOM));
        if (itemsDOM) this.popUpDOM.appendChild(itemsDOM);

        // method to update menu items on view update
        this.updateMenuItems = updateMenuItems;

        // handle menu closing
        this.view.dom.addEventListener("click", () => this.popUpDOM.style.display = "none");

        // disable menu update while selecting
        this.duringSelection = false;
        this.view.dom.addEventListener("mousedown", () => {
            this.duringSelection = true
        });
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
        calculatePopupPosition(view, this.popUpDOM);

        return;
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
        // handle menu closing
        this.view.dom.removeEventListener("click", () => this.popUpDOM.style.display = "none");

        // disable menu update while selecting
        this.duringSelection = false;
        this.view.dom.removeEventListener("mousedown", () => {
            this.duringSelection = true
        });
        this.view.dom.removeEventListener("mouseup", () => {
            setTimeout(() => {
                this.duringSelection = false;
                this.updateMenu(this.view);
            }, 250)
        })
    }
}

export default TablePopUpMenuView;