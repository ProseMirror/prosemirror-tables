import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';
import {PluginKey} from 'prosemirror-state';
import {createHash} from 'crypto';
import {getColCells} from '../../../util';

export const tableLabelsMenuKey = new PluginKey('TableLabelsMenu');

export const sha256 = (data) => {
  return createHash('sha256').update(data).digest('base64');
};

export const stringToHash = (strToHash) => {
  // randomize so similar words have different colors
  let hash = 0;
  if (strToHash.length === 0) {
    return hash;
  }
  for (let i = 0; i < strToHash.length; i += 1) {
    const char = strToHash.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return hash;
};

export const stringToColor = (str, opacity = '1.0') => {
  const stringHash = sha256(str);
  const numericalHash = stringToHash(stringHash);
  const shortened = numericalHash % 360;
  return `hsla(${shortened}, 68%, 48%, ${opacity})`;
};

export const addLabel = (view, pos, node, newLabel) => {
  const currentLabels = node.attrs.labels;

  const {tr} = view.state;

  const newAttrs = {
    ...node.attrs,
    labels: [...currentLabels, newLabel],
  };

  tr.replaceRangeWith(
    pos,
    pos + 1,
    view.state.schema.nodes.label.create(newAttrs)
  );

  updateTablesLabels(tr, pos, 'add', [newLabel]);
  tr.setMeta(tableLabelsMenuKey, {action: 'close', id: window.id});

  view.dispatch(tr);
};

export const removeLabel = (view, pos, node, labelTitle) => {
  const currentLabels = node.attrs.labels;

  const {tr} = view.state;

  const newAttrs = {
    ...node.attrs,
    labels: currentLabels.filter((label) => label.title !== labelTitle),
  };

  tr.replaceRangeWith(
    pos,
    pos + 1,
    view.state.schema.nodes.label.create(newAttrs)
  );
  view.dispatch(tr);
};

export const updateTablesLabels = (tr, pos, action = 'add', newLabels) => {
  const table = findParentNodeOfTypeClosestToPos(
    tr.doc.resolve(pos),
    tr.doc.type.schema.nodes.table
  );

  if (!table) return;

  let newAttrs;
  if (action === 'add') {
    newAttrs = {
      ...table.node.attrs,
      labels: getUniqueListBy(
        [...table.node.attrs.labels, ...newLabels],
        'title'
      ),
    };
  }
  if (action === 'remove') {
    newAttrs = {
      ...table.node.attrs,
      labels: table.node.attrs.labels.filter(
        (label) => !newLabels.find((newLabel) => newLabel === label.title)
      ),
    };
  }

  tr.setNodeMarkup(table.pos, undefined, newAttrs);
};

export const updateCellLabels = (view, pos, node, labels) => {
  const {tr} = view.state;

  const newAttrs = {
    ...node.attrs,
    labels,
  };

  tr.replaceRangeWith(
    pos,
    pos + 1,
    view.state.schema.nodes.label.create(newAttrs)
  );

  updateTablesLabels(tr, pos, 'add', labels);
  tr.setMeta(tableLabelsMenuKey, {action: 'close', id: window.id});

  view.dispatch(tr);
};

export const generateMenuPopup = () => {
  const menuElement = document.createElement('div');
  menuElement.className = `tableLabelsMenu`;
  menuElement.dataset.test = `table-labels-menu`;
  menuElement.style.display = 'none';
  menuElement.style.position = 'absolute';
  menuElement.style.zIndex = '200';

  return menuElement;
};

export const displayPopup = (view, popupDOM) => {
  const cellData = tableLabelsMenuKey.getState(view.state);

  if (cellData) {
    popupDOM.style.display = 'flex';
    return cellData;
  }

  return null;
};

export const calculateMenuPosition = (menuDOM, {node, dom: cellDOM, pos}) => {
  const {style} = menuDOM;

  const {left, top, height: cellHeight} = cellDOM.getBoundingClientRect();

  if (left === 0 || top === 0) return;

  // scroll offset
  const [scrolledEl] = document.getElementsByClassName('czi-editor-frame-body');
  const {x: EDITOR_LEFT_OFFSET, y: EDITOR_TOP_OFFSET} =
    scrolledEl.getBoundingClientRect();

  style.top = `${
    top - EDITOR_TOP_OFFSET + (scrolledEl.scrollTop || 0) - 70 + cellHeight
  }px`;
  style.left = `${left - EDITOR_LEFT_OFFSET - 20}px`;
};

export const removeLabelsFromTableCells = (state, pos, deletedLabel, tr) => {
  const cells = getColCells(pos - 1, state);
  cells.forEach((cell) => {
    const dateNode = cell.node.firstChild;
    const updatedLabels = dateNode.attrs.labels.filter(
      (label) => label.title !== deletedLabel
    );
    tr.setNodeMarkup(cell.pos + 1, undefined, {
      ...dateNode.attrs,
      labels: updatedLabels,
    });
  });
};

export const randomString = () => {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 12 characters
  // after the decimal.
  return '_' + Math.random().toString(36).substr(2, 12);
};

function getUniqueListBy(arr, key) {
  return [...new Map(arr.map((item) => [item[key], item])).values()];
}
