import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';
import React, {useState, useEffect} from 'react';
import {
  addLabel,
  removeLabel,
  stringToColor,
  updateCellLabels,
  tableLabelsMenuKey,
  updateTablesLabels,
  removeLabelsFromTableCells,
} from './utils';
import useClickOutside from '../../../useClickOutside.jsx';

const Label = ({title, onDelete, color, showDelete}) => {
  return (
    <div className="label-container">
      <span
        className="label-color"
        style={{backgroundColor: `${color}`}}
      ></span>
      <span className="label-title">{title}</span>
      {showDelete && (
        <button
          className="remove-label"
          onClick={() => onDelete()}
          type="button"
        >
          x
        </button>
      )}
    </div>
  );
};

const LabelOption = ({color, title, onChange, checked, onDelete}) => {
  const [selected, setSelected] = useState(checked);

  return (
    <div
      className="label-option"
      onClick={() => {
        setSelected(!selected);
        onChange(title, !selected);
      }}
    >
      <img
        className={
          selected ? 'label-option-checkbox selected' : 'label-option-checkbox'
        }
      />
      <span
        className="label-color"
        style={{backgroundColor: `${color}`}}
      ></span>
      <span className="label-title">{title}</span>
      <button
        className="remove-label"
        onClick={(e) => {
          onDelete(title);
          e.stopPropagation();
          e.preventDefault();
        }}
        type="button"
      >
        x
      </button>
    </div>
  );
};

export const LabelsChooser = ({view, pos, node}) => {
  const [tableLabels, setTableLabels] = useState([]);
  const [chosenLabels, setChosenLabels] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const handleClose = React.useCallback(
    (currentChosenLabels) => {
      if (typeof currentChosenLabels === 'string') {
        addLabel(view, pos, node, currentChosenLabels);
      } else {
        updateCellLabels(view, pos, node, currentChosenLabels);
      }
      const {tr} = view.state;
      tr.setMeta(tableLabelsMenuKey, {action: 'close', id: window.id});
      view.dispatch(tr);
    },
    [node, pos, view, chosenLabels]
  );

  const ref = useClickOutside(() => {
    handleClose(chosenLabels);
  });

  const filteredLabels =
    inputValue === ''
      ? tableLabels
      : tableLabels.filter((label) =>
          label.toLowerCase().includes(inputValue.toLowerCase())
        );

  useEffect(() => {
    const input = document.getElementById('labels-input');
    if (input) input.focus();

    const tableParent = findParentNodeOfTypeClosestToPos(
      view.state.doc.resolve(pos),
      view.state.schema.nodes.table
    );
    if (!tableParent) handleClose();

    setTableLabels(tableParent.node.attrs.labels);
    setChosenLabels(node.attrs.labels);
  }, []);

  const handleLabelCheck = React.useCallback((title, checked) => {
    if (checked) {
      setChosenLabels((oldChosen) => [...oldChosen, title]);
    } else {
      setChosenLabels((oldChosen) =>
        oldChosen.filter((label) => label !== title)
      );
    }
    const input = document.getElementById('labels-input');
    if (input) input.focus();
  }, []);

  const createNewLabel = React.useCallback(() => {
    inputValue.length
      ? handleClose(inputValue)
      : () => {
          const input = document.getElementById('labels-input');
          if (input) input.focus();
        };
  }, [inputValue, handleClose]);

  const handleLabelDelete = (labelTitle) => {
    const {tr} = view.state;
    updateTablesLabels(tr, pos, 'remove', [labelTitle]);
    removeLabelsFromTableCells(view.state, pos, labelTitle, tr);
    view.dispatch(tr);

    setTableLabels((oldLabels) =>
      oldLabels.filter((label) => label !== labelTitle)
    );
  };

  return (
    <>
      <div className="labels-chooser-container" ref={ref}>
        <input
          className="labels-search"
          id="labels-input"
          onChange={(e) => setInputValue(e.target.value)}
          onClick={() => {
            const input = document.getElementById('labels-input');
            if (input) input.focus();
          }}
          onKeyDown={(e) => {
            if (!view) return;
            e.stopPropagation();
            view.editable = false;

            if (e.key === 'Enter' && filteredLabels.length === 0) {
              createNewLabel();
            }
          }}
          type="text"
        />
        <div className="labels-list">
          {filteredLabels.length ? (
            filteredLabels.map((label, index) => (
              <LabelOption
                checked={chosenLabels.includes(label)}
                color={stringToColor(label)}
                key={`${label}${index}`}
                onChange={handleLabelCheck}
                onDelete={handleLabelDelete}
                title={label}
              />
            ))
          ) : (
            <div className="add-new-label" onClick={createNewLabel}>
              {inputValue.length ? (
                <>
                  +
                  <span
                    className="label-color"
                    style={{backgroundColor: `${stringToColor(inputValue)}`}}
                  ></span>
                  <span className="new-label-title">Create "{inputValue}"</span>
                </>
              ) : (
                <>
                  <span className="new-label-placeholder">
                    Type To Create New Label
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const LabelComponent = ({view, node, getPos, dom}) => {
  const labels = node.attrs.labels;

  return (
    <>
      <div className="all-labels-container">
        {labels.map((label, index) => (
          <Label
            color={stringToColor(label)}
            key={`${label.color}${index}`}
            onDelete={() => removeLabel(view, getPos(), node, label)}
            showDelete={view.editable}
            title={label}
          />
        ))}

        {view.editable && (
          <button
            className="add-label"
            onClick={(e) => {
              const {tr} = view.state;
              tr.setMeta(tableLabelsMenuKey, {
                pos: getPos(),
                dom: dom,
                node: node,
                id: window.id,
                action: 'open',
              });
              setTimeout(() => view.dispatch(tr), 0);

              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <span>+</span>
          </button>
        )}
      </div>
    </>
  );
};

export default LabelComponent;
