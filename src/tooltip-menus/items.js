import { Dropdown, MenuItem } from "prosemirror-menu";
import { enableDeleteItem, generateMenuItemDOM } from "./utils";
import { getDeleteCommand, changeCellsBackgroundColor } from "./commands";

export const deleteMenuItem = () => {
  return new MenuItem({
    class: "tablePopUpMenuItem",
    icon: {
        dom: generateMenuItemDOM("button", "deleteMenuButton", "D"),
    },
    select(view) {
      return enableDeleteItem(view);
    },
    enable(view) {
      return enableDeleteItem(view);
    },
    run(state, dispatch) {
      const command = getDeleteCommand(state);
      command(state, dispatch)
    },
  });
}

const colors = [
  "black",
  "grey",
  "red",
  "blue",
  "green",
  "transparent"
]

const cellBackgroundColorItem = (color) => {
  return new MenuItem({
    class: "CellColorItem",
    icon: {
       dom: generateMenuItemDOM("button", "cellColorButton", color[0]),
    },
    select() {
      return true;
    },
    enable(view) {
      return true;
    },
    run(state, dispatch) {
      changeCellsBackgroundColor(state, dispatch, color);
    },
  })
}

export const cellBackgroundColorDropDown = () => {
  return new Dropdown(
      colors.map(color => cellBackgroundColorItem(color)),
    {
      label: "C",
      class: "cellColorDropDown"
    }
  )
}

export const popUpItems = [
  [cellBackgroundColorDropDown()],
  [deleteMenuItem()]
]