import {generateMenuPopup, displayPopup, calculateMenuPosition} from './utils';
import {renderGrouped} from 'prosemirror-menu';
import {dropdownClassName} from './items';
import {TextField} from './textField/text-field.prosemirror';
import {tableHeadersMenuKey} from '../../columnsTypes/types.config';
import {columnTypesMap} from '../../columnsTypes/types.config';
import {createElementWithClass} from '../../util';

/**
 * class attached to the editor and update table tooltip on every view update.
 * on each update executes updateMenu(view) - determine wether to show/hide the menu
 * and where to place him according to the selection.
 */
class TableHeadersMenuView {
  constructor(items, view) {
    this.view = view;
    this.items = items;

    this.buildMenuDOM();

    this.view.dom.addEventListener('mousedown', () => {
      if (this.headerData) {
        const {tr} = this.view.state;
        tr.setMeta(tableHeadersMenuKey, {action: 'close', id: window.id});
        this.view.dispatch(tr);
      }
    });

    // append popup to dom
    this.popUpRelativeContainer.appendChild(this.popUpDOM);

    // render prosemirror menu to popUpDom
    const {dom: itemsDOM, update: updateMenuItems} = renderGrouped(
      this.view,
      items
    );

    if (itemsDOM) this.popUpDOM.appendChild(itemsDOM);

    // method to update menu items on view update
    this.updateMenuItems = updateMenuItems;

    // TODO: maybe add tooltips
    // add tooltips
    // addTooltips(this.popUpDOM, tooltips);
  }

  buildMenuDOM() {
    this.popUpDOM = generateMenuPopup();

    const textInput = new TextField({
      id: 'headerInput',
      placeholder: 'Untitled',
      class: 'headerInputField',
    });

    this.inputField = textInput;
    this.inputFieldDOM = textInput.render();
    this.inputFieldDOM.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const {tr} = this.view.state;
        tr.setMeta(tableHeadersMenuKey, {action: 'close', id: window.id});
        this.view.dispatch(tr);
      }
    });

    this.popUpDOM.appendChild(this.inputFieldDOM);

    // the dom element that contains the popup - should be css relative
    this.popUpRelativeContainer = document.getElementsByClassName(
      'czi-editor-frame-body'
    )[0];

    const existingPopUps = Array.from(
      document.getElementsByClassName('headersMenu')
    );

    if (existingPopUps.length > 0) {
      existingPopUps.forEach((popup) => {
        popup.remove();
      });
    }
  }

  updateMenu(view) {
    // determine whether to display or hide popup - and change style accordingly
    const headerData = displayPopup(view, this.popUpDOM);

    // different header selected
    if (
      headerData &&
      this.headerData &&
      headerData.pos !== this.headerData.pos
    ) {
      this.onClose();
    }

    // no header selected
    if (!headerData) {
      // handle close
      if (this.headerData) this.onClose();
      // hide menu
      if (this.popUpDOM.style.display !== 'none')
        this.popUpDOM.style.display = 'none';

      return;
    }

    if (!this.headerData && headerData) {
      this.headerData = headerData;
      this.colType = headerData.node.attrs.type;
      this.onOpen();
    }

    if (this.colType !== headerData.node.attrs.type) {
      this.headerData = headerData;
      this.colType = headerData.node.attrs.type;

      this.setTypesDropdownContent();
    }

    // Update the menu items state before calculating the position
    this.updateMenuItems(view);

    // // calculate popup position
    calculateMenuPosition(this.popUpDOM, headerData);

    return;
  }

  update(view) {
    const {state, readOnly} = view;
    if (!state || readOnly) {
      if (this.popUpDOM.style.display !== 'none') {
        this.popUpDOM.style.display = 'none';
      }
    }

    this.updateMenu(view);
  }

  setTypesDropdownContent() {
    const [dropDown] = this.popUpDOM.getElementsByClassName(dropdownClassName);

    const typeId = this.headerData.node.attrs.type;

    const typeDisplayName = columnTypesMap[typeId].displayName;

    const icon = createElementWithClass('div', `${typeId}ItemIcon`);
    icon.classList.add('typeIcon');

    dropDown.innerText = typeDisplayName;
    dropDown.prepend(icon);
  }

  updateInputField(node) {
    const {textContent} = node;
    const input = this.inputField.dom;
    input.focus({preventScroll: true});

    if (!input || !textContent) {
      input.value = '';
      input.focus({preventScroll: true});

      return;
    }

    input.value = textContent;
    input.select();
  }

  onOpen() {
    // update the menu to show the column data type
    this.setTypesDropdownContent();

    // update input field to show header text
    this.updateInputField(this.headerData.node);
  }

  onClose() {
    // update the header title
    this.updateHeaderTitle();

    this.headerData = null;

    return;
  }

  updateHeaderTitle() {
    const inputFieldValue = this.inputField.read().replace(/[^\x00-\x7F]/g, '');
    const headerContent = this.headerData.node.textContent;

    if (headerContent === inputFieldValue) return;

    const schema = this.view.state.schema;
    const {pos, node} = this.headerData;
    if (!pos) return;
    const {tr} = this.view.state;
    if (inputFieldValue !== '') {
      if (headerContent === '') {
        tr.insertText(inputFieldValue, pos + 2);
      } else {
        tr.replaceRangeWith(
          pos + 2,
          pos + node.nodeSize - 2,
          schema.text(inputFieldValue)
        );
      }
    } else {
      tr.deleteRange(pos + 2, pos + node.nodeSize - 2);
    }

    this.view.dispatch(tr);
  }

  destroy() {}
}

export default TableHeadersMenuView;
