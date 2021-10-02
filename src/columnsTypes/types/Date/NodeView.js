import ReactNodeView from '../../../ReactNodeView/ReactNodeView';
import {createElementWithClass} from '../../../util';

class DateTypeNodeView extends ReactNodeView {
  constructor(node, view, getPos, decorations, component, componentProps) {
    super(node, view, getPos, decorations, component, componentProps);
    this.addEmptyClass();
  }

  createDOM() {
    const dom = createElementWithClass('div', 'cell-date');
    return dom;
  }

  createContentDOM() {
    const contentDOM = createElementWithClass('div', 'cell-date-content');
    return contentDOM;
  }

  update(node) {
    if (this.node.type.name !== node.type.name) {
      return false;
    }

    if (
      this.dom &&
      (!this.node.sameMarkup(node) ||
        this.node.textContent !== node.textContent)
    ) {
      this.renderComponent();
      this.setDomAttrs(node, this.dom);
      this.node = node;
    }

    this.addEmptyClass();
    return true;
  }

  addEmptyClass() {
    if (!this.node.textContent.length) this.dom.classList.add('empty-date');
    if (
      this.node.textContent.length &&
      this.dom.classList.contains('empty-date')
    )
      this.dom.classList.remove('empty-date');
  }
}

export default DateTypeNodeView;
