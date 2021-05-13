const createElementWithClass = (element, className) => {
  const newElement = document.createElement(element);
  newElement.className = className
  return newElement;
} 

export class TableView {
  constructor(node, cellMinWidth) {
    this.node = node
    this.cellMinWidth = cellMinWidth
    this.dom = createElementWithClass('div', 'tableWrapper');
    this.tableHandle = createElementWithClass('div', 'tableHandle');
    this.tableHorizontalWrapper = createElementWithClass('div', 'tableHorizontalWrapper');
    this.tableVerticalWrapper = createElementWithClass('div', 'tableVerticalWrapper');


    this.dom.appendChild(this.tableHandle);
    this.dom.appendChild(this.tableHorizontalWrapper);
    this.tableHorizontalWrapper.appendChild(this.tableVerticalWrapper);


    this.table = this.tableVerticalWrapper.appendChild(document.createElement("table"))
    this.tableVerticalWrapper.appendChild(createElementWithClass('button', 'tableButton tableAddBottomRow'))
    this.tableHorizontalWrapper.appendChild(createElementWithClass('button', 'tableButton tableAddRightColumn'))



    this.colgroup = this.table.appendChild(document.createElement("colgroup"))
    updateColumns(node, this.colgroup, this.table, cellMinWidth)
    this.contentDOM = this.table.appendChild(document.createElement("tbody"))
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
