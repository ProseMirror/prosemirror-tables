import React, {useState, useEffect} from 'react';
import {DatePicker, MuiPickersUtilsProvider} from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';

const DateComponent = ({view, node, getPos, editorContentRef}) => {
  const [date, setDate] = useState();

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const handleClose = React.useCallback(() => {
    const {tr} = view.state;

    const newAttrs = {
      ...node.attrs,
      value: date.getTime(),
    };

    const pos = getPos();

    tr.replaceRangeWith(
      pos,
      pos + 1,
      view.state.schema.nodes.date.create(newAttrs)
    );

    view.dispatch(tr);
  }, [date, view, node]);

  useEffect(() => {
    const {value} = node.attrs;
    const dateFromAttrs = value !== 0 ? new Date(value) : new Date();
    setDate(dateFromAttrs);
  }, []);

  return (
    <>
      <div className="date-picker">
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <DatePicker
            disableToolbar
            format="dd/MM/yyyy"
            id="date-picker-inline"
            margin="dense"
            onChange={handleDateChange}
            onClose={handleClose}
            value={date}
            variant="inline"
          />
        </MuiPickersUtilsProvider>
      </div>
    </>
  );
};

export default DateComponent;
