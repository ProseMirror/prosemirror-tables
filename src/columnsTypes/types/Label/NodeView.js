import {TextSelection} from 'prosemirror-state';
import ReactNodeView from '../../../ReactNodeView/ReactNodeView';
import { labelsExtraAttrs } from '../../../schema/cellTypeAttrs';
import { setNodeAttrs } from '../../../schema/schema';
import {createElementWithClass} from '../../../util';

class LabelTypeNodeView extends ReactNodeView {
  constructor(node, view, getPos, decorations, component, componentProps) {
    super(node, view, getPos, decorations, component, componentProps);
    this.setDOMAttrsFromNode(node)
  }

  setDOMAttrsFromNode(node) {
    const extraAttrs = setNodeAttrs(node, labelsExtraAttrs);
    this.dom.style = `${extraAttrs.style}`;
    Object.keys(extraAttrs).forEach((attr) => {
      this.dom.setAttribute(attr, extraAttrs[attr]);
    })
  }

  createDOM() {
    const dom = createElementWithClass('div', 'cell-label');
    dom.contentEditable= "false";
    return dom;
  }

  selectNode() {
    // TODO: find better solution for "readonly" cells
    const {tr} = this.view.state;
    tr.setSelection(TextSelection.near(tr.doc.resolve(this.getPos()), -1));
    this.view.dispatch(tr);
  }
  ignoreMutation(event) {
    return event.type !== 'selection';
  }

  update(node) {
     if (this.node.type.name !== node.type.name) {
      return false;
    }

    if (this.dom && !this.node.sameMarkup(node)) {
      this.setDomAttrs(node, this.dom);
      this.node = node;
      this.renderComponent();
    }

    this.setDOMAttrsFromNode(node);

    return true;
  }

}

export default LabelTypeNodeView;
