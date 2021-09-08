import ReactNodeView from '../../../ReactNodeView/ReactNodeView';
import {createElementWithClass} from '../../../util';

class LabelTypeNodeView extends ReactNodeView {
  createDOM() {
    const dom = createElementWithClass('div', 'cell-label');

    return dom;
  }
}

export default LabelTypeNodeView;
