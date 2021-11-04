import { parseTextToCurrency } from '../utils';
import CellDataType from './Type';

export const CURRENCY = '$';

class CurrencyCellType extends CellDataType {
  convertContent(cell, convertFromType) {
    return parseTextToCurrency(cell.textContent, CURRENCY);
  }
}

export default CurrencyCellType;
