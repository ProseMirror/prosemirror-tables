// Text Logic

export const textEquality = (cell, value) => {
  return cell.textContent === value;
};

export const textInequality = (cell, value) => {
  return cell.textContent !== value;
};

export const textContains = (cell, value) => {
  return cell.textContent.includes(value);
};

export const textNotContains = (cell, value) => {
  return !cell.textContent.includes(value);
};

export const isTextEmpty = (cell) => {
  return !cell.textContent.length;
};

export const isTextNotEmpty = (cell) => {
  return !!cell.textContent.length;
};

// Number Logic

export const numberEquality = (cell, value) => {
  return parseFloat(cell.textContent) === value;
};

export const numberInequality = (cell, value) => {
  return parseFloat(cell.textContent) !== value;
};

export const smallerOrEquals = (cell, value) => {
  return parseFloat(cell.textContent) <= value;
};

export const smaller = (cell, value) => {
  return parseFloat(cell.textContent) < value;
};

export const greaterOrEquals = (cell, value) => {
  return parseFloat(cell.textContent) >= value;
};

export const greater = (cell, value) => {
  return parseFloat(cell.textContent) > value;
};

export const isNumberEmpty = (cell) => {
  return !cell.textContent.length;
};

export const isNumberNotEmpty = (cell) => {
  return !!cell.textContent.length;
};

// Checkbox Logic

export const checkboxEquality = (cell, value) => {
  return cell.firstChild.attrs.checked === value;
};

export const checkboxInequality = (cell, value) => {
  return cell.firstChild.attrs.checked !== value;
};

// Date Logic

export const isBefore = (cell, value) => {
  return cell.firstChild.attrs.value < value;
};

export const isOn = (cell, value) => {
  return cell.firstChild.attrs.value === value;
};

export const isAfter = (cell, value) => {
  return cell.firstChild.attrs.value > value;
};

export const isDateEmpty = (cell) => {
  return cell.firstChild.attrs.value === 0;
};

export const isDateNotEmpty = (cell) => {
  return cell.firstChild.attrs.value !== 0;
};

// Currency Logic

const removeCurrencyFromText = (text) => {
  return text.replace('$', '').trim();
};

export const currencyEquality = (cell, value) => {
  return parseFloat(removeCurrencyFromText(cell.textContent)) === value;
};

export const currencyInequality = (cell, value) => {
  return parseFloat(removeCurrencyFromText(cell.textContent)) !== value;
};

export const currencySmallerOrEquals = (cell, value) => {
  return parseFloat(removeCurrencyFromText(cell.textContent)) <= value;
};

export const currencySmaller = (cell, value) => {
  return parseFloat(removeCurrencyFromText(cell.textContent)) < value;
};

export const currencyGreaterOrEquals = (cell, value) => {
  return parseFloat(removeCurrencyFromText(cell.textContent)) >= value;
};

export const currencyGreater = (cell, value) => {
  return parseFloat(removeCurrencyFromText(cell.textContent)) > value;
};
