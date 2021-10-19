import NumberCellType from './types/Number';
import TextCellType from './types/Text';
import CheckboxType from './types/Checkbox';
import DateType from './types/Date/Handler';
import LabelType from './types/Label/Handler';
import CurrencyCellType from './types/Currency';
import {PluginKey} from 'prosemirror-state';
import {
  textEquality,
  textInequality,
  textContains,
  textNotContains,
  isTextEmpty,
  isTextNotEmpty,
  smallerOrEquals,
  smaller,
  greater,
  greaterOrEquals,
  isNumberEmpty,
  isNumberNotEmpty,
  numberEquality,
  numberInequality,
  isBefore,
  isAfter,
  isOn,
  isDateEmpty,
  isDateNotEmpty,
  checkboxEquality,
  checkboxInequality,
  currencyEquality,
  currencyInequality,
  currencySmallerOrEquals,
  currencySmaller,
  currencyGreater,
  currencyGreaterOrEquals,
} from './filtersLogic';
import {sortNumVsString} from '../util';

export const tableHeadersMenuKey = new PluginKey('headersMenu');

/**
 * Type Config -
 * defining type for table cell content.
 *
 * **`id`**`: string`
 *   : The Type id.
 *
 * **`displayName`**`: string`
 *   : The label to use in Menus that includes the type.
 *
 * **`handler`**`: class that extends `Type``
 *   : include all method to handle type convert, parse and render. all method described in `Type` class
 *
 * **`dontForce`**`: boolean`
 *   : determines wether to force type rules when selection leaves cell of this type, default to `false`
 *
 * **`cellFullWidthElementClassName`**`: string`
 *   : the class Name of the element that will determine the cell scrollWidth on expand/narrow columns (column border doubleClick)
 */

export const types = [
  {
    id: 'text',
    displayName: 'Text',
    handler: new TextCellType(),
    dontForce: true,
    filters: [
      {
        id: 'text-equality',
        label: 'is',
        logic: textEquality,
        defaultValue: '',
        default: true,
      },
      {
        id: 'text-in-equality',
        label: 'is Not',
        logic: textInequality,
        defaultValue: '',
      },
      {
        id: 'text-contains',
        label: 'contains',
        logic: textContains,
        defaultValue: '',
      },
      {
        id: 'text-not-contains',
        label: 'Does Not Contain',
        logic: textNotContains,
        defaultValue: '',
      },
      {
        id: 'text-empty',
        label: 'Is Empty',
        logic: isTextEmpty,
        defaultValue: null,
      },
      {
        id: 'text-not-empty',
        label: 'Is Not Empty',
        logic: isTextNotEmpty,
        defaultValue: null,
      },
    ],
  },
  {
    id: 'number',
    displayName: 'Number',
    handler: new NumberCellType(),
    filters: [],
    // filtersLogic: {
    //   '=': {logic: numberEquality, defaultValue: 0},
    //   '≠': numberInequality,
    //   '≤': smallerOrEquals,
    //   '<': smaller,
    //   '>': greater,
    //   '≥': greaterOrEquals,
    //   'Is Empty': isNumberEmpty,
    //   'Is Not Empty': isNumberNotEmpty,
    // },
  },
  {
    id: 'date',
    displayName: 'Date',
    handler: new DateType(),
    filters: [],
    // filtersLogic: {
    //   Before: isBefore,
    //   On: isOn,
    //   After: isAfter,
    //   'Is Empty': isDateEmpty,
    //   'Is Not Empty': isDateNotEmpty,
    // },
  },
  {
    id: 'checkbox',
    displayName: 'Checkbox',
    handler: new CheckboxType(),
    dontForce: true,
    filters: [],
    // filtersLogic: {
    //   Is: checkboxEquality,
    //   'Is Not': checkboxInequality,
    // },
    sortCompareFunction: (direction, cellA, cellB) => {
      const getCellCheckState = (cell) => cell.content.content[0].attrs.checked;
      const cellAChecked = getCellCheckState(cellA);
      const cellBChecked = getCellCheckState(cellB);

      return direction * (cellBChecked > cellAChecked ? 1 : -1);
    },
  },
  {
    id: 'currency',
    displayName: 'Currency',
    handler: new CurrencyCellType(),
    filters: [],
    // filtersLogic: {
    //   '=': currencyEquality,
    //   '≠': currencyInequality,
    //   '≤': currencySmallerOrEquals,
    //   '<': currencySmaller,
    //   '>': currencyGreater,
    //   '≥': currencyGreaterOrEquals,
    // },
  },
  {
    id: 'labels',
    displayName: 'Labels',
    handler: new LabelType(),
    filters: [],
    dontForce: true,
    cellFullWidthElementClassName: 'all-labels-container', //class name of the element that determines the actual width of the cell
    sortCompareFunction: (direction, cellA, cellB) => {
      const getCellLabel = (cell) => cell.content.content[0].attrs.labels[0];
      const cellALabel = getCellLabel(cellA);
      const cellBLabel = getCellLabel(cellB);

      const textA = cellALabel ? cellALabel.title : null;
      const textB = cellBLabel ? cellBLabel.title : null;

      return sortNumVsString(direction, textA, textB);
    },
  },
];

export const columnTypesMap = types.reduce((map, type) => {
  map[type.id] = type;
  return map;
}, {});
