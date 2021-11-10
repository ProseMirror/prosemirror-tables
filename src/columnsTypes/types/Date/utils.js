import dayjs from 'dayjs';
import {PluginKey} from 'prosemirror-state';

export let DATE_FORMAT = 'DD/MM/YYYY';
export const setDateFormat = (format) => (DATE_FORMAT = format);
export const tableDateMenuKey = new PluginKey('TableDateMenu');

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
  const {left, bottom, height: cellHeight, top} = cellDOM.getBoundingClientRect();

  if (left === 0 || bottom === 0 || cellHeight === 0 || top === 0) return;

  // scroll offset
  const [scrolledEl] = document.getElementsByClassName('czi-editor-frame-body');
  const {x: EDITOR_LEFT_OFFSET, y: EDITOR_TOP_OFFSET} =
    scrolledEl.getBoundingClientRect();
  let {height: menuHeight} = menuDOM.getBoundingClientRect();
  if(menuHeight === 0) menuHeight = 407;
  let topCord = bottom - EDITOR_TOP_OFFSET + (scrolledEl.scrollTop || 0) + 8

  if(topCord + menuHeight > window.innerHeight + (scrolledEl?.scrollTop || 0)){
    topCord = top - EDITOR_TOP_OFFSET + (scrolledEl.scrollTop || 0) - 8 -  menuHeight;
  }

  style.top = `${topCord}px`;
  style.left = `${left - EDITOR_LEFT_OFFSET - 8}px`;
};

export const formatDate = (date, format) => {
  let formattedDate = format;

  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  const day = date.getUTCDate();

  formattedDate = formattedDate.replace('DD', day.toString().padStart(2, '0'));
  formattedDate = formattedDate.replace(
    'MM',
    month.toString().padStart(2, '0')
  );
  formattedDate = formattedDate.replace('YYYY', year.toString());

  return formattedDate;
};

const breakTextContentBySeparators = (text) => text
    .split(/(\/|\.)/gi)
    .filter((char) => char !== '/' && char !== '.' && char.length);

export const buildDateObjectFromText = (text, format) => {
  const brokenFormat = format.split('/');
  const brokenContent = breakTextContentBySeparators(text)

  if (brokenContent.length < 3) return null;

  const date = new Date();

  const day = brokenContent[brokenFormat.indexOf('DD')]
    .toString()
    .padStart(2, '0');
  const month = (brokenContent[brokenFormat.indexOf('MM')] - 1)
    .toString()
    .padStart(2, '0');

  const year = brokenContent[brokenFormat.indexOf('YYYY')] || '';

  let fullYear;
  if (year.length > 3) {
    fullYear = year.slice(0, 4);
  } else if (year.length === 3) {
    fullYear = year.padStart(4, '2');
  } else {
    const decade =
      year.length > 1 ? year.slice(-2) : year.slice(-2).padStart(2, '0');

    fullYear = `20${decade}`;
  }

  date.setDate(day);
  date.setMonth(month);
  date.setFullYear(fullYear);

  return date;
};

export const getSelectedNode = () => {
  if (document.selection)
    return document.selection.createRange().parentElement();
  else {
    const selection = window.getSelection();
    if (selection.rangeCount > 0)
      return selection.getRangeAt(0).startContainer.parentNode;
  }
  return null;
};

export const getClosestDate = (textContent, format) => {
  const brokenContent = breakTextContentBySeparators(textContent);
  const currentDateBroken = formatDate(dayjs().toDate(), format).split('/');
  
  for (let i = 0; i < brokenContent.length; i++) {
    currentDateBroken[i] = brokenContent[i];
  }

  const dateFromTextContent = buildDateObjectFromText(currentDateBroken.join('/'), format);
  return dateFromTextContent;
}