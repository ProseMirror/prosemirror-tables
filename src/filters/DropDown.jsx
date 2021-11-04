import React, {useState, useRef, useCallback, useMemo} from 'react';

// export type DropDownItemType = {
//   label: any;
//   value: any; // should be uniq
//   separate?: boolean;
//   notClickable?: boolean;
//   itemStyleClass?: string;
// };

// interface DropDownItemProps {
//   label: any;
//   onValueChange: () => void;
//   selected: boolean;
//   separate: boolean;
//   notClickable?: boolean;
//   itemStyleClass?: string;
//   hasIcon: boolean;
// }

// interface DropDownProps {
//   items: DropDownItemType[];
//   initialValue: any;
//   onValueChange: (value: any) => void;
//   parentRef?: any;
//   className?: string;
// }

const DropDownItem = ({
  label,
  onValueChange,
  selected,
  separate,
  itemStyleClass,
  hasIcon,
}) => {
  return (
    <button
      className={`select-dropdown-item ${
        separate ? 'separate' : ''
      } ${itemStyleClass}`}
      onClick={onValueChange}
      type="button"
    >
      {hasIcon && <span className="select-dropdown-item-icon"></span>}
      <span className="select-dropdown-itemLabel">{label}</span>
    </button>
  );
};

export const SelectDropDownButton = ({
  disableDropDown,
  openDropDown,
  itemStyleClass,
  label,
}) => {
  return (
    <button
      className={`select-dropdown-button ${disableDropDown && 'disabled'}`}
      disabled={disableDropDown}
      onClick={openDropDown}
      type="button"
    >
      <span className={`selected-icon ${itemStyleClass}`}></span>
      <span className="selected-label">{label}</span>
      <span className="dropdown-arrow"></span>
    </button>
  );
};

const SelectDropDown = ({
  items,
  initialValue,
  onValueChange,
  parentRef,
  className,
}) => {
  const [value, setValue] = useState(initialValue);
  const [showDropDown, setShowDropDown] = useState(false);
  const dropDownRef = useRef();

  const closeDropDown = useCallback(() => {
    setShowDropDown(false);
    if (
      dropDownRef.current &&
      dropDownRef.current.classList.contains('open-up')
    ) {
      dropDownRef.current.classList.remove('open-up');
    }
    document.removeEventListener('click', closeDropDown);
  }, [dropDownRef, setShowDropDown]);

  const openDropDown = useCallback(() => {
    if (parentRef) {
      const dropdownRect = dropDownRef.current.getBoundingClientRect();
      const parentRect = parentRef.current.getBoundingClientRect();

      if (
        dropdownRect.top >
        (parentRect.bottom - parentRect.top) / 2 + parentRect.top
      ) {
        dropDownRef.current.classList.add('open-up');
      }
    }

    setShowDropDown(!showDropDown);
    if (!showDropDown) document.addEventListener('click', closeDropDown);
  }, [closeDropDown, parentRef, showDropDown]);

  const updateValue = useCallback(
    (value) => {
      setValue(value);
      onValueChange(value);
    },
    [onValueChange]
  );

  const disableDropDown = useMemo(() => items.length === 1, [items]);

  return (
    <div
      className={`select-dropdown-container${className ? ` ${className}` : ''}`}
      ref={dropDownRef}
    >
      <SelectDropDownButton
        disableDropDown={disableDropDown}
        itemStyleClass={
          items.find((item) => item.value === value)?.itemStyleClass
        }
        label={items.find((item) => item.value === value)?.label}
        openDropDown={openDropDown}
      />
      {showDropDown && (
        <div className="select-dropdown-selection">
          {items.map((item) => {
            return (
              <DropDownItem
                hasIcon={item.hasIcon}
                itemStyleClass={item.itemStyleClass}
                key={item.value}
                label={item.label}
                onValueChange={() =>
                  item?.notClickable ? () => null : updateValue(item.value)
                }
                selected={item.value === value}
                separate={!!item.separate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SelectDropDown;
