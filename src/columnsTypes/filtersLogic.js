import dayjs from 'dayjs';
import {removeInvisibleCharacterFromText} from '../util';

/**
 * This file contains all the filters logic
 * each function gets the cell that its checking and the value from the filter input(each filter and his own input)
 * the function should return true if this cell should be visible, false otherwise
 */

// Text Logic

export const textEquality = (cell, value) => {
  return removeInvisibleCharacterFromText(cell.textContent) === value;
};

export const textInequality = (cell, value) => {
  return removeInvisibleCharacterFromText(cell.textContent) !== value;
};

export const textContains = (cell, value) => {
  return removeInvisibleCharacterFromText(
    cell.textContent.toLowerCase()
  ).includes(value.toLowerCase());
};

export const textNotContains = (cell, value) => {
  return !removeInvisibleCharacterFromText(cell.textContent).includes(value);
};

export const isTextEmpty = (cell) => {
  return !removeInvisibleCharacterFromText(cell.textContent).length;
};

export const isTextNotEmpty = (cell) => {
  return removeInvisibleCharacterFromText(cell.textContent).length > 0;
};

// Number Logic
const parseNum = (number) => {
  return Number(number.trim().replaceAll(',', ''));
};

export const numberEquality = (cell, value) => {
  return parseNum(cell.textContent) === parseNum(value);
};

export const numberInequality = (cell, value) => {
  return parseNum(cell.textContent) !== parseNum(value);
};

export const smallerOrEquals = (cell, value) => {
  return parseNum(cell.textContent) <= parseNum(value);
};

export const smaller = (cell, value) => {
  return parseNum(cell.textContent) < parseNum(value);
};

export const greaterOrEquals = (cell, value) => {
  return parseNum(cell.textContent) >= parseNum(value);
};

export const greater = (cell, value) => {
  return parseNum(cell.textContent) > parseNum(value);
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
    dayjs(Number(value)),
    'date'
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
  return text.replaceAll(/[\$,]/g, '').trim();
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

// if the cell containing exactly all the selected labels, return true. false otherwise
export const labelsEquality = (cell, selectedLabels) => {
  if (!cell.firstChild.attrs.labels) return false;
  const cellLabels = cell.firstChild.attrs.labels.map((label) => label.title);
  if (selectedLabels.length !== cellLabels.length) return false; // has to exact match between the labels

  for (let i = 0; i < selectedLabels.length; i++) {
    if (!cellLabels.includes(selectedLabels[i])) return false;
  }
  return true;
};

// if the cell containing exactly all the selected labels, return false. true otherwise
export const labelsInEquality = (cell, selectedLabels) => {
  if (!cell.firstChild.attrs.labels) return false;
  const cellLabels = cell.firstChild.attrs.labels.map((label) => label.title);
  if (selectedLabels.length !== cellLabels.length) return true; // has to exact match between the labels to return false

  for (let i = 0; i < selectedLabels.length; i++) {
    if (!cellLabels.includes(selectedLabels[i])) return true;
  }
  return false;
};

// if the cell includes one or more of the selected labels, return true. false otherwise
export const labelsIsAny = (cell, selectedLabels) => {
  if (!cell.firstChild.attrs.labels) return false;
  const cellLabels = cell.firstChild.attrs.labels.map((label) => label.title);

  for (let i = 0; i < selectedLabels.length; i++) {
    if (cellLabels.includes(selectedLabels[i])) return true;
  }
  return false;
};

// if the cell includes one of the selected labels, return false. true otherwise
export const labelsIsNone = (cell, selectedLabels) => {
  if (!cell.firstChild.attrs.labels) return false;
  const cellLabels = cell.firstChild.attrs.labels.map((label) => label.title);

  for (let i = 0; i < selectedLabels.length; i++) {
    if (cellLabels.includes(selectedLabels[i])) return false;
  }
  return true;
};

export const labelsIsEmpty = (cell, value) => {
  if (!cell.firstChild.attrs.labels) return false;
  const cellLabels = cell.firstChild.attrs.labels.map((label) => label.title);
  return !cellLabels.length;
};

export const labelsIsNotEmpty = (cell, value) => {
  if (!cell.firstChild.attrs.labels) return false;
  const cellLabels = cell.firstChild.attrs.labels.map((label) => label.title);
  return !!cellLabels.length;
};
