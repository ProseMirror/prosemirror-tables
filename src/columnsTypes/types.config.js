import NumberCellType from './types/Number';
import TextCellType from './types/Text';
import CheckboxType from './types/Checkbox';
import DateType from './types/Date/Handler';
import LabelType from './types/Label/Handler';
import CurrencyCellType from './types/Currency';
import {PluginKey} from 'prosemirror-state';

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
  },
  {
    id: 'number',
    displayName: 'Number',
    handler: new NumberCellType(),
  },
  {
    id: 'date',
    displayName: 'Date',
    handler: new DateType(),
  },
  {
    id: 'checkbox',
    displayName: 'Checkbox',
    handler: new CheckboxType(),
    dontForce: true,
  },
  {
    id: 'currency',
    displayName: 'Currency',
    handler: new CurrencyCellType(),
  },
  {
    id: 'labels',
    displayName: 'Labels',
    handler: new LabelType(),
    dontForce: true,
    cellFullWidthElementClassName: 'all-labels-container', //class name of the element that determines the actual width of the cell
  },
];
