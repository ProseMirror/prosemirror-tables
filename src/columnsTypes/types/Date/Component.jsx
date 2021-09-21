import React, {useState, useEffect, useCallback} from 'react';
import useClickOutside from '../../../useClickOutside.jsx';
import EditorContent from '../../../ReactNodeView/EditorContent.jsx'
import {tableDateMenuKey} from './utils'
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import StaticDatePicker from '@mui/lab/StaticDatePicker';



const DateComponent = ({view, node, getPos, editorContentRef, dom}) => {
  const [date, setDate] = useState(new Date());

  const openChooser = useCallback((e) => {
    const {tr} = view.state;
    tr.setMeta(tableDateMenuKey, {
      pos: getPos(),
      dom: dom,
      node: node,
      id: window.id,
      action: 'open',
    });
    setTimeout(() => view.dispatch(tr), 0);
  }, [dom, node])
  
  return <div onClick={openChooser}><EditorContent ref={editorContentRef}/></div>
}

export const DatePickerComponent = ({view, node, pos, dom, textContent}) => {
  const [date, setDate] = useState(new Date(textContent));

  const ref = useClickOutside((e) => {
    const {tr} = view.state;
    tr.setMeta(tableDateMenuKey, {
      id: window.id,
      action: 'close',
    });
    setTimeout(() => view.dispatch(tr), 0);
  })

  const handleChange = useCallback((newValue) => {
    setDate(newValue);
    if (pos) {
      const {tr} = view.state;
      tr.insertText(newValue.toDateString(), pos + 1, pos + node.nodeSize - 1);

      tr.setMeta(tableDateMenuKey, {
        id: window.id,
        action: 'close',
      });

      view.dispatch(tr);
    };
  }, [view, pos, node])

  return (
    <div className='date-picker' ref={ref}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          openTo="day"
          value={date}
          onChange={handleChange}
          renderInput={() => <></>}
        />
      </LocalizationProvider>
    </div>
  );
};

export default DateComponent;