import { Dropdown, MenuItem } from "prosemirror-menu";
import { enableDeleteItem,
    createElementWithClass,
    generateColorItemDOM,
    getCellsBackgroundColor,
 } from "./utils";
import { getDeleteCommand, changeCellsBackgroundColor } from "./commands";

export const deleteMenuItem = () => {
  return new MenuItem({
    class: "tablePopUpMenuItem",
    icon: {
        dom: createElementWithClass("span", "deleteMenuButton"),
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
  "rgb(255, 191, 181)",
  "rgb(247, 204, 98)",
  "rgb(181, 220, 175)",
  "rgb(214, 232, 250)",
  "rgb(216, 195, 255)",
  "transparent"
]

const cellBackgroundColorItem = (color) => {
  return new MenuItem({
    class: "CellColorItem",
    icon: {
       dom: generateColorItemDOM(color),
    },
    active(view){
      return getCellsBackgroundColor(view) === color
    },
    select() {
      return true;
    },
    enable(view) {
      return true;
    },
    run(state, dispatch, view) {
      if(getCellsBackgroundColor(view) !== color) {
        changeCellsBackgroundColor(state, dispatch, color);
      }
    },
  })
}

export const cellBackgroundColorDropDown = () => {
  return new Dropdown(
      colors.map(color => cellBackgroundColorItem(color)),
    {
      class: "cellColorDropDown"
    }
  )
}

export const popUpItems = [
  [cellBackgroundColorDropDown()],
  [deleteMenuItem()]
]