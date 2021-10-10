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
    // filtersLogic: {
    //   is: textEquality,
    //   'is not': textInequality,
    //   contains: textContains,
    //   'does not contain': textNotContains,
    //   'Is Empty': isTextEmpty,
    //   'Is Not Empty': isTextNotEmpty,
    // },
    filters: [
      {
        label: 'is',
        logic: textEquality,
        defaultValue: '',
        default: true
      },
      {
        label: 'is Not',
        logic: textInequality,
        defaultValue: ''
      },
      {
        label: 'contains',
        logic: textContains,
        defaultValue: ''
      },
      {
        label: 'Does Not Contain',
        logic: textNotContains,
        defaultValue: ''
      },
      {
        label: 'Is Empty',
        logic: isTextEmpty,
        defaultValue: null
      },
      {
        label: 'Is Not Empty',
        logic: isTextNotEmpty,
        defaultValue: null
      },

    ]
  },
  {
    id: 'number',
    displayName: 'Number',
    handler: new NumberCellType(),
    filters: []
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
    filters: []
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
    filters: []
    // filtersLogic: {
    //   Is: checkboxEquality,
    //   'Is Not': checkboxInequality,
    // },
  },
  {
    id: 'currency',
    displayName: 'Currency',
    handler: new CurrencyCellType(),
    filters: []
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
  },
];
