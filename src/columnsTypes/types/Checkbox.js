import CellDataType from './Type';

class CheckboxType extends CellDataType {
  /**
   * convert the content to the type format
   */
  convertContent(cell) {
    return !!cell.firstChild.attrs.checked;
  }

  /**
   * should return prosemirror node that will be the cell content
   */
  renderContentNode(schema, checked) {
    return schema.nodes.checkbox.create({
      checked: typeof checked === 'boolean' ? checked : false,
    });
  }
}

export default CheckboxType;
