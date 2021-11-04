import {getColCells} from '../../util';
import {tableHeadersMenuKey} from '../types.config';

class CellDataType {
  convert(view, typeId) {
    const headerState = tableHeadersMenuKey.getState(view.state);
    if(!headerState) return;
    const {pos, node, dom} = headerState;
    if (typeId === node.attrs.type) return;

    const cells = getColCells(pos, view.state);
    dom.firstChild.className = `${typeId}ItemIcon typeIcon`;

    const {tr} = view.state;

    // save old type before changing attrs
    const convertFromType = node.attrs.type

    // change header type
    tr.setNodeMarkup(pos, undefined, Object.assign(node.attrs, {type: typeId}));

    cells.reverse().forEach(({node: cell, pos}) => {
      tr.replaceRangeWith(
        pos + 1,
        pos + cell.nodeSize - 1,
        this.renderContentNode(
          view.state.schema,
          this.convertContent(cell, convertFromType),
          tr,
          pos
        )
      );

      const newAttrs = Object.assign(cell.attrs, {
        type: typeId,
      });

      tr.setNodeMarkup(pos, undefined, newAttrs);
    });

    tr.setMeta(tableHeadersMenuKey, {action: 'close', id: window.id})

    view.dispatch(tr);
  }

  /**
   * convert the content to the type format, should return content that the renderContentNode of the same type can render to node
   */
  convertContent(cell, convertFromType) {
    return cell.textContent;
  }

  /**
   * convert the cell child node to a value that can be saved in the cell attrs
   */
  parseContent(cell) {
    return cell.textContent;
  }

  /**
   * should return prosemirror node that will be the cell content
   */
  renderContentNode(schema, content) {
    if (content !== '') {
      const p = schema.nodes.paragraph.createAndFill({}, schema.text(content));
      return p;
    }
    return [];
  }
}

export default CellDataType;
