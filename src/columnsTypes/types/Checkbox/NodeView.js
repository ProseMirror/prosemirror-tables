import { checkboxExtraAttrs } from '../../../schema/cellTypeAttrs';
import { setNodeAttrs } from '../../../schema/schema';
import {createElementWithClass} from '../../../util';

class CheckboxNodeView {
  constructor(node, editorView, getPos) {
    this.view = editorView;
    this.node = node;
    this.getPos = getPos;
    this.dom = createElementWithClass('div', 'cell-checkbox');
    this.dom.contentEditable = 'false';

    this.checkBox = document.createElement('div');
    this.checkBox.classList.add('checkbox');
    this.checkBox.contentEditable = 'false';

    if (this.node.attrs.checked) {
      this.dom.classList.add('checked');
    }

    // to prevent focus loose when clicking the checkbox
    this.dom.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    this.dom.addEventListener('click', () => {
      this.dom.className = `cell-checkbox ${
        !this.node.attrs.checked ? 'checked' : ''
      }`;

      // update state
      const {tr} = this.view.state;
      const newAttrs = this.node.attrs;
      Object.assign(newAttrs, {checked: !this.node.attrs.checked});
      tr.setNodeMarkup(this.getPos(), undefined, newAttrs);
      this.view.dispatch(tr);
      this.view.focus();
    });

    this.setDOMAttrsFromNode(this.node)

    this.dom.appendChild(this.checkBox);
  }

  setDOMAttrsFromNode(node) {
    const extraAttrs = setNodeAttrs(node, checkboxExtraAttrs);
    this.dom.style = `${extraAttrs.style}`;
    Object.keys(extraAttrs).forEach((attr) => {
      this.dom.setAttribute(attr, extraAttrs[attr]);
    })
  }

  setDomAttrs(node, element) {
    Object.keys(node.attrs || {}).forEach((attr) => {
      element.setAttribute(attr, node.attrs[attr]);
    });
  }

  ignoreMutation(event) {
    return event.type !== 'selection';
  }

  update(node) {
    if (node.type !== this.node.type) return false;
    if (!this.node.sameMarkup(node)) return false;

    this.setDOMAttrsFromNode(this.node)

    return true;
  }
}

export default CheckboxNodeView;
