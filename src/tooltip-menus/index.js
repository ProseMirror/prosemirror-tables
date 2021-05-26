import { Plugin, PluginKey } from "prosemirror-state";
import TablePopUpMenuView from "./menu-view"
import { popUpItems } from "./items";


export const tablePopUpMenuKey = new PluginKey("tablePopUpMenu");

const tablePopUpMenu = () => {
    return new Plugin({
        key: tablePopUpMenuKey,
        view(view) {
            const menuView = new TablePopUpMenuView(popUpItems, view)

            return menuView;
        }
    })
}

export default tablePopUpMenu;