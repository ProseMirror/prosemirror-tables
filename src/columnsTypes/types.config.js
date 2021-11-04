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
  CHECKBOX_DROPDOWN_ITEMS,
  CHECKED_ITEM_VALUE,
  labelsEquality,
  labelsInEquality,
  labelsIsAny,
  labelsIsNone,
  labelsIsEmpty,
  labelsIsNotEmpty,
  // buildLabelsDropDownItems,
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
        label: 'Is',
        logic: textEquality,
        defaultValue: '',
        default: true,
        inputType: 'input',
      },
      {
        id: 'text-in-equality',
        label: 'Is not',
        logic: textInequality,
        defaultValue: '',
        inputType: 'input',
      },
      {
        id: 'text-contains',
        label: 'Contains',
        logic: textContains,
        defaultValue: '',
        inputType: 'input',
      },
      {
        id: 'text-not-contains',
        label: 'Does not contain',
        logic: textNotContains,
        defaultValue: '',
        inputType: 'input',
      },
      {
        id: 'text-empty',
        label: 'Is empty',
        logic: isTextEmpty,
        defaultValue: null,
      },
      {
        id: 'text-not-empty',
        label: 'Is not empty',
        logic: isTextNotEmpty,
        defaultValue: null,
      },
    ],
  },
  {
    id: 'number',
    displayName: 'Number',
    handler: new NumberCellType(),
    filters: [
      {
        id: 'number-equality',
        label: '=',
        logic: numberEquality,
        defaultValue: '',
        default: true,
        inputType: 'input',
      },
      {
        id: 'number-in-equality',
        label: '≠',
        logic: numberInequality,
        defaultValue: '',
        inputType: 'input',
      },
      {
        id: 'number-smaller-or-equal',
        label: '≤',
        logic: smallerOrEquals,
        defaultValue: '',
        inputType: 'input',
      },
      {
        id: 'number-smaller',
        label: '<',
        logic: smaller,
        defaultValue: '',
        inputType: 'input',
      },
      {
        id: 'number-greater',
        label: '>',
        logic: greater,
        defaultValue: '',
        inputType: 'input',
      },
      {
        id: 'number-greater-or-equal',
        label: '≥',
        logic: greaterOrEquals,
        defaultValue: '',
        inputType: 'input',
      },
      {
        id: 'number-is-empty',
        label: 'Is empty',
        logic: isNumberEmpty,
        defaultValue: null,
      },
      {
        id: 'number-not-empty',
        label: 'Is not empty',
        logic: isNumberNotEmpty,
        defaultValue: null,
      },
    ],
  },
  {
    id: 'date',
    displayName: 'Date',
    handler: new DateType(),
    filters: [
      {
        id: 'is-on',
        label: 'Is on',
        logic: isOn,
        defaultValue: new Date().getTime(),
        default: true,
        inputType: 'date-picker',
      },
      {
        id: 'is-before',
        label: 'Is before',
        logic: isBefore,
        defaultValue: new Date().getTime(),
        inputType: 'date-picker',
      },
      {
        id: 'is-after',
        label: 'Is after',
        logic: isAfter,
        defaultValue: new Date().getTime(),
        inputType: 'date-picker',
      },
      {
        id: 'date-is-empty',
        label: 'Is empty',
        logic: isDateEmpty,
        defaultValue: null,
      },
      {
        id: 'date-not-empty',
        label: 'Is not empty',
        logic: isDateNotEmpty,
        defaultValue: null,
      },
    ],
  },
  {
    id: 'checkbox',
    displayName: 'Checkbox',
    handler: new CheckboxType(),
    dontForce: true,
    filters: [
      {
        id: 'checkbox-equals',
        label: 'Is',
        logic: checkboxEquality,
        defaultValue: CHECKED_ITEM_VALUE,
        default: true,
        inputType: 'dropdown',
        inputDropdownItems: () => CHECKBOX_DROPDOWN_ITEMS,
      },
      {
        id: 'checkbox-not-equal',
        label: 'Is not',
        logic: checkboxInequality,
        defaultValue: CHECKED_ITEM_VALUE,
        inputType: 'dropdown',
        inputDropdownItems: () => CHECKBOX_DROPDOWN_ITEMS,
      },
    ],
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
    filters: [
      {
        id: 'currency-equality',
        label: '=',
        logic: currencyEquality,
        defaultValue: '',
        default: true,
        inputType: 'input',
      },
      {
        id: 'currency-in-equality',
        label: '≠',
        logic: currencyInequality,
        defaultValue: '',
        inputType: 'input',
      },
      {
        id: 'currency-smaller-or-equal',
        label: '≤',
        logic: currencySmallerOrEquals,
        defaultValue: '',
        inputType: 'input',
      },
      {
        id: 'currency-smaller',
        label: '<',
        logic: currencySmaller,
        defaultValue: '',
        inputType: 'input',
      },
      {
        id: 'currency-greater',
        label: '>',
        logic: currencyGreater,
        defaultValue: '',
        inputType: 'input',
      },
      {
        id: 'currency-greater-or-equal',
        label: '≥',
        logic: currencyGreaterOrEquals,
        defaultValue: '',
        inputType: 'input',
      },
    ],
  },
  {
    //is, is not, is any of, is none of, is empty, is not empty
    id: 'labels',
    displayName: 'Labels',
    handler: new LabelType(),
    // /is, is not, is any of, is none of, is empty, is not empty
    filters: [
      {
        id: 'labels-equals',
        label: 'Is',
        logic: labelsEquality,
        defaultValue: [],
        default: true,
        inputType: 'labels-dropdown',
      },
      {
        id: 'labels-not-equal',
        label: 'Is not',
        logic: labelsInEquality,
        defaultValue: [],
        inputType: 'labels-dropdown',
      },
      {
        id: 'label-is-any',
        label: 'Is any of',
        logic: labelsIsAny,
        defaultValue: [],
        inputType: 'labels-dropdown',
      },
      {
        id: 'label-is-none',
        label: 'Is none of',
        logic: labelsIsNone,
        defaultValue: [],
        inputType: 'labels-dropdown',
      },
      {
        id: 'label-is-empty',
        label: 'Is empty',
        logic: labelsIsEmpty,
        defaultValue: 'checked',
        inputType: null,
      },
      {
        id: 'label-is-not-empty',
        label: 'Is not empty',
        logic: labelsIsNotEmpty,
        defaultValue: null,
        inputType: null,
      },
    ],
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
