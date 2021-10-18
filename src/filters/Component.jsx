import React, {useState} from 'react';
import Filter from './Filter';
import {createDefaultFilter, tableFiltersMenuKey} from './utils';
import SelectDropDown from './DropDown.jsx';
import useClickOutside from '../useClickOutside.jsx';

const FilterRule = ({setRule, filterHandler}) => {
  return (
    <div className="filter-container">
      <div className="column-chooser">
        <SelectDropDown
          className="filter-columns-dropdown"
          initialValue={filterHandler.colIndex}
          items={filterHandler.getColsOptions()}
          onValueChange={(value) => console.log(value)}
        />
      </div>
      <div className="rule-chooser">
        <SelectDropDown
          className="filter-logics-dropdown"
          initialValue={filterHandler.filterId}
          items={filterHandler.getLogicOptions()}
          onValueChange={(value) => console.log(value)}
        />
      </div>
      <div className="rule-value">
        <SelectDropDown
          className="filter-columns-dropdown"
          initialValue={filterHandler.colIndex}
          items={filterHandler.getColsOptions()}
          onValueChange={(value) => console.log(value)}
        />
      </div>
      <button className="remove-rule-button"></button>
    </div>
  );
};

export const TableFiltersComponent = ({table, pos, dom, view}) => {
  const [filters, setFilters] = useState(table.attrs.filters || []);

  const addFilter = () => {
    const defaultFilter = createDefaultFilter(view, table);
    setFilters((oldFilters) => [...oldFilters, defaultFilter]);
  };

  // const ref = useClickOutside(() => {
  //   const {tr} = view.state;
  //   tr.setMeta(tableFiltersMenuKey, {
  //     action: 'close',
  //     id: window.id,
  //   });

  //   view.dispatch(tr);
  // });

  const handleFilterChange = () => {};

  return (
    <div className="table-filters-container">
      <div className="active-filters">
        {filters.length ? (
          <>
            Where
            {filters.map((filterConfig, index) => {
              const FilterHandler = new Filter(table, filterConfig);
              return (
                <FilterRule
                  filterHandler={FilterHandler}
                  key={index}
                  setRule={handleFilterChange}
                />
              );
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
