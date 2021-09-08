import CellDataType from '../Type';

class DateType extends CellDataType {
  /**
   * convert the content to the type format
   */
  convertContent(cell) {
    return new Date(cell.textContent);
  }

  /**
   * should return prosemirror node that will be the cell content
   */
  renderContentNode(schema, date) {
    return schema.nodes.date.create({date});
  }
}

export default DateType;
