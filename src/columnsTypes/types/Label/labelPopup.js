import React from 'react';
import ReactDOM from 'react-dom';
import {Plugin} from 'prosemirror-state';
import {
  generateMenuPopup,
  displayPopup,
  tableLabelsMenuKey,
  calculateMenuPosition,
} from './utils';
import {LabelsChooser} from './Component.jsx';

class TableLabelsMenu {
  constructor(view) {
    this.view = view;

    this.buildMenuDOM();

    // append popup to dom
    this.popUpRelativeContainer.appendChild(this.popUpDOM);
  }

  buildMenuDOM() {
    this.popUpDOM = generateMenuPopup();

    // the dom element that contains the popup - should be css relative
    this.popUpRelativeContainer = document.getElementsByClassName(
      'czi-editor-frame-body'
    )[0];

    const existingPopUps = Array.from(
      document.getElementsByClassName('tableLabelsMenu')
    );

    if (existingPopUps.length > 0) {
      existingPopUps.forEach((popup) => {
        popup.remove();
      });
    }
  }

  updateMenu(view) {
    // determine whether to display or hide popup - and change style accordingly
    const cellData = displayPopup(view, this.popUpDOM);

    // different header selected
    if (cellData && this.cellData && cellData.pos !== this.cellData.pos) {
      this.onClose();
    }

    // no header selected
    if (!cellData) {
      // handle close
      if (this.cellData) this.onClose();
      // hide menu
      if (this.popUpDOM.style.display !== 'none')
        this.popUpDOM.style.display = 'none';

      return;
    }

    if (!this.cellData && cellData) {
      this.cellData = cellData;
      this.onOpen();
    }

    // calculate popup position
    calculateMenuPosition(this.popUpDOM, cellData);

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

  onOpen() {
    ReactDOM.render(
      <LabelsChooser
        initialChosenLabels={this.cellData.node.attrs.labels}
        node={this.cellData.node}
        pos={this.cellData.pos}
        view={this.view}
      />,
      this.popUpDOM
    );
  }

  onClose() {
    this.cellData = null;

    ReactDOM.unmountComponentAtNode(this.popUpDOM);

    return;
  }

  destroy() {}
}

export const TableLabelMenu = () => {
  return new Plugin({
    key: tableLabelsMenuKey,
    view(view) {
      const menuView = new TableLabelsMenu(view);

      return menuView;
    },
    state: {
      init() {
        return null;
      },
      apply(tr, value, oldState, newState) {
        const cellData = tr.getMeta(tableLabelsMenuKey);
        if (
          cellData &&
          cellData.id === window.id &&
          cellData.action === 'open'
        ) {
          return cellData;
        }

        if (
          cellData &&
          cellData.id === window.id &&
          cellData.action === 'close'
        ) {
          return null;
        }

        return value;
      },
    },
  });
};
