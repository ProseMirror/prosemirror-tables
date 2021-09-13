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
}

export default DateTypeNodeView;
