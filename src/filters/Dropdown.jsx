import React, {useState, useRef, useCallback, useMemo} from 'react';

// export type DropdownItemType = {
//   label: any;
//   value: any; // should be uniq
//   separate?: boolean;
//   notClickable?: boolean;
//   itemStyleClass?: string;
// };

// interface DropdownItemProps {
//   label: any;
//   onValueChange: () => void;
//   selected: boolean;
//   separate: boolean;
//   notClickable?: boolean;
//   itemStyleClass?: string;
//   hasIcon: boolean;
// }

// interface DropdownProps {
//   items: DropdownItemType[];
//   initialValue: any;
//   onValueChange: (value: any) => void;
//   parentRef?: any;
//   className?: string;
// }

const DropdownItem = ({
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

export const SelectDropdownButton = ({
  disableDropdown,
  openDropdown,
  itemStyleClass,
  label,
}) => {
  return (
    <button
      className={`select-dropdown-button ${disableDropdown && 'disabled'}`}
      disabled={disableDropdown}
      onClick={openDropdown}
      type="button"
    >
      <span className={`selected-icon ${itemStyleClass}`}></span>
      <span className="selected-label">{label}</span>
      <span className="dropdown-arrow"></span>
    </button>
  );
};

const SelectDropdown = ({
  items,
  initialValue,
  onValueChange,
  parentRef,
  className,
}) => {
  const [value, setValue] = useState(initialValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropDownRef = useRef();

  const closeDropdown = useCallback(() => {
    setShowDropdown(false);
    if (
      dropDownRef.current &&
      dropDownRef.current.classList.contains('open-up')
    ) {
      dropDownRef.current.classList.remove('open-up');
    }
    document.removeEventListener('click', closeDropdown);
  }, [dropDownRef, setShowDropdown]);

  const openDropdown = useCallback(() => {
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

    setShowDropdown(!showDropdown);
    if (!showDropdown) document.addEventListener('click', closeDropdown);
  }, [closeDropdown, parentRef, showDropdown]);

  const updateValue = useCallback(
    (value) => {
      setValue(value);
      onValueChange(value);
    },
    [onValueChange]
  );

  const disableDropdown = useMemo(() => items.length === 1, [items]);

  return (
    <div
      className={`${showDropdown ? 'open' : 'close'} select-dropdown-container${className ? ` ${className}` : ''}`}
      ref={dropDownRef}
    >
      <SelectDropdownButton
        disableDropdown={disableDropdown}
        itemStyleClass={
          items.find((item) => item.value === value)?.itemStyleClass
        }
        label={items.find((item) => item.value === value)?.label}
        openDropdown={openDropdown}
      />
      {showDropdown && (
        <div className="select-dropdown-selection">
          {items.map((item) => {
            return (
              <DropdownItem
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

export default SelectDropdown;
