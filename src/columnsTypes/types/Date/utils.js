import {PluginKey} from 'prosemirror-state';
import {
  EDITOR_LEFT_OFFSET,
  EDITOR_TOP_OFFSET,
} from '../../../headers/headers-menu/utils';

export const tableDateMenuKey = new PluginKey('TableLabelsMenu');

export const generateMenuPopup = () => {
  const menuElement = document.createElement('div');
  menuElement.className = `tableDateMenu`;
  menuElement.dataset.test = `table-date-menu`;
  menuElement.style.display = 'none';
  menuElement.style.position = 'absolute';
  menuElement.style.zIndex = '200';

  return menuElement;
};

export const displayPopup = (view, popupDOM) => {
  const menuData = tableDateMenuKey.getState(view.state);

  if (menuData) {
    popupDOM.style.display = 'flex';
    return menuData;
  }

  return null;
};

export const calculateMenuPosition = (menuDOM, {node, dom: cellDOM, pos}) => {
  const {style} = menuDOM;

  const {left, top, height: cellHeight} = cellDOM.getBoundingClientRect();

  const [scrolledEl] = document.getElementsByClassName('czi-editor-frame-body');

  style.top = `${
    top - EDITOR_TOP_OFFSET + (scrolledEl.scrollTop || 0) - 15 + cellHeight
  }px`;
  style.left = `${left - EDITOR_LEFT_OFFSET - 20}px`;
};
