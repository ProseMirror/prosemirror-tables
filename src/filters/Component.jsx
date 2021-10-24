import React, {useState} from 'react';
import Filter from './Filter';
import {
  createDefaultFilter,
  getColsOptions,
  executeFilters,
  tableFiltersMenuKey,
  getConcatenationItems,
} from './utils';
import SelectDropDown from './DropDown.jsx';
import useClickOutside from '../useClickOutside.jsx';

const FilterRule = ({
  onFilterChange,
  filterHandler,
  colsDropdownOptions,
  onFilterRemove,
  index,
}) => {
  return (
    <div className="filter-row">
      {index === 0 ? (
        'Where'
      ) : (
        <SelectDropDown
          className="ternary-dropdown"
          initialValue={filterHandler.concatenationLogic}
          items={getConcatenationItems()}
          onValueChange={(concatenationLogic) =>
            onFilterChange({
              ...filterHandler.toAttrsValue(),
              concatenationLogic,
            })
          }
        />
      )}
      <div className="column-chooser">
        <SelectDropDown
          className="filter-columns-dropdown"
          initialValue={filterHandler.headerId}
          items={colsDropdownOptions}
          onValueChange={(headerId) =>
            onFilterChange({...filterHandler.toAttrsValue(), headerId})
          }
        />
      </div>
      <div className="rule-chooser">
        <SelectDropDown
          className="filter-logics-dropdown"
          initialValue={filterHandler.filterId}
          items={filterHandler.getLogicOptions()}
          onValueChange={(filterId) =>
            onFilterChange({...filterHandler.toAttrsValue(), filterId})
          }
        />
      </div>
      <div className="value-chooser">
        {filterHandler.valueIsDropdown() ? (
          <SelectDropDown
            className="filter-value-dropdown"
            initialValue={filterHandler.getDefaultValue()}
            items={filterHandler.getValuesOptions()}
            onValueChange={(filterValue) =>
              onFilterChange({...filterHandler.toAttrsValue(), filterValue})
            }
          />
        ) : filterHandler.noValue() ? (
          <></>
        ) : (
          <input
            className="filter-value-input"
            defaultValue={filterHandler.getDefaultValue()}
            onChange={(e) =>
              onFilterChange({
                ...filterHandler.toAttrsValue(),
                filterValue: e.target.value,
              })
            }
          ></input>
        )}
      </div>

      <span className="remove-rule-button" onClick={onFilterRemove}></span>
    </div>
  );
};

export const TableFiltersComponent = ({table, pos, view}) => {
  const [filters, setFilters] = useState(table.attrs.filters || []);

  const addFilter = () => {
    const defaultFilter = createDefaultFilter(table);
    setFilters((oldFilters) => [...oldFilters, defaultFilter]);
  };

  const createFilterRemover = (filterIndex) => () => {
    const newFilters = filters.slice();
    newFilters.splice(filterIndex, 1);

    // apply all filters
    executeFilters(table, pos, view, newFilters);

    setFilters(newFilters);
  };

  const createFilterSetter = (filterIndex) => (newFilter) => {
    const newFilters = filters.slice();
    newFilters[filterIndex] = newFilter;

    // apply all filters
    executeFilters(table, pos, view, newFilters);

    setFilters(newFilters);
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
    <div className="table-filters-container" ref={ref}>
      <div className="active-filters">
        {filters.length ? (
          <>
            {filters.map((filterConfig, index) => {
              const FilterHandler = new Filter(table, filterConfig);
              return (
                <>
                  <FilterRule
                    colsDropdownOptions={getColsOptions(table)}
                    filterHandler={FilterHandler}
                    index={index}
                    key={index}
                    onFilterChange={createFilterSetter(index)}
                    onFilterRemove={createFilterRemover(index)}
                  />
                </>
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
    </div>
  );
};
