import { CURRENCY } from './Currency';
import CellDataType from './Type';

class TextCellType extends CellDataType {

  convertContent(cell, convertFromType) {
    if(convertFromType === 'currency') {
      return  cell.textContent.replace(`${CURRENCY} `, '')
    }
    return cell.textContent;
  }
}

export default TextCellType;
