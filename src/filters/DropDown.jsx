import React, {useState, useCallback, useRef} from 'react'

// export type DropDownItemType = {
//   label: string;
//   onSelect: (payload?: any) => void; // should be uniq
//   separate?: boolean;
//   className?: string;
//   icon?: keyof Icons | undefined;
// };

// interface DropDownItemProps {
//   item: DropDownItemType;
//   onSelect: () => void;
// }

// interface DropDownProps {
//   options: DropDownItemType[];
//   parentRef?: any;
//   className?: string;
//   showArrow?: boolean;
//   Label: keyof Icons | JSXElementConstructor<{}>;
//   payload?: any;
// }

const DropDownItem = ({ item, onSelect }) => {
  const {className, label} = item;
  return (
    <button
      type="button"
      className={`dropdownItem ${separate && "separate"} ${className}`}
      onClick={onSelect}
    >
      <span className="dropdownItemLabel">{label}</span>
    </button>
  );
};

const DropDown = ({
  options,
  parentRef,
  className,
  showArrow,
  Label,
  payload,
}) => {
  const [showDropDown, setShowDropDown] = useState(false);
  const dropDownRef = useRef();

  const closeDropDown = useCallback(() => {
    setShowDropDown(false);
    if (
      dropDownRef.current &&
      dropDownRef.current.classList.contains("open-up")
    ) {
      dropDownRef.current.classList.remove("open-up");
    }
    document.removeEventListener("click", closeDropDown);
  }, [dropDownRef, setShowDropDown]);

  const openDropDown = useCallback(() => {
    if (parentRef) {
      const dropdownRect = dropDownRef.current.getBoundingClientRect();
      const parentRect = parentRef.current.getBoundingClientRect();

      if (
        dropdownRect.top >
        (parentRect.bottom - parentRect.top) / 2 + parentRect.top
      ) {
        dropDownRef.current.classList.add("open-up");
      }
    }

    setShowDropDown(!showDropDown);
    if (showDropDown === false)
      document.addEventListener("click", closeDropDown);
  }, [closeDropDown, parentRef, showDropDown]);

  return (
    <div
      className={`dropdownContainer${className ? ` ${className}` : ""}`}
      ref={dropDownRef}
    >
      <button type="button" className="dropdownButton" onClick={openDropDown}>
        {typeof Label === "string" ? <Icon icon={Label} /> : <Label />}
        {showArrow && <Icon icon="CaretDown" />}
      </button>
      {showDropDown && (
        <div className="dropdownItemsContainer">
          {options.map((item) => {
            return (
              <DropDownItem
                item={item}
                onSelect={() => item.onSelect(payload)}
                key={item.label}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropDown;