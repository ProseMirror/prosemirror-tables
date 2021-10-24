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
      className={`selectDropDownItem ${
        separate ? 'separate' : ''
      } ${itemStyleClass}`}
      onClick={onValueChange}
      type="button"
    >
      {hasIcon && <span className="selectDropDownIteIcon"></span>}
      <span className="selectDropDownItemLabel">{label}</span>
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
      className={`selectDropDownContainer${className ? ` ${className}` : ''}`}
      ref={dropDownRef}
    >
      <button
        className={`selectDropDownButton ${disableDropDown && 'disabled'}`}
        disabled={disableDropDown}
        onClick={openDropDown}
        type="button"
      >
        <span
          className={`selectedIcon ${
            items.find((item) => item.value === value)?.itemStyleClass
          }`}
        ></span>
        <span className="selectedLabel">
          {items.find((item) => item.value === value)?.label}
        </span>
        <span className="dropDownArrow"></span>
      </button>
      {showDropDown && (
        <div className="selectDropDownSelection">
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
