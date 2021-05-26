import { Dropdown, MenuItem } from "prosemirror-menu";
import { enableDeleteItem } from "./utils";
import { getDeleteCommand } from "./commands";

export const deleteMenuItem = () => {
  return new MenuItem({
    class: "tablePopUpMenuItem",
    icon: {
        text: "T",
    },
    select(view) {
      console.log(enableDeleteItem(view), "enable");
      return enableDeleteItem(view);
    },
    run(state, dispatch) {
      const command = getDeleteCommand(state);
      command(state, dispatch)
    },
  });
}

export const popUpItems = [
  [deleteMenuItem()]
]