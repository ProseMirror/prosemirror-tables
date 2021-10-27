import {PluginKey} from 'prosemirror-state';
import {columnTypesMap, types} from '../columnsTypes/types.config';
import {getColIndex} from '../util';

export const tableFiltersMenuKey = new PluginKey('TableFiltersMenu');

const CONCATENATION_DEFAULT_VALUE = 'and';

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

export const createDefaultFilter = (state, table, headerPos) => {
  const colHeader = headerPos
    ? table.firstChild.child(getColIndex(state, headerPos))
    : table.firstChild.firstChild;

  const {type: headerType} = colHeader.attrs;
  const typeConfig = types.find((type) => type.id === headerType);
  const typeFirstFilter = typeConfig.filters.find((filter) => filter.default);

  return {
    headerId: colHeader.attrs.id,
    filterId: typeFirstFilter.id,
    filterValue: typeFirstFilter.defaultValue,
    concatenationLogic: CONCATENATION_DEFAULT_VALUE,
  };
};

export const getColsOptions = (table) => {
  const headersRow = table.firstChild;
  const headers = headersRow.content.content.map((headerNode) => {
    return {
      label: headerNode.textContent.length
        ? headerNode.textContent
        : 'Untitled',
      value: headerNode.attrs.id,
      itemStyleClass: `colItem ${headerNode.attrs.type}Type`,
      hasIcon: true,
    };
  });
  return headers;
};

const filterColumn = (tableRows, colIndex, colType, filters) => {
  if (colIndex === null) return;
  const colCells = tableRows.map((row) => row.node.child(colIndex));

  filters.forEach((filter) => {
    const filterConfig = colType.filters.find(
      (filterConfig) => filterConfig.id === filter.filterId
    );

    if (!filterConfig) return;
    const filterLogic = filterConfig.logic;

    colCells.forEach((cell, rowIndex) => {
      if (!filterLogic(cell, filter.filterValue)) {
        tableRows[rowIndex].hidden = true;
      }
    });
  });
};

export const executeFilters = (table, tablePos, state, filters) => {
  const tableFilters = filters || table.attrs.filters;

  // order filters by columns
  const filtersByHeaderId = {};
  tableFilters.forEach((filter) => {
    if (!filtersByHeaderId[filter.headerId])
      filtersByHeaderId[filter.headerId] = [];
    filtersByHeaderId[filter.headerId].push(filter);
  });

  const headersRow = table.firstChild;
  const tableRows = [];

  // get all rows and their pos
  table.descendants((node, pos, parent) => {
    if (parent.type.name !== 'table') return false; // go over the rows only and not their content
    tableRows.push({node, pos: pos + tablePos, hidden: false});
    return false;
  });

  tableRows.splice(0, 1); // remove headers row

  // apply filters on each column
  headersRow.descendants((header, pos, parent) => {
    if (parent.type.name !== 'table_row') return false; // go over the headers only and not their content

    const colType = columnTypesMap[header.attrs.type];
    const colIndex = getColIndex(state, pos + tablePos + 1);

    if (Object.keys(filtersByHeaderId).includes(header.attrs.id)) {
      filterColumn(
        tableRows,
        colIndex,
        colType,
        filtersByHeaderId[header.attrs.id]
      );
    }
    return false;
  });

  const {tr} = state;

  tableRows.forEach((row) => {
    if (row.hidden) {
      tr.setNodeMarkup(row.pos, undefined, {hidden: true});
    } else {
      tr.setNodeMarkup(row.pos, undefined, {hidden: false});
    }
  });

  // update table attrs with new filters
  if (filters) {
    tr.setNodeMarkup(tablePos - 1, undefined, {
      ...table.attrs,
      filters: tableFilters,
    });
  }
  return tr;
};

const CONCATENATION_ITEMS = [
  {
    value: 'and',
    label: 'And',
  },
  {
    value: 'or',
    label: 'Or',
  },
];

export const getConcatenationItems = () => {
  return CONCATENATION_ITEMS;
};
