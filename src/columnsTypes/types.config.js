import NumberCellType from './types/Number';
import TextCellType from './types/Text';
import CheckboxType from './types/Checkbox';
import DateType from './types/Date/Handler';
import LabelType from './types/Label/Handler';
import CurrencyCellType from './types/Currency';

export const types = [
  {
    id: 'text',
    displayName: 'Text',
    icon: '',
    handler: new TextCellType(),
    dontForce: true
  },
  {
    id: 'number',
    displayName: 'Number',
    icon: '',
    handler: new NumberCellType(),
  },
  {
    id: 'date',
    displayName: 'Date',
    icon: '',
    handler: new DateType(),
  },
  {
    id: 'checkbox',
    displayName: 'Checkbox',
    icon: '',
    handler: new CheckboxType(),
    dontForce: true,
  },
  {
    id: 'currency',
    displayName: 'Currency',
    icon: '',
    handler: new CurrencyCellType(),
  },
  {
    id: 'labels',
    displayName: 'Labels',
    icon: '',
    handler: new LabelType(),
    dontForce: true,
  },
];
