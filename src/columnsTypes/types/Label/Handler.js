import CellDataType from '../Type';
import {randomString, stringToColor, updateTablesLabels} from './utils';

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
    const labels = [];

    if (label.replace(/[^\x00-\x7F]/g, '') !== '') {
      const newLabel = {title: label, color: stringToColor(randomString())};
      labels.push(newLabel);
      updateTablesLabels(tr, pos, 'add', [newLabel]);
    }

    return schema.nodes.label.create({
      labels,
    });
  }
}

export default LabelType;
