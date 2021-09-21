import ReactNodeView from '../../../ReactNodeView/ReactNodeView';
import {createElementWithClass} from '../../../util';

class DateTypeNodeView extends ReactNodeView {
  createDOM() {
    const dom = createElementWithClass('div', 'cell-date');
    return dom;
  }

  createContentDOM() {
    const contentDOM = createElementWithClass('span', 'cell-date-content');
    return contentDOM;
  }

  update(node) {
    if (this.node.type.name !== node.type.name) {
      return false;
    }
    
    if (this.dom && (!this.node.sameMarkup(node) || this.node.textContent !== node.textContent)) {
      this.renderComponent();
      this.setDomAttrs(node, this.dom);
      this.node = node;
    }

    return true;
  }

}

export default DateTypeNodeView;
