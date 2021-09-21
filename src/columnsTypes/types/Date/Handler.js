import CellDataType from '../Type';
import {formatDate} from './utils';

class DateType extends CellDataType {
  /**
   * convert the content to the type format
   */
  convertContent(cell) {
    try {
      const date = new Date(cell.textContent).getTime();
      return isNaN(date) ? -1 : date;
    } catch {
      return -1;
    }
  }

  /**
   * should return prosemirror node that will be the cell content
   */
  renderContentNode(schema, dateInMili) {
    return schema.nodes.date.createAndFill(
      {value: dateInMili},
      dateInMili !== -1
        ? [schema.text(formatDate(new Date(dateInMili), 'dd/mm/yy'))]
        : []
    );
  }
}

export default DateType;
