import CellDataType from '../Type';
import {stringToColor, updateTablesLabels} from './utils';

class LabelType extends CellDataType {
  /**
   * convert the content to the type format
   */
  convertContent(cell) {
    return cell.textContent;
  }

  /**
   * should return prosemirror node that will be the cell content
   */
  renderContentNode(schema, label, tr, pos) {
    const title = label.replace(/[^\x00-\x7F]/g, '');

    const labels = [];

    if (title !== '') {
      labels.push(title);
      updateTablesLabels(tr, pos, 'add', [title]);
    }

    return schema.nodes.label.create({
      labels,
    });
  }
}

export default LabelType;
