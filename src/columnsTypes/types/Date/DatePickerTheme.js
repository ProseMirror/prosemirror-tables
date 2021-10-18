import { createTheme } from '@material-ui/core';

/**
 * customizes/overrides the mui-picker theme
 * to match the rest of the app color scheme,
 * typography, and sizing.
*/
const DatePickerTheme = createTheme({
  overrides: {
    MuiPickersToolbar: {
      toolbar: {
        backgroundColor: '#2196f3',
        '& *': {
          fontFamily: 'Mulish, sans-serif !important'
        },
        '&& h3': {
          fontSize: '38px !important'
        }
      }
    },
    MuiInput: {
      underline: {
        '&:before': {
          border: 'none !important'
        },
        '&:after': {
          border: 'none !important'
        }
      }
    },
    MuiPickersCalendarHeader: {
      dayLabel: {
        fontFamily: 'Mulish, sans-serif !important'
      },
      switchHeader: {
        '& *': {
          fontFamily: 'Mulish, sans-serif !important'
        }
      }
    },
    MuiButton: {
      label: {
        fontFamily: 'Mulish, sans-serif !important',
        color: '#2196f3',
        fontWeight: 600
      }
    },
    MuiPickersClock: {
      pin: {
        backgroundColor: '#2196f3'
      },
      clock: {
        '&& span': {
          fontFamily: 'Mulish, sans-serif !important'
        }
      }
    },
    MuiPickersClockPointer: {
      pointer: {
        backgroundColor: '#2196f3'
      },
      noPoint: {
        backgroundColor: '#2196f3'
      },
      thumb: {
        border: '14px solid #2196f3'
      }
    },
    MuiDialog: {
      container: {
        background: 'var(--scrim)'
      }
    },
    MuiPickersDay: {
      day: {
        '& *': {
          fontFamily: 'Mulish, sans-serif !important'
        }
      },
      current: {
        color: '#2196f3'
      },
      daySelected: {
        backgroundColor: '#2196f3',
        '&:hover': {
          backgroundColor: '#177bcb'
        }
      }
    }
  }
}); // see https://github.com/mui-org/material-ui-pickers/issues/1858

export default DatePickerTheme;
