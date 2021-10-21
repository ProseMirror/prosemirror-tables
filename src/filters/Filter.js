import {columnTypesMap} from '../columnsTypes/types.config';

class Filter {
  constructor(table, {filterId, filterValue, headerId}) {
    this.table = table; // the table the Filter applies on
    this.filterId = filterId; // the label of the Filter ('greater than', '<', 'equals' ....)
    this.filterValue = filterValue; // the value of the Filter.
    this.headerId = headerId;

    this.colType = this.getColType(); // the type of the column the Filters applies on.
  }

  getColType() {
    const firstRowHeaders = this.table.firstChild.content.content;
    const header = firstRowHeaders.find((header) => header.attrs.id == this.headerId);
  
    return columnTypesMap[header.attrs.type]
  }

  getLogicOptions() {
    return this.colType.filters.map((filterConfig) => ({
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
      headerId: this.headerId,
      filterId: this.filterId,
      filterValue: this.filterValue,
    };
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
