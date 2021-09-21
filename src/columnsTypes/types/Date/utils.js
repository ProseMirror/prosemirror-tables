import {PluginKey} from 'prosemirror-state';
import {
  EDITOR_LEFT_OFFSET,
  EDITOR_TOP_OFFSET,
} from '../../../headers/headers-menu/utils';

export const DATE_FORMAT = 'dd/mm/yy';
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

  if (left === 0 || top === 0 || cellHeight === 0) return;

  const [scrolledEl] = document.getElementsByClassName('czi-editor-frame-body');

  style.top = `${
    top - EDITOR_TOP_OFFSET + (scrolledEl.scrollTop || 0) - 15 + cellHeight
  }px`;
  style.left = `${left - EDITOR_LEFT_OFFSET - 20}px`;
};

export const formatDate = (date, format) => {
  let formattedDate = format;

  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  const day = date.getUTCDate();

  formattedDate = formattedDate.replace('dd', day.toString().padStart(2, '0'));
  formattedDate = formattedDate.replace(
    'mm',
    month.toString().padStart(2, '0')
  );
  formattedDate = formattedDate.replace('yy', year.toString());

  return formattedDate;
};
