import { NodeSelection } from "prosemirror-state";
import {addBottomRow, addRightColumn} from "./commands"
const createElementWithClass = (element, className) => {
  const newElement = document.createElement(element);
  newElement.className = className
  return newElement;
} 
const createAddCellsButton = (type, view) => {
  const isRow = type === 'row'
  const newElement = createElementWithClass('button', `tableButton ${isRow ? 'tableAddBottomRow' : 'tableAddRightColumn'}`);
  newElement.innerHTML = '+'
  newElement.onclick = () => {
    (isRow ? addBottomRow : addRightColumn)(view.state, view.dispatch)
  }
  return newElement;
} 

export class TableView {
  constructor(node, cellMinWidth, view, getPos) {
    this.node = node
    this.view = view;
    this.getPos = getPos;
    this.cellMinWidth = cellMinWidth
    this.dom = createElementWithClass('div', 'tableWrapper');
    this.tableHandle = createElementWithClass('div', 'tableHandle');
    this.tableHorizontalWrapper = createElementWithClass('div', 'tableHorizontalWrapper');
    this.tableVerticalWrapper = createElementWithClass('div', 'tableVerticalWrapper');

    this.tableHandle.onclick = () => this.selectTable()

    this.dom.appendChild(this.tableHandle);
    this.dom.appendChild(this.tableHorizontalWrapper);
    this.tableHorizontalWrapper.appendChild(this.tableVerticalWrapper);

    this.table = this.tableVerticalWrapper.appendChild(document.createElement("table"))
    setTimeout(() => {
      this.updateMarkers()
    },0)
    this.tableVerticalWrapper.appendChild(createAddCellsButton('row', view));
    this.tableHorizontalWrapper.appendChild(createAddCellsButton('column', view))

    this.colgroup = this.table.appendChild(document.createElement("colgroup"))
    updateColumns(node, this.colgroup, this.table, cellMinWidth)
    this.contentDOM = this.table.appendChild(document.createElement("tbody"))
  }

  updateMarkers() {
    const rowMarkers = this.table.querySelectorAll('.addRowAfterMarker')

    rowMarkers.forEach((marker) => {
      marker.style=`width: ${this.table.offsetWidth + 15}px`;
    })

    const colMarkers = this.table.querySelectorAll('.addColAfterMarker')

    colMarkers.forEach((marker) => {
      marker.style=`height: ${this.table.offsetHeight + 15}px`;
    })
  }

  selectTable() {
    const { tr } = this.view.state;
    tr.setSelection(NodeSelection.create(tr.doc, this.getPos()));
    this.view.dispatch(tr)
  }

  update(node) {
    this.updateMarkers()
    if (node.type != this.node.type) return false
    this.node = node
    updateColumns(node, this.colgroup, this.table, this.cellMinWidth)
    return true
  }

  ignoreMutation(record) {
    console.log('tableView ignoreMutation', record)
    return true
    // TODO: Bring back and find when to ignore for rows re arrangement
    // return record.type == "attributes" && (record.target == this.table || this.colgroup.contains(record.target))
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
