import React from 'react';
import ReactDOM from 'react-dom';
import {Plugin} from 'prosemirror-state';
import {
  generateMenuPopup,
  displayPopup,
  tableFiltersMenuKey,
  calculateMenuPosition,
  executeFilters,
} from './utils';
import {TableFiltersComponent} from './Component.jsx';
import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';

class TableFiltersMenuView {
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
      document.getElementsByClassName('tableFiltersMenu')
    );

    if (existingPopUps.length > 0) {
      existingPopUps.forEach((popup) => {
        popup.remove();
      });
    }
  }

  shouldUpdatePopup(tablesData) {
    return (
      tablesData &&
      this.tablesData &&
      (tablesData.pos !== this.tablesData.pos ||
        tablesData.node.firstChild.nodeSize !== // check if headers row has changed - if so update the filters popup
          this.tablesData.node.firstChild.nodeSize)
    );
  }

  updateMenu(view) {
    // determine whether to display or hide popup - and change style accordingly
    const tablesData = displayPopup(view, this.popUpDOM);

    if (this.shouldUpdatePopup(tablesData)) {
      this.onClose();
    }

    if (!tablesData) {
      // handle close
      if (this.tablesData) this.onClose();
      // hide menu
      if (this.popUpDOM.style.display !== 'none')
        this.popUpDOM.style.display = 'none';

      return;
    }

    if (!this.tablesData && tablesData) {
      this.tablesData = tablesData;
      this.onOpen();
    }

    // calculate popup position
    calculateMenuPosition(this.popUpDOM, tablesData);

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
      <TableFiltersComponent
        dom={this.tablesData.dom}
        headerPos={this.tablesData.headerPos}
        pos={this.tablesData.pos}
        table={this.tablesData.node}
        view={this.view}
      />,
      this.popUpDOM
    );
  }

  onClose() {
    this.tablesData = null;

    ReactDOM.unmountComponentAtNode(this.popUpDOM);

    return;
  }

  destroy() {}
}

export const TableFiltersMenu = () => {
  return new Plugin({
    key: tableFiltersMenuKey,
    view(view) {
      const menuView = new TableFiltersMenuView(view);

      return menuView;
    },
    state: {
      init() {
        return null;
      },
      apply(tr, value, oldState, newState) {
        // manage filter popup display
        const action = tr.getMeta(tableFiltersMenuKey);

        if (action && action.id === window.id && action.action === 'open') {
          return action;
        }

        if (action && action.id === window.id && action.action === 'close') {
          return null;
        }

        if (!value) return null;

        // check if the headers row has changed - if so we want to update the table state so we can update the filters popup
        const table = findParentNodeOfTypeClosestToPos(
          newState.doc.resolve(value.pos),
          newState.schema.nodes.table
        );
        if (!table) return null;

        if (table.node.firstChild.nodeSize !== value.node.firstChild.nodeSize) {
          return {
            ...value,
            node: table.node,
          };
        }

        return value;
      },
    },
    appendTransaction(transactions, oldState, newState) {
      const steps = transactions.map((tr) => tr.steps).flat();
      if (steps.length) {
        for (let step = 0; step < steps.length; step++) {
          const stepResFrom = newState.doc.resolve(steps[step].from);
          const maybeTable = stepResFrom.node(1);

          if (maybeTable && maybeTable.type.name === 'table') {
            const tableStart = stepResFrom.start(1);
            const tr = executeFilters(maybeTable, tableStart, newState);
            return tr;
          }
        }
      }
      return null;
    },
  });
};
