import NumberCellType from './types/Number';
import TextCellType from './types/Text';

export const types = [
  {
    id: 'text',
    displayName: 'Text',
    icon: '',
    handler: new TextCellType(),
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
    command(state, dispatch, view) {},
  },
  {
    id: 'checkbox',
    displayName: 'Checkbox',
    icon: '',
    command(state, dispatch, view) {},
  },
  {
    id: 'currency',
    displayName: 'Currency',
    icon: '',
    command(state, dispatch, view) {},
  },
  {
    id: 'labels',
    displayName: 'Labels',
    icon: '',
    command(state, dispatch, view) {},
  },
];
