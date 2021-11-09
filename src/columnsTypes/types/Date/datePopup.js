import React from 'react';
import ReactDOM from 'react-dom';
import {Plugin} from 'prosemirror-state';
import {
  generateMenuPopup,
  displayPopup,
  tableDateMenuKey,
  calculateMenuPosition,
  getSelectedNode,
  setDateFormat,
} from './utils';
import {DatePickerComponent, datePopupEmitter} from './Component.jsx';
import {findParentNodeOfType} from 'prosemirror-utils';

class TableDateMenuView {
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
      document.getElementsByClassName('tableDateMenu')
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

    if (cellData && this.cellData && cellData.pos !== this.cellData.pos) {
      this.onClose();
    }

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
      this.colType = cellData.node.attrs.type;
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
      <DatePickerComponent
        dom={this.cellData.dom}
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

export const TableDateMenu = (dateFormat) => {
  setDateFormat(dateFormat);
  return new Plugin({
    key: tableDateMenuKey,
    view(view) {
      const menuView = new TableDateMenuView(view);

      return menuView;
    },
    state: {
      init() {
        return null;
      },
      apply(tr, value, oldState, newState) {
        const action = tr.getMeta(tableDateMenuKey);
        if (action && action.id === window.id && action.action === 'open') {
          return action;
        }

        if (action && action.id === window.id && action.action === 'close') {
          return null;
        }

        return value;
      },
    },
    appendTransaction(transactions, oldState, newState) {
      const sel = newState.selection;
      const dateParent = findParentNodeOfType(newState.schema.nodes.date)(sel);
      const selectionParentDom = getSelectedNode();
      if (!selectionParentDom) return null;
      const cellDom = selectionParentDom.closest('.date-component');

      const selectionInPicker = !!selectionParentDom.closest('.date-picker');

      if (!dateParent || !cellDom || sel.from !== sel.to) {
        const openMenu = tableDateMenuKey.getState(newState);
        if (openMenu && !selectionInPicker) {
          const {tr} = newState;
          tr.setMeta(tableDateMenuKey, {
            id: window.id,
            action: 'close',
          });
          return tr;
        }
        return null;
      }

      // TODO: uncomment after implementing setSelection in the Node View.
      const {tr} = newState;
      tr.setMeta(tableDateMenuKey, {
        pos: dateParent.pos,
        dom: cellDom,
        node: dateParent.node,
        id: window.id,
        action: 'open',
      });

      return tr;
    },
    props: {
      handleKeyPress(view, event) {
        emitPopupUpdate(view,event)
        return false
      }
    }
  });
};

const emitPopupUpdate = debounce((view, event) => {
  const dateNode = findParentNodeOfType(view.state.schema.nodes.date)(view.state.selection);
  if (!dateNode) return false;

  datePopupEmitter.emit('updatePopup', dateNode.node.textContent)
})

function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}