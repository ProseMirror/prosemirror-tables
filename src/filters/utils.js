import {PluginKey} from 'prosemirror-state';
import {columnTypesMap, types} from '../columnsTypes/types.config';
import {getColIndex} from '../util';

export const tableFiltersMenuKey = new PluginKey('TableFiltersMenu');

export const generateMenuPopup = () => {
  const menuElement = document.createElement('div');
  menuElement.className = `table-filters-menu`;
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

export const calculateMenuPosition = (menuDOM, {dom: tableDOM}) => {
  const {style} = menuDOM;
  const {left, height: cellHeight, top} = tableDOM.getBoundingClientRect();

  if (left === 0 || top === 0 || cellHeight === 0) return;

  // scroll offset
  const [scrolledEl] = document.getElementsByClassName('czi-editor-frame-body');
  const {x: EDITOR_LEFT_OFFSET, y: EDITOR_TOP_OFFSET} =
    scrolledEl.getBoundingClientRect();

  style.top = `${top - EDITOR_TOP_OFFSET + (scrolledEl.scrollTop || 0) + 8}px`;
  style.left = `${left - EDITOR_LEFT_OFFSET + 8}px`;
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

const filterColumn = (
  tableRows,
  colIndex,
  colType,
  filter,
  filterGroupIndex
) => {
  if (colIndex === null) return;
  const colCells = tableRows.map((row) => row.node.child(colIndex));

  const filterConfig = colType.filters.find(
    (filterConfig) => filterConfig.id === filter.filterId
  );

  if (!filterConfig) return;
  const filterLogic = filterConfig.logic;

  colCells.forEach((cell, rowIndex) => {
    if (!tableRows[rowIndex].hidden[filterGroupIndex]) {
      tableRows[rowIndex].hidden[filterGroupIndex] = false;
    }
    if (!filterLogic(cell, filter.filterValue)) {
      tableRows[rowIndex].hidden[filterGroupIndex] = true;
    }
  });
};

const checkIfFilterMatchColType = (headers, headerId, filterId) => {
  const filterHeaderNode = headers.find(
    (header) => header.attrs.id === headerId
  );
  if (!filterHeaderNode) return false;
  const filterColType = columnTypesMap[filterHeaderNode.attrs.type];

  return filterColType.filters.map((filter) => filter.id).includes(filterId);
};

export const executeFilters = (table, tablePos, state, filters) => {
  const tableFilterGroups = filters || table.attrs.filters;

  const headersRow = table.firstChild;
  const tableRows = [];

  // get all rows and their pos
  table.descendants((node, pos, parent) => {
    if (parent.type.name !== 'table') return false; // go over the rows only and not their content
    tableRows.push({node, pos: pos + tablePos, hidden: []});
    return false;
  });

  tableRows.splice(0, 1); // remove headers row

  const tableHeaders = {};
  // get all headers and their position
  headersRow.descendants((header, pos, parent) => {
    if (parent.type.name !== 'table_row') return false; // go over the headers only and not their content
    const colType = columnTypesMap[header.attrs.type];
    const colIndex = getColIndex(state, pos + tablePos + 1);
    tableHeaders[header.attrs.id] = {colType, colIndex};
    return false;
  });

  // apply filters on each column
  tableFilterGroups.forEach((filterGroup, groupIndex) => {
    filterGroup.forEach((filter) => {
      const {colType, colIndex} = tableHeaders[filter.headerId];
      filterColumn(tableRows, colIndex, colType, filter, groupIndex);
    });
  });

  // check OR condition between filterGroups
  tableRows.forEach((row) => {
    row.hidden = row.hidden.length
      ? row.hidden.every((groupResult) => !!groupResult)
      : false;
  });

  const {tr} = state;

  tableRows.forEach((row) => {
    tr.setNodeMarkup(row.pos, undefined, {hidden: !!row.hidden});
  });

  // update table attrs with new filters
  if (filters) {
    tr.setNodeMarkup(tablePos - 1, undefined, {
      ...table.attrs,
      filters: tableFilterGroups,
    });
  } else {
    const headers = headersRow.content.content;

    // delete all filters that dont have matching column + remove empty groups
    const relevantFilters = tableFilterGroups
      .map((filterGroup) =>
        filterGroup.filter((filter) => {
          const hasMatchingCol = headers
            .map((header) => header.attrs.id)
            .includes(filter.headerId);

          if (!hasMatchingCol) return false;

          const matchToColType = checkIfFilterMatchColType(
            headers,
            filter.headerId,
            filter.filterId
          );
          return hasMatchingCol && matchToColType;
        })
      )
      .filter((filterGroup) => filterGroup.length);

    tr.setNodeMarkup(tablePos - 1, undefined, {
      ...table.attrs,
      filters: relevantFilters,
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
