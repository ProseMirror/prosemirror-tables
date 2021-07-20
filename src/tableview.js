import {NodeSelection} from 'prosemirror-state';
import {addBottomRow, addRightColumn} from './commands';
import {createElementWithClass} from './util';

const createAddCellsButton = (type, view, pos) => {
  const isRow = type === 'row';
  const newElement = createElementWithClass(
    'button',
    `tableButton ${isRow ? 'tableAddBottomRow' : 'tableAddRightColumn'}`
  );
  newElement.innerHTML = '+';
  newElement.dataset.test = `test-${isRow ? 'tableAddBottomRow' : 'tableAddRightColumn'}`;
  newElement.contentEditable = false;
  newElement.onclick = () => {
    (isRow ? addBottomRow : addRightColumn)(view.state, view.dispatch, pos);
    view.focus();
  };
  return newElement;
};

export class TableView {
  constructor(node, cellMinWidth, view, getPos) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.cellMinWidth = cellMinWidth;
    const tableScrollWrapper = createElementWithClass(
      'div',
      'tableScrollWrapper'
    );
    this.tableWrapper = tableScrollWrapper.appendChild(
      createElementWithClass('div', 'tableWrapper')
    );
    this.dom = tableScrollWrapper;
    this.dom.dataset.test = "test-table-wrapper";

    this.tableHandle = createElementWithClass('div', 'tableHandle');
    this.tableHorizontalWrapper = createElementWithClass(
      'div',
      'tableHorizontalWrapper'
    );
    this.tableVerticalWrapper = createElementWithClass(
      'div',
      'tableVerticalWrapper'
    );

    this.tableHandle.onclick = (e) => this.selectTable(e);
    this.tableHandle.onmousedown = (e) => e.preventDefault();
    this.tableHandle.contentEditable = false;

    this.tableWrapper.appendChild(this.tableHandle);
    this.tableWrapper.appendChild(this.tableHorizontalWrapper);
    this.tableHorizontalWrapper.appendChild(this.tableVerticalWrapper);

    this.table = this.tableVerticalWrapper.appendChild(
      document.createElement('table')
    );
    setTimeout(() => {
      this.updateMarkers();
    }, 0);
    this.tableVerticalWrapper.appendChild(
      createAddCellsButton('row', view, this.getPos() + 1)
    );
    this.tableHorizontalWrapper.appendChild(
      createAddCellsButton('column', view, this.getPos() + 1)
    );

    this.colgroup = this.table.appendChild(document.createElement('colgroup'));
    updateColumns(node, this.colgroup, this.table, cellMinWidth);
    this.contentDOM = this.table.appendChild(document.createElement('tbody'));
  }

  updateMarkers() {
    const rowMarkers = this.table.querySelectorAll('.addRowAfterMarker');

    rowMarkers.forEach((marker) => {
      marker.style = `width: ${this.table.offsetWidth + 15}px`;
    });

    const colMarkers = this.table.querySelectorAll('.addColAfterMarker');

    colMarkers.forEach((marker) => {
      marker.style = `height: ${this.table.offsetHeight + 15}px`;
    });
  }

  selectTable(e) {
    const {tr} = this.view.state;
    tr.setSelection(NodeSelection.create(tr.doc, this.getPos()));
    this.view.dispatch(tr);

    e.preventDefault();
  }

  update(node) {
    if (node.type != this.node.type) return false
    this.node = node
    updateColumns(node, this.colgroup, this.table, this.cellMinWidth)
    return true
  }

  ignoreMutation(record) {
    return record.type == "attributes" && (record.target == this.table || this.colgroup.contains(record.target))
  }
}

export function updateColumns(node, colgroup, table, cellMinWidth, overrideCol, overrideValue) {
  let totalWidth = 0, fixedWidth = true
  let nextDOM = colgroup.firstChild, row = node.firstChild
  for (let i = 0, col = 0; i < row.childCount; i++) {
    let {colspan, colwidth} = row.child(i).attrs
    for (let j = 0; j < colspan; j++, col++) {
      let hasWidth = overrideCol == col ? overrideValue : colwidth && colwidth[j]
      let cssWidth = hasWidth ? hasWidth + "px" : ""
      totalWidth += hasWidth || cellMinWidth
      if (!hasWidth) fixedWidth = false
      if (!nextDOM) {
        colgroup.appendChild(document.createElement("col")).style.width = cssWidth
      } else {
        if (nextDOM.style.width != cssWidth) nextDOM.style.width = cssWidth
        nextDOM = nextDOM.nextSibling
      }
    }
  }

  while (nextDOM) {
    let after = nextDOM.nextSibling
    nextDOM.parentNode.removeChild(nextDOM)
    nextDOM = after
  }

  if (fixedWidth) {
    table.style.width = totalWidth + "px"
    table.style.minWidth = ""
  } else {
    table.style.width = ""
    table.style.minWidth = totalWidth + "px"
  }
}
