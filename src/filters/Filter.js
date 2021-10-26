import {columnTypesMap} from '../columnsTypes/types.config';

class Filter {
  constructor(
    view,
    table,
    {filterId, filterValue, headerId, concatenationLogic}
  ) {
    this.view = view; // the editor view
    this.table = table; // the table the Filter applies on
    this.filterId = filterId; // the label of the Filter ('greater than', '<', 'equals' ....)
    this.filterValue = filterValue; // the value of the Filter.
    this.headerId = headerId;
    this.concatenationLogic = concatenationLogic;

    this.colType = this.getColType(); // the type of the column the Filters applies on.
  }

  getColType() {
    const firstRowHeaders = this.table.firstChild.content.content;
    const header = firstRowHeaders.find(
      (header) => header.attrs.id == this.headerId
    );

    return columnTypesMap[header.attrs.type];
  }

  getLogicOptions() {
    return this.colType.filters.map((filterConfig) => ({
      value: filterConfig.id,
      label: filterConfig.label,
      className: `logicItem`,
    }));
  }

  getLogicId() {
    const filterConfig = this.colType.filters.find(
      (filterConfig) => filterConfig.id === this.filterId
    );

    if (filterConfig) {
      return this.filterId;
    } else {
      // if the column type dont have the filterId, get the type default filter and set the value to the default value
      return this.getDefaultFilterIdAndSetDefaultValue();
    }
  }

  getDefaultFilterIdAndSetDefaultValue() {
    const defaultFilter = this.colType.filters.find((filter) => filter.default);
    this.filterValue = defaultFilter.defaultValue;
    return defaultFilter.id;
  }

  getFilterLogic() {
    const filterConfig = this.getFilterConfig();
    return filterConfig.logic;
  }

  getFilterConfig() {
    const config = this.colType.filters.find(
      (filterConfig) => filterConfig.id === this.getLogicId()
    );

    return config;
  }

  // serialize the filter to be saved in the node attrs
  toAttrsValue() {
    return {
      headerId: this.headerId,
      filterId: this.getLogicId(),
      filterValue: this.filterValue,
      concatenationLogic: this.concatenationLogic,
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
    return this.filterValue || filterConfig.defaultValue;
  }

  getInputType() {
    const filterConfig = this.getFilterConfig();
    return filterConfig.inputType;
  }

  getDropdownInputItems() {
    const filterConfig = this.getFilterConfig();
    return filterConfig.inputDropdownItems
      ? filterConfig.inputDropdownItems(this.table) || []
      : [];
  }
}

export default Filter;
