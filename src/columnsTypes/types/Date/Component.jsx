import React, {useState, useCallback, useEffect} from 'react';
import useClickOutside from '../../../useClickOutside.jsx';
import EditorContent from '../../../ReactNodeView/EditorContent.jsx';
import {
  formatDate,
  tableDateMenuKey,
  DATE_FORMAT,
  buildDateObjectFromText,
} from './utils';

import {DatePicker, MuiPickersUtilsProvider} from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';

const DateComponent = ({view, node, getPos, editorContentRef, dom}) => {
  const openChooser = useCallback(
    (e) => {
      const {tr} = view.state;
      tr.setMeta(tableDateMenuKey, {
        pos: getPos(),
        dom: dom,
        node: node,
        id: window.id,
        action: 'open',
      });
      setTimeout(() => view.dispatch(tr), 0);
    },
    [dom, node]
  );

  const pos = getPos();

  useEffect(() => {
    const dateFromAttrs = node.attrs.value;
    if (dateFromAttrs === -1 || !pos) return;
    const formattedDate = formatDate(new Date(dateFromAttrs), DATE_FORMAT);
    if (formattedDate !== node.textContent) {
      const {tr} = view.state;
      tr.insertText(formattedDate, pos + 1, pos + node.nodeSize - 1);

      view.dispatch(tr);
    }
  }, [pos]);

  return (
    <div
      className={`${DATE_FORMAT.replaceAll('/', '_')} date-component`}
      onClick={openChooser}
    >
      <EditorContent ref={editorContentRef} />
    </div>
  );
};

export const DatePickerComponent = ({view, node, pos, dom}) => {
  const [date, setDate] = useState(
    buildDateObjectFromText(node.textContent, DATE_FORMAT) || new Date()
  );

  const ref = useClickOutside((e) => {
    const dateMenuState = tableDateMenuKey.getState(view.state);
    const cellDom = dateMenuState ? dateMenuState.dom : null;
    if (!e || !cellDom || cellDom.contains(e.target)) return;

    const {tr} = view.state;
    tr.setMeta(tableDateMenuKey, {
      id: window.id,
      action: 'close',
    });
    view.dispatch(tr);
  });

  const handleChange = useCallback(
    (newValue) => {
      setDate(newValue);
      if (pos) {
        const {tr} = view.state;

        const dateNode = findParentNodeOfTypeClosestToPos(
          tr.doc.resolve(pos + 1),
          view.state.schema.nodes.date
        );
        if (!dateNode) return;

        tr.insertText(
          formatDate(newValue, DATE_FORMAT),
          dateNode.start,
          pos + dateNode.node.nodeSize - 1
        );

        tr.setNodeMarkup(dateNode.pos, undefined, {
          ...dateNode.node.attrs,
          value: newValue.getTime(),
        });

        view.dispatch(tr);
      }
    },
    [view, pos]
  );

  return (
    <div className="date-picker" ref={ref}>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <DatePicker
          autoOk
          onChange={handleChange}
          openTo="date"
          value={date}
          variant="static"
        />
      </MuiPickersUtilsProvider>
    </div>
  );
};

export default DateComponent;
