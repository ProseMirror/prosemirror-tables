import CellDataType from './Type';

class NumberCellType extends CellDataType {
  convertContent(cell) {
    const content = cell.textContent;
    if (typeof content === 'string' || typeof content === 'number') {
      const numbersInStringRegex = /[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)/g;
      const matches = content.match(numbersInStringRegex);

      return matches ? matches.join('') : '';
    } else {
      return '';
    }
  }
}

export default NumberCellType;
