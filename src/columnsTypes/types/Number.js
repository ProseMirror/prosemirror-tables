import CellDataType from './Type';

class NumberCellType extends CellDataType {
  convertContent(content) {
    const numbersInStringRegex = /[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)/g;
    const matches = content.match(numbersInStringRegex);

    return matches.length ? matches.join('') : '';
  }
}

export default NumberCellType;
