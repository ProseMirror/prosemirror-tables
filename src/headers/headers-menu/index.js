import {Plugin, PluginKey} from 'prosemirror-state';
import TableHeadersMenuView from './menu-view';
import {menuItems} from './items';
import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';

window.id = `user_${new Date().getTime()}`;

export const tableHeadersMenuKey = new PluginKey('headersMenu');

export const tableHeadersMenu = () => {
  return new Plugin({
    key: tableHeadersMenuKey,
    view(view) {
      const menuView = new TableHeadersMenuView(menuItems, view);

      return menuView;
    },
    state: {
      init() {
        return null;
      },
      apply(tr, value, oldState, newState) {
        const headerData = tr.getMeta(tableHeadersMenuKey);

        if (
          headerData &&
          headerData.id === window.id &&
          headerData.action === 'open'
        ) {
          return headerData;
        }

        if (
          headerData &&
          headerData.id === window.id &&
          headerData.action === 'close'
        ) {
          return null;
        }

        return value;
      },
    },
  });
};
