import CellDataType from '../Type';
import {DATE_FORMAT, formatDate} from './utils';

class DateType extends CellDataType {
  /**
   * convert the content to the type format
   */
  convertContent(cell) {
    const brokenFormat = DATE_FORMAT.split('/');
    const brokenContent = cell.textContent
      .split(/(\/|\.)/gi)
      .filter((char) => char !== '/' && char !== '.');

    if (brokenContent.length < 3) return -1;

    const date = new Date();

    const day = brokenContent[brokenFormat.indexOf('dd')]
      .toString()
      .padStart(2, '0');
    const month = (brokenContent[brokenFormat.indexOf('mm')] - 1)
      .toString()
      .padStart(2, '0');

    const year = brokenContent[brokenFormat.indexOf('yy')] || '';

    let fullYear;
    if (year.length > 3) {
      fullYear = year.slice(0, 4);
    } else if (year.length === 3) {
      fullYear = year.padStart(4, '2');
    } else {
      const decade =
        year.length > 1 ? year.slice(-2) : year.slice(-2).padStart(2, '0');

      fullYear = `20${decade}`;
    }

    date.setDate(day);
    date.setMonth(month);
    date.setFullYear(fullYear);

    const dateInMili = date.getTime();

    return isNaN(dateInMili) ? -1 : dateInMili;
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
