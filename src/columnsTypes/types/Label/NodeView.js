import {TextSelection} from 'prosemirror-state';
import ReactNodeView from '../../../ReactNodeView/ReactNodeView';
import {createElementWithClass} from '../../../util';
import {tableLabelsMenuKey} from './utils';

class LabelTypeNodeView extends ReactNodeView {
  createDOM() {
    const dom = createElementWithClass('div', 'cell-label');
    return dom;
  }

  selectNode() {
    const {tr} = this.view.state;
    tr.setSelection(TextSelection.near(tr.doc.resolve(this.getPos()), -1));
    this.view.dispatch(tr);
  }
}

export default LabelTypeNodeView;
