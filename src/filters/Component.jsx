import React, {useState} from 'react';
import Filter from './Filter';
import {createDefaultFilter, tableFiltersMenuKey} from './utils';
import SelectDropDown from './DropDown.jsx';
import useClickOutside from '../useClickOutside.jsx';

const FilterRule = ({setRule, filterHandler}) => {
  const [filter, setFilter] = useState(filterHandler.toAttrsValue())

  return (
    <div className="filter-container">
      <div className="column-chooser">
        <SelectDropDown
          className="filter-columns-dropdown"
          initialValue={filterHandler.colIndex}
          items={filterHandler.getColsOptions()}
          onValueChange={(index) => {
            filterHandler.setColIndex(index)
            setFilter(filterHandler.toAttrsValue())
          }}
        />
      </div>
      <div className="rule-chooser">
        <SelectDropDown
          className="filter-logics-dropdown"
          initialValue={filterHandler.filterId}
          items={filterHandler.getLogicOptions()}
          onValueChange={(filterId) => {
            filterHandler.setFilterId(filterId)
            setFilter(filterHandler.toAttrsValue())
          }}
        />
      </div>
      {filterHandler.valueIsDropdown() 
        ? <div className="rule-value">
            <SelectDropDown
              className="filter-value-dropdown"
              initialValue={filterHandler.getDefaultValue()}
              items={filterHandler.getValuesOptions()}
              onValueChange={(value) => {
                filterHandler.setFilterValue(value)
                setFilter(filterHandler.toAttrsValue())
              }}
            />
          </div>
        : filterHandler.noValue() 
          ? <></>
          : <input 
              defaultValue={filterHandler.getDefaultValue()} 
              className='filter-value-input' 
              onChange={(e) => filterHandler.setFilterValue(e.target.value)}
            >
            </input>
      }
      
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

  const ref = useClickOutside(() => {
    const {tr} = view.state;
    tr.setMeta(tableFiltersMenuKey, {
      action: 'close',
      id: window.id,
    });

    view.dispatch(tr);
  });

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
