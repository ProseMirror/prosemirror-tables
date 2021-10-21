import React, {useEffect, useState} from 'react';
import Filter from './Filter';
import {createDefaultFilter, getColsOptions, updateTableFilters} from './utils';
import SelectDropDown from './DropDown.jsx';
import useClickOutside from '../useClickOutside.jsx';

const FilterRule = ({onFilterChange, filterHandler, colsDropdownOptions}) => {
  return (
    <div className="filter-container">
      <div className="column-chooser">
        <SelectDropDown
          className="filter-columns-dropdown"
          initialValue={filterHandler.headerId}
          items={colsDropdownOptions}
          onValueChange={(headerId) => onFilterChange({...filterHandler.toAttrsValue(), headerId})}
        />
      </div>
      <div className="rule-chooser">
        <SelectDropDown
          className="filter-logics-dropdown"
          initialValue={filterHandler.filterId}
          items={filterHandler.getLogicOptions()}
          onValueChange={(filterId) => onFilterChange({...filterHandler.toAttrsValue(), filterId})}
        />
      </div>
      <div className="value-chooser">
        {filterHandler.valueIsDropdown() ? (
          <SelectDropDown
            className="filter-value-dropdown"
            initialValue={filterHandler.getDefaultValue()}
            items={filterHandler.getValuesOptions()}
            onValueChange={(filterValue) => onFilterChange({...filterHandler.toAttrsValue(), filterValue})}
          />
        ) : filterHandler.noValue() ? (
          <></>
        ) : (
          <input
            className="filter-value-input"
            defaultValue={filterHandler.getDefaultValue()}
            onChange={(e) => onFilterChange({...filterHandler.toAttrsValue(), filterValue: e.target.value})}
          ></input>
        )}
      </div>

      <button className="remove-rule-button">X</button>
    </div>
  );
};

export const TableFiltersComponent = ({table, pos, dom, view}) => {
  const [filters, setFilters] = useState(table.attrs.filters || []);

  const addFilter = () => {
    const defaultFilter = createDefaultFilter(table);
    setFilters((oldFilters) => [...oldFilters, defaultFilter]);
  };

  const createFilterSetter = (filterIndex) => (newFilter) => {
    setFilters((oldFilters) => {
      const newFilters = oldFilters.slice()
      newFilters[filterIndex] = newFilter;

      return newFilters
    })

    // update table filter
    updateTableFilters(table, pos, view, newFilter, filterIndex)

    // apply all filters
    //TODO: add execute
  }

  return (
    <div className="table-filters-container">
      <div className="active-filters">
        {filters.length ? (
          <>
            Where
            {filters.map((filterConfig, index) => {
              const FilterHandler = new Filter(table, filterConfig);
              return <FilterRule 
                filterHandler={FilterHandler} 
                key={index} 
                onFilterChange={createFilterSetter(index)}
                colsDropdownOptions={getColsOptions(table)}
              />;
            })}
          </>
        ) : (
          <>No Filters Selected</>
        )}
      </div>
      <button className="add-filters-button" onClick={addFilter}>
        + Add Filter
      </button>
      <button className="apply-rules-button">Apply Rules</button>
    </div>
  );
};
