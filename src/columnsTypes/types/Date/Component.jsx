import React, {useState, useEffect} from 'react';
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import EditorContent from '../../../ReactNodeView/EditorContent.jsx';

const DateComponent = ({view, node, getPos, editorContentRef}) => {
  // const [date, setDate] = useState(new Date());
  // const [isOpen, setIsOpen] = useState(false);

  // const id = `Date-${getPos()}`;

  // const handleDateChange = (date) => {
  //   setDate(date);
  // };

  // useEffect(() => {
  //   const {value} = node.attrs;
  //   const dateFromAttrs = value !== 0 ? new Date(value) : new Date();
  //   setDate(dateFromAttrs);
  // }, []);
  console.log(node);
  return (
    <div className="date-picker" id={getPos()}>
      {/* <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <KeyboardDatePicker />
      </MuiPickersUtilsProvider> */}
      <EditorContent ref={editorContentRef} />
    </div>
  );
};

export default DateComponent;
