import { parseTextToCurrency, parseTextToNumber } from '../utils';
import { CURRENCY } from './Currency';
import CellDataType from './Type';

class TextCellType extends CellDataType {

  convertContent(cell, convertFromType) {
    const valueFromMemory = cell.attrs.typesValues.text
    const cellContent = cell.textContent

    if (convertFromType === 'currency') {
      if (cellContent === parseTextToCurrency(valueFromMemory, CURRENCY)) {
        return valueFromMemory
      } else {
        return  cellContent.replace(`${CURRENCY} `, '')
      }
    }

    if (convertFromType === 'number') {
      if (cellContent === parseTextToNumber(valueFromMemory)) {
        return valueFromMemory
      } else {
        return  cellContent.replace(`${CURRENCY} `, '')
      }
    }

    if (convertFromType === 'checkbox') {
      return valueFromMemory
    }


    return cell.textContent;
  }
}

export default TextCellType;
