import { parseTextToNumber } from '../utils';
import CellDataType from './Type';

class NumberCellType extends CellDataType {
  convertContent(cell, convertFromType) {
    return parseTextToNumber(cell.textContent)
  }
}

export default NumberCellType;
