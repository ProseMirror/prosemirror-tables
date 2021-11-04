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
  randomString,
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
          <span className="remove-label-icon"></span>
        </button>
      )}
    </div>
  );
};

const LabelOption = ({
  color,
  title,
  onChange,
  checked,
  onDelete,
  inFilters,
}) => {
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
      {inFilters ? (
        <></>
      ) : (
        <button
          className="remove-label"
          onClick={(e) => {
            onDelete(title);
            e.stopPropagation();
            e.preventDefault();
          }}
          type="button"
        >
          <span className="remove-label-icon"></span>
        </button>
      )}
    </div>
  );
};

export const LabelsChooser = ({
  view,
  pos,
  node,
  inFilters,
  handleLabelChoose,
  initialChosenLabels,
  onClose,
}) => {
  const [tableLabels, setTableLabels] = useState([]);
  const [chosenLabels, setChosenLabels] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(
    stringToColor(randomString())
  );

  const handleClose = (currentChosenLabels) => {
    if (onClose) onClose();
    if (inFilters) return;
    if (typeof currentChosenLabels === 'string') {
      addLabel(view, pos, node, {
        title: currentChosenLabels,
        color: newLabelColor,
      });
    } else {
      updateCellLabels(view, pos, node, currentChosenLabels);
    }
  };

  const ref = useClickOutside(() => {
    handleClose(chosenLabels);
  }, 'mousedown');

  const filteredLabels =
    inputValue === ''
      ? tableLabels
      : tableLabels.filter((label) =>
          label.title.toLowerCase().includes(inputValue.toLowerCase())
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
    setChosenLabels(initialChosenLabels);

    return () => (ref.current = undefined);
  }, []);

  const handleLabelCheck = React.useCallback(
    (title, color, checked) => {
      if (inFilters) handleLabelChoose(title, checked, chosenLabels);

      if (checked) {
        setChosenLabels((oldChosen) => [...oldChosen, {title, color}]);
      } else {
        setChosenLabels((oldChosen) =>
          oldChosen.filter((label) => label.title !== title)
        );
      }
      const input = document.getElementById('labels-input');
      if (input) input.focus();
    },
    [chosenLabels]
  );

  const createNewLabel = React.useCallback(() => {
    inputValue.length
      ? handleClose(inputValue)
      : () => {
          const input = document.getElementById('labels-input');
          if (input) input.focus();
        };

    setNewLabelColor(stringToColor(randomString()));
  }, [inputValue, handleClose]);

  const handleLabelDelete = (labelTitle) => {
    const {tr} = view.state;
    updateTablesLabels(tr, pos, 'remove', [labelTitle]);
    removeLabelsFromTableCells(view.state, pos, labelTitle, tr);
    view.dispatch(tr);

    setTableLabels((oldLabels) =>
      oldLabels.filter((label) => label.title !== labelTitle)
    );
    setChosenLabels((oldLabels) =>
      oldLabels.filter((label) => label.title !== labelTitle)
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
              inFilters ? () => null : createNewLabel();
            }
          }}
          type="text"
        />
        <div className="labels-list">
          {filteredLabels.length ? (
            filteredLabels.map(({title, color}, index) => (
              <LabelOption
                checked={chosenLabels.find((label) => label.title === title)}
                color={color}
                inFilters={inFilters}
                key={`${title}${index}`}
                onChange={(title, checked) =>
                  handleLabelCheck(title, color, checked)
                }
                onDelete={handleLabelDelete}
                title={title}
              />
            ))
          ) : (
            <div className="add-new-label" onClick={createNewLabel}>
              {inputValue.length && !inFilters ? (
                <>
                  +
                  <span
                    className="label-color"
                    style={{backgroundColor: `${newLabelColor}`}}
                  ></span>
                  <span className="new-label-title">Create "{inputValue}"</span>
                </>
              ) : (
                <>
                  <span className="new-label-placeholder">
                    {inFilters
                      ? 'Type to search for labels'
                      : 'Type to create new label'}
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
        {labels.map(({title, color}, index) => (
          <Label
            color={color}
            key={`${color}${title}${index}`}
            onDelete={() => removeLabel(view, getPos(), node, title)}
            showDelete={view.editable}
            title={title}
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
