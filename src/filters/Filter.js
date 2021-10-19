import {types} from '../columnsTypes/types.config';

class Filter {
  constructor(table, {colIndex, filterId, filterValue}) {
    this.table = table; // the table the Filter applies on
    this.colIndex = colIndex; // the index of the column the Filters applies on.
    this.filterId = filterId; // the label of the Filter ('greater than', '<', 'equals' ....)
    this.filterValue = filterValue; // the value of the Filter.

    this.colType = this.getColTypeConfig(); // the type of the column the Filters applies on.
  }

  getColsOptions() {
    const headersRow = this.table.firstChild;
    const headers = headersRow.content.content.map((headerNode, index) => {
      return {
        label: headerNode.textContent.length
          ? headerNode.textContent
          : 'Untitled',
        value: index,
        className: `colItem ${headerNode.attrs.type}Type`,
        onSelect: () => {},
      };
    });
    return headers;
  }

  getColTypeConfig() {
    const colType = this.table.firstChild.child(this.colIndex).attrs.type;
    return types.find((typeConfig) => typeConfig.id === colType);
  }

  getLogicOptions() {
    const colTypeConfig = this.getColTypeConfig();

    return colTypeConfig.filters.map((filterConfig) => ({
      value: filterConfig.id,
      label: filterConfig.label,
      onSelect: () => {},
      className: `logicItem`,
    }));
  }

  getFilterLogic() {
    const filterConfig = this.getFilterConfig();
    return filterConfig.logic;
  }

  getFilterConfig() {
    const config = this.colType.filters.find(
      (filterConfig) => filterConfig.id === this.filterId
    );

    return config;
  }

  // serialize the filter to be saved in the node attrs
  toAttrsValue() {
    return {
      colIndex: this.colIndex,
      filterId: this.filterId,
      filterValue: this.filterValue,
    };
  }

  setColIndex(index) {
    this.colIndex = index;
    this.colType = this.getColTypeConfig();
  }

  setFilterId(id) {
    this.filterId = id;
  }

  setFilterValue(value) {
    this.filterValue = value;
  }

  // should return true if the filter should have dropdown to choose value
  valueIsDropdown() {
    return false;
  }

  noValue() {
    const filterConfig = this.getFilterConfig();
    return filterConfig.defaultValue === null;
  }

  getDefaultValue() {
    const filterConfig = this.getFilterConfig();
    return filterConfig.defaultValue;
  }

  // exec() {}
}

export default Filter;
