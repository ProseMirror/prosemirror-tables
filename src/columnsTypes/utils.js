export const parseTextToCurrency = (text, currency) => {
  const numbersInStringRegex = /[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)/g;
  const matches = text.match(numbersInStringRegex);

  return matches
    ? `${currency} ` +
        parseFloat(matches.join(''), 2)
          .toFixed(2)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : `${currency} 0.00`;
}

export const parseTextToNumber = (text) => {
  const numbersInStringRegex = /[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)/g;
  const matches = text.match(numbersInStringRegex);

  return matches ? matches.join('').replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
}