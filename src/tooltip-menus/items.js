import {Dropdown, MenuItem} from 'prosemirror-menu';
import {
  enableDeleteItem,
  generateColorItemDOM,
  getCellsBackgroundColor,
  isFirstRowSelected,
  enableCellsColor,
} from './utils';
import {changeCellsBackgroundColor, toggleTableHeaders} from './commands';
import {createElementWithClass} from '../util';
import {getDeleteCommand} from '../input';

const toggleHeader = () => {
  return new MenuItem({
    class: 'tablePopUpMenuItem',
    icon: {
      dom: createElementWithClass(
        'span',
        'toggleTableHeaderButton',
        'toggle-header'
      ),
    },
    select(view) {
      return isFirstRowSelected(view);
    },
    enable(view) {
      return isFirstRowSelected(view);
    },
    run(state, dispatch, view) {
      toggleTableHeaders(state, dispatch, view);
    },
  });
};

const deleteMenuItem = () => {
  return new MenuItem({
    class: 'tablePopUpMenuItem',
    icon: {
      dom: createElementWithClass('span', 'deleteMenuButton', 'table-delete'),
    },
    select(view) {
      return enableDeleteItem(view);
    },
    enable(view) {
      return enableDeleteItem(view);
    },
    run(state, dispatch) {
      const command = getDeleteCommand(state);
      command(state, dispatch);
    },
  });
};

const colors = [
  'rgb(255, 191, 181)',
  'rgb(247, 204, 98)',
  'rgb(181, 220, 175)',
  'rgb(214, 232, 250)',
  'rgb(216, 195, 255)',
  'transparent',
];

const cellBackgroundColorItem = (color) => {
  return new MenuItem({
    class: 'CellColorItem',
    icon: {
      dom: generateColorItemDOM(color),
    },
    active(view) {
      return getCellsBackgroundColor(view) === color;
    },
    select(view) {
      return enableCellsColor(view);
    },
    enable() {
      return true;
    },
    run(state, dispatch, view) {
      if (getCellsBackgroundColor(view) !== color || color === 'transparent') {
        changeCellsBackgroundColor(state, dispatch, color);
      }
    },
  });
};

const cellBackgroundColorDropDown = () => {
  return new Dropdown(
    colors.map((color) => cellBackgroundColorItem(color)),
    {
      class: 'cellColorDropDown',
    }
  );
};

export const popUpItems = [
  [toggleHeader()],
  [cellBackgroundColorDropDown()],
  [deleteMenuItem()],
];

export const tooltips = [
  {
    className: 'toggleTableHeaderButton',
    text: 'Toggle Headers',
  },
  {
    className: 'deleteMenuButton',
    text: 'Delete Selection',
  },
  {
    className: 'cellColorDropDown',
    text: 'Color Selection',
  },
];
