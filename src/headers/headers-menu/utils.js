import {CellSelection} from '../../cellselection';
import {createElementWithClass} from '../..//util';
import {tableHeadersMenuKey} from '../../columnsTypes/types.config';

export const EDITOR_LEFT_OFFSET = 224;
export const EDITOR_TOP_OFFSET = 110;

export function enableDeleteItem(view) {
  const {selection: sel} = view.state;

  if (!(sel instanceof CellSelection)) return false;

  return sel.isColSelection() || sel.isRowSelection();
}

export const generateMenuPopup = () => {
  const menuElement = document.createElement('div');
  menuElement.className = `headersMenu`;
  menuElement.dataset.test = `headers-menu`;
  menuElement.style.display = 'none';
  menuElement.style.position = 'absolute';
  menuElement.style.zIndex = '200';

  return menuElement;
};

export const generateColorItemDOM = (color) => {
  const container = createElementWithClass('div', 'colorItemContainer');
  const button = createElementWithClass(
    color === 'transparent' ? 'span' : 'button',
    'colorItemButton'
  );
  const indicator = createElementWithClass('div', 'colorItemIndicator');

  button.style.backgroundColor = color;
  button.dataset.test = `color-button`;

  if (color === 'transparent') button.classList.add('default');

  indicator.style.backgroundColor = color;
  indicator.style.display = 'none';

  container.appendChild(button);
  container.appendChild(indicator);

  return container;
};

export const displayPopup = (view, popupDOM) => {
  const menuData = tableHeadersMenuKey.getState(view.state);

  if (menuData) {
    popupDOM.style.display = 'flex';
    return menuData;
  }

  return null;
};

export const calculateMenuPosition = (menuDOM, {node, dom: headerDOM, pos}) => {
  const {style} = menuDOM;

  const {left, top, width: headerWidth} = headerDOM.getBoundingClientRect();
  const {width: menuWidth} = menuDOM.getBoundingClientRect();

  const [scrolledEl] = document.getElementsByClassName('czi-editor-frame-body');

  const leftOffset = (headerWidth - menuWidth) / 2;

  style.top = `${top - EDITOR_TOP_OFFSET + (scrolledEl.scrollTop || 0)}px`;
  style.left = `${left - EDITOR_LEFT_OFFSET + leftOffset}px`;
};

export const getCellsBackgroundColor = (view) => {
  const {selection} = view.state;
  if (!(selection instanceof CellSelection)) return null;
  let color = null;

  selection.forEachCell((cell, pos) => {
    const {background} = cell.attrs;
    if (!color) {
      color = background;
    }
    if (background !== color) {
      color = 'transparent';
    }
  });

  return color;
};

export const isFirstRowSelected = (view) => {
  const {selection: sel} = view.state;
  if (!(sel instanceof CellSelection)) return false;

  let onlyFirstRow = true;

  sel.forEachCell((cell, pos) => {
    const resolvePos = view.state.doc.resolve(pos);
    const rowStart = pos - resolvePos.parentOffset - 1;
    const rowResolvedPos = view.state.doc.resolve(rowStart);

    onlyFirstRow = rowResolvedPos.parentOffset === 0 && onlyFirstRow;
  });

  return onlyFirstRow;
};

export const enableCellsColor = (view) => {
  const {selection: sel} = view.state;
  if (!(sel instanceof CellSelection)) return false;
  const tableAttrs = sel.$anchorCell.node(1).attrs;

  if (isFirstRowSelected(view)) return !tableAttrs.headers;

  return true;
};

export const addTooltips = (popupDOM, classes) => {
  classes.forEach(({className, text}) => {
    const [button] = popupDOM.getElementsByClassName(className);
    const buttonContainer = button.parentElement;
    const tooltip = createElementWithClass('span', 'popup-tooltip');
    tooltip.innerText = text;
    buttonContainer.appendChild(tooltip);
  });
};
