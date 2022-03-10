export class TableView {
  constructor(node, cellMinWidth, maxTableWidth = null) {
    this.node = node;
    this.cellMinWidth = cellMinWidth;
    this.maxTableWidth = maxTableWidth;
    this.dom = document.createElement('div');
    this.dom.className = 'tableWrapper';
    this.table = this.dom.appendChild(document.createElement('table'));
    this.colgroup = this.table.appendChild(document.createElement('colgroup'));
    updateColumns(node, this.colgroup, this.table, cellMinWidth, maxTableWidth);
    this.contentDOM = this.table.appendChild(document.createElement('tbody'));
  }

  update(node) {
    if (node.type != this.node.type) return false;
    this.node = node;
    updateColumns(node, this.colgroup, this.table, this.cellMinWidth, this.maxTableWidth);
    return true;
  }

  ignoreMutation(record) {
    return record.type == 'attributes' && (record.target == this.table || this.colgroup.contains(record.target));
  }
}

export function updateColumns(node, colgroup, table, cellMinWidth, maxTableWidth, overrideCol, overrideValue) {
  let totalWidth = 0,
      fixedWidth = true;
  let finalWidth = overrideValue;
  let nextDOM = colgroup.firstChild,
      row = node.firstChild;
  for (let i = 0, col = 0; i < row.childCount; i++) {
    const { colspan, colwidth } = row.child(i).attrs;
    for (let j = 0; j < colspan; j++, col++) {
      const hasWidth = colwidth && colwidth[j];
      totalWidth += hasWidth || cellMinWidth;
    }
  }
  const availableWidth = maxTableWidth - totalWidth;
  totalWidth = 0;
  for (let i = 0, col = 0; i < row.childCount; i++) {
    let { colspan, colwidth } = row.child(i).attrs;
    for (let j = 0; j < colspan; j++, col++) {
      let hasWidth = colwidth && colwidth[j];
      if (overrideCol == col) {
        const maxWidth = availableWidth + hasWidth;
        hasWidth = !maxTableWidth || maxWidth > overrideValue ? overrideValue : maxWidth;
        finalWidth = hasWidth;
      }
      let cssWidth = hasWidth ? hasWidth + 'px' : '';
      totalWidth += hasWidth || cellMinWidth;
      if (!hasWidth) fixedWidth = false;
      if (!nextDOM) {
        colgroup.appendChild(document.createElement('col')).style.width = cssWidth;
      } else {
        if (nextDOM.style.width != cssWidth) nextDOM.style.width = cssWidth;
        nextDOM = nextDOM.nextSibling;
      }
    }
  }

  while (nextDOM) {
    let after = nextDOM.nextSibling;
    nextDOM.parentNode.removeChild(nextDOM);
    nextDOM = after;
  }

  if (fixedWidth) {
    table.style.width = totalWidth + 'px';
    table.style.minWidth = '';
  } else {
    table.style.width = '';
    table.style.minWidth = totalWidth + 'px';
  }

  return finalWidth;
}
