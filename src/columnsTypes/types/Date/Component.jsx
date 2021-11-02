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
import DateUtilDayJS from '@date-io/dayjs';
import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';
import {
  StylesProvider,
  createGenerateClassName,
} from '@material-ui/core/styles';
import DatePickerTheme from './DatePickerTheme';
import {ThemeProvider} from '@material-ui/core/styles';

const generateClassName = createGenerateClassName({
  seed: 'sgo-tables-plugin-',
});

const DateComponent = ({view, node, getPos, editorContentRef, dom}) => {
  const openChooser = (e) => {
    const {tr} = view.state;
    tr.setMeta(tableDateMenuKey, {
      pos: getPos(),
      dom: dom,
      node: node,
      id: window.id,
      action: 'open',
    });

    view.dispatch(tr);
  };

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

export const DatePickerComponent = ({view, node, pos}) => {
  const [date, setDate] = useState(
    buildDateObjectFromText(node ? node.textContent : '', DATE_FORMAT) ||
      new Date()
  );

  const ref = useClickOutside((e) => {
    const dateMenuState = tableDateMenuKey.getState(view.state);
    const cellDom = dateMenuState ? dateMenuState.dom : null;
    if (!view.dom.contains(e.target)) return;
    
    const {tr} = view.state;
    tr.setMeta(tableDateMenuKey, {
      id: window.id,
      action: 'close',
    });
    view.dispatch(tr);
  });

  const handleChange = useCallback(
    (newValue) => {
      const newDate = newValue.toDate();
      setDate(newDate);
      if (pos) {
        const {tr} = view.state;

        const dateNode = findParentNodeOfTypeClosestToPos(
          tr.doc.resolve(pos + 1),
          view.state.schema.nodes.date
        );
        if (!dateNode) return;

        tr.insertText(
          formatDate(newDate, DATE_FORMAT),
          dateNode.start,
          pos + dateNode.node.nodeSize - 1
        );

        tr.setNodeMarkup(dateNode.pos, undefined, {
          ...dateNode.node.attrs,
          value: newDate.getTime(),
        });

        view.dispatch(tr);
      }
    },
    [view, pos]
  );

  return (
    <div className="date-picker" ref={ref}>
      <StylesProvider generateClassName={generateClassName}>
        <ThemeProvider theme={DatePickerTheme}>
          <MuiPickersUtilsProvider utils={DateUtilDayJS}>
            <DatePicker
              autoOk
              onChange={handleChange}
              openTo="date"
              value={date}
              variant="static"
            />
          </MuiPickersUtilsProvider>
        </ThemeProvider>
      </StylesProvider>
    </div>
  );
};

export default DateComponent;
