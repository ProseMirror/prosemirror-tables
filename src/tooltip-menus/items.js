import {Dropdown, MenuItem} from 'prosemirror-menu';
import {
  enableDeleteItem,
  generateColorItemDOM,
  getCellsBackgroundColor,
  isFirstRowSelected,
  enableCellsColor,
} from './utils';
import {
  getDeleteCommand,
  changeCellsBackgroundColor,
  toggleTableHeaders,
} from './commands';
import {createElementWithClass} from '../util';

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
    run(state, dispatch) {
      toggleTableHeaders(state, dispatch);
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
  // [toggleHeader()], // TODO: enable when we can the command will remove all type from the nodes
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
