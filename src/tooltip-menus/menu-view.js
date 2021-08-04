import {
  generateMenuPopup,
  displayPopup,
  calculatePopupPosition,
  addTooltips,
} from './utils';
import {renderGrouped} from 'prosemirror-menu';
import {tooltips} from './items';

/**
 * class attached to the editor and update table tooltip on every view update.
 * on each update executes updateMenu(view) - determine wether to show/hide the menu
 * and where to place him according to the selection.
 */
class TablePopUpMenuView {
  constructor(items, view) {
    this.view = view;
    this.items = items;
    this.popUpDOM = generateMenuPopup();

    // the dom element that contains the popup - should be css relative
    this.popUpRelativeContainer = document.getElementsByClassName(
      'czi-editor-frame-body'
    )[0];

    // sometimes there is already an instance of the popup - TODO: understand why...
    const existingPopUps = Array.from(
      document.getElementsByClassName('tablePopup')
    );

    if (existingPopUps.length > 0) {
      existingPopUps.forEach((popup) => {
        popup.remove();
      });
    }

    // append popup to dom
    this.popUpRelativeContainer.appendChild(this.popUpDOM);

    // add event listeners to color in red before deleting rows/cols
    this.popUpDOM.addEventListener('mouseover', (e) => {
      if (e.target.className !== 'deleteMenuButton') return;
      const [tableWrapper] = document.getElementsByClassName('tableFocus');
      if (!tableWrapper) return;
      tableWrapper.classList.add('markDeleteCells');
    });

    this.popUpDOM.addEventListener('mouseout', (e) => {
      if (e.target.className !== 'deleteMenuButton') return;
      const [tableWrapper] = document.getElementsByClassName('tableFocus');
      if (!tableWrapper) return;
      tableWrapper.classList.remove('markDeleteCells');
    });

    // render prosemirror menu to popUpDom
    const {dom: itemsDOM, update: updateMenuItems} = renderGrouped(
      this.view,
      items
    );
    if (itemsDOM) this.popUpDOM.appendChild(itemsDOM);

    // method to update menu items on view update
    this.updateMenuItems = updateMenuItems;

    // handle menu closing
    this.view.dom.addEventListener(
      'click',
      () => (this.popUpDOM.style.display = 'none')
    );

    // disable menu update while selecting
    this.duringSelection = false;
    this.view.dom.addEventListener('mousedown', () => {
      this.duringSelection = true;
    });
    this.view.dom.addEventListener('mouseup', () => {
      setTimeout(() => {
        this.duringSelection = false;
        this.updateMenu(this.view);
      }, 250);
    });

    // add tooltips
    addTooltips(this.popUpDOM, tooltips);
  }

  updateMenu(view) {
    // determine whether to display or hide popup - and change style accordingly
    if (!displayPopup(view, this.popUpDOM)) return;

    // Update the menu items state before calculating the position
    this.updateMenuItems(view);

    // calculate popup position
    calculatePopupPosition(view, this.popUpDOM);

    return;
  }

  update(view) {
    const {state, readOnly} = view;
    if (!state || readOnly || state.selection.empty) {
      if (this.popUpDOM.style.display !== 'none') {
        this.popUpDOM.style.display = 'none';
      }
    }

    if (!this.duringSelection) {
      this.updateMenu(view);
    }
  }

  destroy() {
    this.view.dom.removeEventListener(
      'click',
      () => (this.popUpDOM.style.display = 'none')
    );

    this.view.dom.removeEventListener('mousedown', () => {
      this.duringSelection = true;
    });
    this.view.dom.removeEventListener('mouseup', () => {
      setTimeout(() => {
        this.duringSelection = false;
        this.updateMenu(this.view);
      }, 250);
    });
  }
}

export default TablePopUpMenuView;
