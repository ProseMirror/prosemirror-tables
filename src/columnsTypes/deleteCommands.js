import {CURRENCY} from './types/Currency';

export const deleteEditableTypeContent = (cell, pos, tr) => {
  tr.insertText('', pos + 1, pos + cell.nodeSize - 1);
};

export const deleteCurrencyContent = (cell, pos, tr) => {
  tr.insertText(`${CURRENCY} 0.00`, pos + 1, pos + cell.nodeSize - 1);
};

export const deleteDateContent = (cell, pos, tr) => {
  tr.setNodeMarkup(pos + 1, undefined, {...cell.firstChild.attrs, value: -1});
};

export const deleteLabelsContent = (cell, pos, tr) => {
  tr.setNodeMarkup(pos + 1, undefined, {...cell.firstChild.attrs, labels: []});
};

export const deleteCheckboxContent = (cell, pos, tr) => {
  tr.setNodeMarkup(pos + 1, undefined, {
    ...cell.firstChild.attrs,
    checked: false,
  });
};
