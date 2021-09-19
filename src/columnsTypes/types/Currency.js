import CellDataType from './Type';

class CurrencyCellType extends CellDataType {
  convertContent(cell) {
    const content = cell.textContent;
    if (typeof content === 'string' || typeof content === 'number') {
      const numbersInStringRegex = /[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)/g;
      const matches = content.match(numbersInStringRegex);

      return matches
        ? '$ ' +
            parseFloat(matches.join(''), 2)
              .toFixed(2)
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        : '$ 0.00';
    } else {
      return '';
    }
  }
}

export default CurrencyCellType;
