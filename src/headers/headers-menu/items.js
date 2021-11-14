import {MenuItem} from '../../menuItems/MenuItem';
import {
  sortColumn,
  addColAfterButton,
  addColBeforeButton,
} from '../../commands';
import {HoverDropdown} from '../../menuItems/Dropdown';
import {createElementWithClass, getColIndex} from '../../util';
import {getTypesItems} from '../../columnsTypes/typesMenuItems';
import {tableHeadersMenuKey} from '../../columnsTypes/types.config';
import {deleteColAtPos} from '../../commands';
import {tableFiltersMenuKey} from '../../filters/utils';

const createMenuItemWithIcon = (className, label, iconClassName) => {
  const item = createElementWithClass('div', className);
  item.innerText = label;
  const icon = createElementWithClass('div', iconClassName);

  item.prepend(icon);

  return item;
};

export const dropdownClassName = 'columnTypeDropdown';

const columnTypesItems = getTypesItems();

const columnTypeDropdown = () => {
  return new HoverDropdown(columnTypesItems, {
    class: dropdownClassName,
    dataTest: 'column-type-dropdown',
  });
};

const sortItem = (direction) => {
  return new MenuItem({
    render() {
      const className = `sort-${direction === 1 ? 'down' : 'up'}`;
      return createMenuItemWithIcon(
        className + ' menuItem',
        `Sort ${direction === 1 ? 'A > Z' : 'Z > A'}`,
        className + '-icon  menuIcon'
      );
    },
    run(state, dispatch, view) {
      const {pos} = tableHeadersMenuKey.getState(state);
      const colIndex = getColIndex(state, pos);
      sortColumn(view, colIndex, pos, direction);
    },
  });
};

const insertColumnItem = (direction) => {
  return new MenuItem({
    render() {
      const className = `insert-${direction === 1 ? 'right' : 'left'}`;
      return createMenuItemWithIcon(
        className + ' menuItem',
        `Insert ${direction === 1 ? 'Right' : 'Left'}`,
        className + '-icon  menuIcon'
      );
    },
    run(state, dispatch, view) {
      const command = direction === 1 ? addColAfterButton : addColBeforeButton;
      const {pos} = tableHeadersMenuKey.getState(state);
      command(view, pos);
    },
  });
};

const filterItem = () => {
  return new MenuItem({
    render() {
      return createMenuItemWithIcon(
        'filters-colum menuItem',
        `Add Filter`,
        'filters-colum-icon  menuIcon'
      );
    },
    run(state, dispatch, view) {
      const {pos} = tableHeadersMenuKey.getState(state);
      const {tr} = state;

      const resolvedPos = state.doc.resolve(pos);
      tr.setMeta(tableFiltersMenuKey, {
        action: 'open',
        dom: view.domAtPos(resolvedPos.start(-1)).node,
        node: resolvedPos.node(1),
        pos: resolvedPos.start(1),
        id: window.id,
        headerPos: pos,
      });
      tr.setMeta(tableHeadersMenuKey, {
        action: 'close',
        id: window.id,
      });

      dispatch(tr);
    },
  });
};

const deleteItem = () => {
  return new MenuItem({
    render() {
      return createMenuItemWithIcon(
        'delete-colum menuItem',
        `Delete Column`,
        'delete-colum-icon  menuIcon'
      );
    },
    run(state, dispatch, view) {
      const {pos} = tableHeadersMenuKey.getState(state);
      return deleteColAtPos(pos, view);
    },
  });
};

export const menuItems = [
  [columnTypeDropdown()],
  [
    filterItem(),
    sortItem(1),
    sortItem(-1),
    insertColumnItem(1),
    insertColumnItem(-1),
    deleteItem(),
  ],
];