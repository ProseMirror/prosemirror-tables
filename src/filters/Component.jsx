import React, {
  useState,
  useRef,
  useCallback,
} from "react";
import { getColIndex } from "../util";
import { createDefaultFilter } from "./utils";

const FilterRule = ({setRule, table}) => {
  return (
    <div className='filter-container'>
      <div className='column-chooser'>
        <DropDown options={}/>
      </div>
      <div className='rule-chooser'></div>
      <div className='rule-value'></div>
      <button className='remove-rule-button'></button>
    </div>
  )
}

export const TableFiltersComponent = ({table, pos, dom, view}) => {
  const [filters, setFilters] = useState(table.attrs.filters || []);

  const addFilter = () => { 
    const defaultFilter = createDefaultFilter(view, pos);
    setFilters((oldFilters) => [...oldFilters, defaultFilter])
  }

  const handleFilterChange = () => {

  }

  return (
    <div className='table-filters-container'>
      <div className='active-filters'>
        Where
        {
          filters.length 
          ?  <>
            {
              filters.map((filter) => {
                return <FilterRule setRule={handleFilterChange} columnsItems={generateColumnsDropdownItems(table)}/>
              })
            }
          </> : <>No Filters Selected</>
        }
      </div>
      <button className='add-filters-button' onClick={addFilter}>+ Add Filter</button>
      <button className='apply-rules-button'>Apply Rules</button>
    </div>
  )
}