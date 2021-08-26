import {Dropdown, MenuItem} from 'prosemirror-menu';
import {getTypesItems} from '../../columnsTypes/typesMenuItems';
import {
  sortColumn,
  addColAfterButton,
  addColBeforeButton,
} from '../../commands';
import {getColIndex} from '../../util';
import {tableHeadersMenuKey} from './index';

export const dropdownClassName = 'columnTypeDropdown';

const columnTypesItems = getTypesItems();

const columnTypeDropdown = () => {
  return new Dropdown(columnTypesItems, {
    class: dropdownClassName,
  });
};

const sortItem = (direction) => {
  return new MenuItem({
    label: `Sort ${direction === 1 ? 'A > Z' : 'Z > A'}`,
    run(state, dispatch, view) {
      const {pos} = tableHeadersMenuKey.getState(state);
      const colIndex = getColIndex(state, pos);
      sortColumn(view, colIndex, pos, direction);
    },
  });
};

const insertColumnItem = (direction) => {
  return new MenuItem({
    label: `Insert ${direction === 1 ? 'Right' : 'Left'}`,
    run(state, dispatch, view) {
      const command = direction === 1 ? addColAfterButton : addColBeforeButton;
      const {pos} = tableHeadersMenuKey.getState(state);
      command(view, pos);
    },
  });
};

const filterItem = () => {
  return new MenuItem({
    label: 'Add Filter',
  });
};

export const menuItems = [
  [columnTypeDropdown()],
  [
    sortItem(1),
    sortItem(-1),
    insertColumnItem(1),
    insertColumnItem(-1),
    filterItem(),
  ],
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
