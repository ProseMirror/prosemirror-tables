import {PluginKey} from 'prosemirror-state';
import {types} from '../columnsTypes/types.config';
import Filter from './Filter';

export const tableFiltersMenuKey = new PluginKey('TableFiltersMenu');

export const generateMenuPopup = () => {
  const menuElement = document.createElement('div');
  menuElement.className = `tableFiltersMenu`;
  menuElement.dataset.test = `table-filters-menu`;
  menuElement.style.display = 'none';
  menuElement.style.position = 'absolute';
  menuElement.style.zIndex = '200';

  return menuElement;
};

export const displayPopup = (view, popupDOM) => {
  const menuData = tableFiltersMenuKey.getState(view.state);

  if (menuData) {
    popupDOM.style.display = 'flex';
    return menuData;
  }

  return null;
};

export const calculateMenuPosition = (menuDOM, {node, dom: tableDOM, pos}) => {
  const {style} = menuDOM;
  const {left, height: cellHeight, top} = tableDOM.getBoundingClientRect();

  if (left === 0 || top === 0 || cellHeight === 0) return;

  // scroll offset
  const [scrolledEl] = document.getElementsByClassName('czi-editor-frame-body');
  const {x: EDITOR_LEFT_OFFSET, y: EDITOR_TOP_OFFSET} =
    scrolledEl.getBoundingClientRect();

  style.top = `${top - EDITOR_TOP_OFFSET + (scrolledEl.scrollTop || 0) + 8}px`;
  style.left = `${left - EDITOR_LEFT_OFFSET - 8}px`;
};

export const createDefaultFilter = (table) => {
  const firstColHeader = table.firstChild.firstChild;
  
  const {type: headerType} = firstColHeader.attrs;
  const typeConfig = types.find((type) => type.id === headerType);
  const typeFirstFilter = typeConfig.filters.find((filter) => filter.default);
  
  return {
    colIndex: 0,
    filterId: typeFirstFilter.id,
    filterValue: typeFirstFilter.defaultValue,
  };
};


