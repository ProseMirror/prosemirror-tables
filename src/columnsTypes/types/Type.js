import {getColCells} from '../../util';
import {tableHeadersMenuKey} from '../../headers/headers-menu/index';
import {types} from '../types.config';

class CellDataType {
  convert(state, dispatch, view, typeId) {
    const {pos, node, dom} = tableHeadersMenuKey.getState(state);
    const cells = getColCells(pos, state);

    dom.firstChild.className = `${typeId}ItemIcon typeIcon`;

    const {tr} = state;

    // change header type
    tr.setNodeMarkup(pos, undefined, Object.assign(node.attrs, {type: typeId}));

    cells.reverse().forEach(({node: cell, pos}) => {
      const currentContent = cell.textContent;
      const valueFromAttrs =
        cell.attrs.values[typeId].default !== undefined
          ? cell.attrs.values[typeId].default
          : cell.attrs.values[typeId];

      const reverseConvertedValue = types
        .find((type) => type.id === cell.attrs.type)
        .handler.convertContent(valueFromAttrs);

      /**
       * for each cell we will keep all the values in all formats,
       * if the current content value is same as the value we will get if we reverse-convert to the converted type -
       * we will use the value from the attrs. if not we will just use the converted value :)
       */

      const convertedValue =
        currentContent !== reverseConvertedValue
          ? this.convertContent(currentContent)
          : this.convertContent(valueFromAttrs);

      tr.replaceRangeWith(
        pos + 1,
        pos + cell.nodeSize - 1,
        this.renderContentNode(state.schema, convertedValue)
      );

      const newValues = cell.attrs.values;
      newValues[typeId] = convertedValue;

      const newAttrs = Object.assign(cell.attrs, {
        values: newValues,
        type: typeId,
      });

      tr.setNodeMarkup(pos, undefined, newAttrs);
    });

    dispatch(tr);
  }

  /**
   * convert the content to the type format
   */
  convertContent(content) {
    return content;
  }

  /**
   * should return prosemirror node that will be the cell content
   */
  renderContentNode(schema, content) {
    if (content !== '') {
      return schema.text(content);
    }
    return [];
  }
}

export default CellDataType;

// console.log([1, 3, 7, 8, 2, 5, 9, 1].sort((el1, el2) => el1 - el2))
