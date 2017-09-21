class TableView {
  constructor(node, cellMinWidth) {
    this.node = node
    this.cellMinWidth = cellMinWidth
    this.dom = document.createElement("div")
    this.dom.className = "tableWrapper"
    this.table = this.dom.appendChild(document.createElement("table"))
    this.colgroup = this.table.appendChild(document.createElement("colgroup"))
    let totalWidth = updateColumns(node, this.colgroup, cellMinWidth)
    this.table.style.minWidth = totalWidth + "px"
    this.contentDOM = this.table.appendChild(document.createElement("tbody"))
  }

  update(node) {
    if (node.type != this.node.type) return false
    this.node = node
    let totalWidth = updateColumns(node, this.colgroup, this.cellMinWidth)
    this.table.style.minWidth = totalWidth + "px"
    return true
  }
}
exports.TableView = TableView

function updateColumns(node, dom, cellMinWidth) {
  let totalWidth = 0
  let nextDOM = dom.firstChild, row = node.firstChild
  for (let i = 0; i < row.childCount; i++) {
    let {colspan, colwidth} = row.child(i).attrs
    for (let j = 0; j < colspan; j++) {
      let hasWidth = colwidth && colwidth[j], width = hasWidth ? hasWidth + "px" : ""
      totalWidth += hasWidth || cellMinWidth
      if (!nextDOM) {
        dom.appendChild(document.createElement("col")).style.width = width
      } else {
        if (nextDOM && nextDOM.style.width != width) nextDOM.style.width = width
        nextDOM = nextDOM.nextSibling
      }
    }
  }
  while (nextDOM) {
    let after = nextDOM.nextSibling
    nextDOM.parentNode.removeChild(nextDOM)
    nextDOM = after
  }
  return totalWidth
}
