import CellDataType from '../Type';
import {randomString, stringToColor, updateTablesLabels} from './utils';

class LabelType extends CellDataType {
  /**
   * convert the content to the type format
   */
  convertContent(cell) {
    return cell.textContent;
  }

  getLabelColor(tableLabels, title) {
    const existingLabel = tableLabels.find((tableLabel) => tableLabel.title === title);
    if (!existingLabel) return stringToColor(randomString());
    return existingLabel.color;
  }

  /**
   * should return prosemirror node that will be the cell content
   */
  renderContentNode(schema, cellTextContent, tr, pos) {
    let labels = [];

    if (cellTextContent.replace(/[^\x00-\x7F]/g, '') !== '') {
      const titles = Array.from(new Set(cellTextContent.split(',')));
      const tableLabels = tr.doc.resolve(pos).node(1).attrs.labels

      labels = titles.map((title) => ({title, color: this.getLabelColor(tableLabels, title)}))

      updateTablesLabels(tr, pos, 'add', labels);
    }

    return schema.nodes.label.create({
      labels,
    });
  }
}

export default LabelType;
