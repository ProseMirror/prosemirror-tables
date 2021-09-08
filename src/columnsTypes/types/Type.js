import {getColCells} from '../../util';
import {tableHeadersMenuKey} from '../../headers/headers-menu/index';
// import {types} from '../types.config';

class CellDataType {
  convert(state, dispatch, view, typeId) {
    const {pos, node, dom} = tableHeadersMenuKey.getState(state);
    if (typeId === node.attrs.type) return;

    const cells = getColCells(pos, state);
    dom.firstChild.className = `${typeId}ItemIcon typeIcon`;

    const {tr} = state;

    // change header type
    tr.setNodeMarkup(pos, undefined, Object.assign(node.attrs, {type: typeId}));

    cells.reverse().forEach(({node: cell, pos}) => {
      // const currentContent = cell.textContsent;
      // const valueFromAttrs =
      //   cell.attrs.values[typeId].default !== undefined
      //     ? cell.attrs.values[typeId].default
      //     : cell.attrs.values[typeId];

      // const reverseConvertedValue = types
      //   .find((type) => type.id === cell.attrs.type)
      //   .handler.convertContent(valueFromAttrs);

      /**
       * for each cell we will keep all the values in all formats,
       * if the current content value is same as the value we will get if we reverse-convert to the converted type -
       * we will use the value from the attrs. if not we will just use the converted value :)
       */

      // const convertedValue =
      //   currentContent !== reverseConvertedValue
      //     ? this.convertContent(currentContent)
      //     : this.convertContent(valueFromAttrs);
      tr.replaceRangeWith(
        pos + 1,
        pos + cell.nodeSize - 1,
        this.renderContentNode(state.schema, this.convertContent(cell), tr, pos)
      );

      // const newValues = cell.attrs.values;
      // newValues[typeId] = convertedValue;
      // if (cell.firstChild)
      //   newValues[cell.attrs.type] = this.parseContent(cell.firstChild);

      const newAttrs = Object.assign(cell.attrs, {
        // values: newValues,
        type: typeId,
      });

      tr.setNodeMarkup(pos, undefined, newAttrs);
    });

    view.dispatch(tr);
  }

  /**
   * convert the content to the type format, should return content that the renderContentNode of the same type can render to node
   */
  convertContent(cell) {
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
