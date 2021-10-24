import dayjs from 'dayjs';

const clearWeirdCharactersFromText = (text) =>
  text.replace(/[^\x00-\x7F]/g, '');

// Text Logic

export const textEquality = (cell, value) => {
  return clearWeirdCharactersFromText(cell.textContent) === value;
};

export const textInequality = (cell, value) => {
  return clearWeirdCharactersFromText(cell.textContent) !== value;
};

export const textContains = (cell, value) => {
  return clearWeirdCharactersFromText(cell.textContent).includes(value);
};

export const textNotContains = (cell, value) => {
  return !clearWeirdCharactersFromText(cell.textContent).includes(value);
};

export const isTextEmpty = (cell) => {
  return !clearWeirdCharactersFromText(cell.textContent).length;
};

export const isTextNotEmpty = (cell) => {
  return clearWeirdCharactersFromText(cell.textContent).length > 0;
};

// Number Logic

export const numberEquality = (cell, value) => {
  return Number(cell.textContent) === Number(value);
};

export const numberInequality = (cell, value) => {
  return Number(cell.textContent) !== Number(value);
};

export const smallerOrEquals = (cell, value) => {
  return Number(cell.textContent) <= Number(value);
};

export const smaller = (cell, value) => {
  return Number(cell.textContent) < Number(value);
};

export const greaterOrEquals = (cell, value) => {
  return Number(cell.textContent) >= Number(value);
};

export const greater = (cell, value) => {
  return Number(cell.textContent) > Number(value);
};

export const isNumberEmpty = (cell) => {
  return !cell.textContent.length;
};

export const isNumberNotEmpty = (cell) => {
  return !!cell.textContent.length;
};

// Checkbox Logic

export const CHECKED_ITEM_VALUE = 'checked';

export const CHECKBOX_DROPDOWN_ITEMS = [
  {
    value: CHECKED_ITEM_VALUE,
    label: 'Checked',
  },
  {
    value: 'not-checked',
    label: 'Not Checked',
  },
];

export const checkboxEquality = (cell, value) => {
  const isChecked = value === CHECKED_ITEM_VALUE;
  return cell.firstChild.attrs.checked === isChecked;
};

export const checkboxInequality = (cell, value) => {
  const isChecked = value === CHECKED_ITEM_VALUE;
  return cell.firstChild.attrs.checked !== isChecked;
};

// Date Logic

export const isBefore = (cell, value) => {
  return dayjs(Number(cell.firstChild.attrs.value)).isBefore(
    dayjs(Number(value), 'date')
  );
};

export const isOn = (cell, value) => {
  return dayjs(Number(cell.firstChild.attrs.value)).isSame(
    dayjs(Number(value)),
    'date'
  );
};

export const isAfter = (cell, value) => {
  return dayjs(Number(cell.firstChild.attrs.value)).isAfter(
    dayjs(Number(value)),
    'date'
  );
};

export const isDateEmpty = (cell) => {
  return cell.firstChild.attrs.value === -1;
};

export const isDateNotEmpty = (cell) => {
  return cell.firstChild.attrs.value !== -1;
};

// Currency Logic

const removeCurrencyFromText = (text) => {
  return text.replace('$', '').trim();
};

export const currencyEquality = (cell, value) => {
  return Number(removeCurrencyFromText(cell.textContent)) === Number(value);
};

export const currencyInequality = (cell, value) => {
  return Number(removeCurrencyFromText(cell.textContent)) !== Number(value);
};

export const currencySmallerOrEquals = (cell, value) => {
  return Number(removeCurrencyFromText(cell.textContent)) <= Number(value);
};

export const currencySmaller = (cell, value) => {
  return Number(removeCurrencyFromText(cell.textContent)) < Number(value);
};

export const currencyGreaterOrEquals = (cell, value) => {
  return Number(removeCurrencyFromText(cell.textContent)) >= Number(value);
};

export const currencyGreater = (cell, value) => {
  return Number(removeCurrencyFromText(cell.textContent)) > Number(value);
};

// Labels Logic

export const buildLabelsDropDownItems = (table) => {
  return table.attar.labels.map((label) => ({
    value: label.title,
    label: label.title,
    color: label.color,
    checkbox: true,
  }));
};
