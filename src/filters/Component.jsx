import React, {useEffect, useRef, useState} from 'react';
import Filter from './Filter';
import {
  createDefaultFilter,
  getColsOptions,
  executeFilters,
  tableFiltersMenuKey,
  getConcatenationItems,
} from './utils';
import SelectDropDown, {SelectDropDownButton} from './DropDown.jsx';
import useClickOutside from '../useClickOutside.jsx';
import {DatePicker, MuiPickersUtilsProvider} from '@material-ui/pickers';
import DateUtilDayJS from '@date-io/dayjs';
import {
  StylesProvider,
  createGenerateClassName,
} from '@material-ui/core/styles';
import DatePickerTheme from '../columnsTypes/types/Date/DatePickerTheme';
import {ThemeProvider} from '@material-ui/core/styles';
import {DATE_FORMAT} from '../columnsTypes/types/Date/utils';
import {LabelsChooser} from '../columnsTypes/types/Label/Component.jsx';

const generateClassName = createGenerateClassName({
  seed: 'sgo-tables-plugin-',
});

const FiltersDatePicker = ({onFilterChange, filterHandler}) => {
  const [date, setDate] = useState(filterHandler.getDefaultValue());
  return (
    <StylesProvider generateClassName={generateClassName}>
      <ThemeProvider theme={DatePickerTheme}>
        <MuiPickersUtilsProvider utils={DateUtilDayJS}>
          <DatePicker
            format={DATE_FORMAT}
            onChange={(newValue) => {
              setDate(newValue.toDate().getTime());
              onFilterChange({
                ...filterHandler.toAttrsValue(),
                filterValue: newValue.toDate().getTime(),
              });
            }}
            openTo="date"
            style={{width: '100px', cursor: 'pointer'}}
            value={date}
            variant="inline"
          />
        </MuiPickersUtilsProvider>
      </ThemeProvider>
    </StylesProvider>
  );
};

const FiltersInputDropDown = ({filterHandler, onFilterChange}) => {
  return (
    <SelectDropDown
      className="input-dropdown"
      initialValue={filterHandler.getDefaultValue()}
      items={filterHandler.getDropdownInputItems()}
      onValueChange={(filterValue) =>
        onFilterChange({
          ...filterHandler.toAttrsValue(),
          filterValue,
        })
      }
    />
  );
};

const FiltersTextInput = ({filterHandler, onFilterChange}) => {
  const inputRef = useRef();

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [inputRef]);

  return (
    <input
      className="filter-value-input"
      defaultValue={filterHandler.getDefaultValue()}
      onChange={(e) =>
        onFilterChange({
          ...filterHandler.toAttrsValue(),
          filterValue: e.target.value,
        })
      }
      ref={inputRef}
    ></input>
  );
};

const FiltersLabelsDropDown = ({filterHandler, onFilterChange}) => {
  const [openDropDown, setOpenDropDown] = useState(false);

  const tablePos = tableFiltersMenuKey.getState(filterHandler.view.state);
  const handleLabelChoose = (title, checked, allChosenLabels) => {
    let newChosenLabels = allChosenLabels.map((label) => label.title);

    if (checked) {
      console.log(newChosenLabels, title);
      newChosenLabels = [...newChosenLabels, title];
    } else {
      newChosenLabels = newChosenLabels.filter((label) => label !== title);
    }

    onFilterChange({
      ...filterHandler.toAttrsValue(),
      filterValue: newChosenLabels,
    });
  };
  // console.log(filterHandler.toAttrsValue().filterValue);
  return (
    <div className="selectDropDownContainer">
      <SelectDropDownButton
        disableDropDown={false}
        itemStyleClass={''}
        label={'Choose Labels'}
        openDropDown={() => setOpenDropDown(!openDropDown)}
      />
      {openDropDown && (
        <LabelsChooser
          handleLabelChoose={handleLabelChoose}
          inFilters={true}
          initialChosenLabels={filterHandler
            .toAttrsValue()
            .filterValue.map((label) => ({title: label}))}
          node={filterHandler.table}
          onClose={() => setOpenDropDown(false)}
          pos={tablePos.pos + 1}
          view={filterHandler.view}
        />
      )}
    </div>
  );
};

const getInputElement = (filterHandler, onFilterChange) => {
  const inputType = filterHandler.getInputType();

  switch (inputType) {
    default:
      return () => <></>;
    case 'input':
      return FiltersTextInput;
    case 'date-picker':
      return FiltersDatePicker;
    case 'dropdown':
      return FiltersInputDropDown;
    case 'labels-dropdown':
      return FiltersLabelsDropDown;
  }
};

const FilterRule = ({
  onFilterChange,
  filterHandler,
  colsDropdownOptions,
  onFilterRemove,
  index,
}) => {
  const FilterInput = getInputElement(filterHandler, onFilterChange);

  return (
    <div className="filter-row">
      {index === 0 ? (
        'Where'
      ) : (
        <SelectDropDown
          className="concatenation-dropdown"
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
          initialValue={filterHandler.getLogicId()}
          items={filterHandler.getLogicOptions()}
          onValueChange={(filterId) =>
            onFilterChange({...filterHandler.toAttrsValue(), filterId})
          }
        />
      </div>

      <div className="value-chooser">
        <FilterInput
          filterHandler={filterHandler}
          onFilterChange={onFilterChange}
        />
      </div>

      <span className="remove-rule-button" onClick={onFilterRemove}></span>
    </div>
  );
};

export const TableFiltersComponent = ({table, pos, view, headerPos}) => {
  const [filters, setFilters] = useState(table.attrs.filters || []);

  useEffect(() => {
    if (!headerPos) return;
    const colDefaultFilter = createDefaultFilter(view.state, table, headerPos);
    setFilters((oldFilters) => [...oldFilters, colDefaultFilter]);
  }, []);

  const addFilter = () => {
    const defaultFilter = createDefaultFilter(view.state, table);
    setFilters((oldFilters) => [...oldFilters, defaultFilter]);
  };

  const createFilterRemover = (filterIndex) => () => {
    const newFilters = filters.slice();
    newFilters.splice(filterIndex, 1);

    // apply all filters
    const tr = executeFilters(table, pos, view.state, newFilters);
    view.dispatch(tr);

    setFilters(newFilters);
  };

  const createFilterSetter = (filterIndex) => (newFilter) => {
    const newFilters = filters.slice();
    newFilters[filterIndex] = newFilter;

    // apply all filters
    const tr = executeFilters(table, pos, view.state, newFilters);
    view.dispatch(tr);

    setFilters(newFilters);
  };

  const ref = useClickOutside((e) => {
    if (view.dom.contains(e.target)) {
      const {tr} = view.state;
      tr.setMeta(tableFiltersMenuKey, {
        action: 'close',
        id: window.id,
      });

      view.dispatch(tr);
    }
  });

  return (
    <div className="table-filters-container" ref={ref}>
      <div className="active-filters">
        {filters.length ? (
          <>
            {filters.map((filterConfig, index) => {
              const FilterHandler = new Filter(view, table, filterConfig);
              return (
                <>
                  <FilterRule
                    colsDropdownOptions={getColsOptions(table)}
                    filterHandler={FilterHandler}
                    index={index}
                    key={`${index}${filterConfig.headerId}`}
                    onFilterChange={createFilterSetter(index)}
                    onFilterRemove={createFilterRemover(index)}
                  />
                </>
              );
            })}
          </>
        ) : (
          <></>
        )}
      </div>
      <button className="add-filters-button" onClick={addFilter}>
        + Add Filter
      </button>
    </div>
  );
};
