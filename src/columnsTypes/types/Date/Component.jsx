import React, {useState, useCallback} from 'react';
import useClickOutside from '../../../useClickOutside.jsx';
import EditorContent from '../../../ReactNodeView/EditorContent.jsx';
import {formatDate, tableDateMenuKey, DATE_FORMAT} from './utils';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import StaticDatePicker from '@mui/lab/StaticDatePicker';
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

  return (
    <div
      className={`${DATE_FORMAT.replaceAll('/', '_')}`}
      onClick={openChooser}
    >
      <EditorContent ref={editorContentRef} />
    </div>
  );
};

export const DatePickerComponent = ({view, node, pos, dom, textContent}) => {
  const [date, setDate] = useState(new Date(textContent));

  const ref = useClickOutside((e) => {
    const {tr} = view.state;
    tr.setMeta(tableDateMenuKey, {
      id: window.id,
      action: 'close',
    });
    setTimeout(() => view.dispatch(tr), 0);
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

        tr.setMeta(tableDateMenuKey, {
          id: window.id,
          action: 'close',
        });

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
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          onChange={handleChange}
          openTo="day"
          renderInput={() => <></>}
          value={date}
        />
      </LocalizationProvider>
    </div>
  );
};

export default DateComponent;
