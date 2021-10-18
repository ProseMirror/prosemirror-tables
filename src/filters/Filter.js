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
    this.colType = types.find((typeConfig) => typeConfig.id === colType);
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
    const logic = this.colType.filters.find(
      (filterConfig) => filterConfig.id === this.filterId
    );

    return logic || (() => null);
  }

  updateFilterConfig({colIndex, filterId, filterValue}) {
    this.colIndex = colIndex;
    this.filterId = filterId;
    this.filterValue = filterValue;

    this.colType = this.getColTypeConfig();
  }

  toAttrsValue() {
    return {
      colIndex: this.colIndex,
      filterId: this.filterId,
      filterValue: this.filterValue,
    };
  }

  // exec() {}
}

export default Filter;
