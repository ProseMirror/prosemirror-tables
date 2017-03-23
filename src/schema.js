function getCellAttrs(dom, extraAttrs) {
  let result = {
    colspan: Number(dom.getAttribute("colspan") || 1),
    rowspan: Number(dom.getAttribute("rowspan") || 1)
  }
  for (let prop in extraAttrs) {
    let getter = extraAttrs[prop].getFromDOM
    let value = getter && getter(dom)
    if (value != null) result[prop] = value
  }
  return result
}

function setCellAttrs(node, extraAttrs) {
  let attrs = {}
  if (node.attrs.colspan != 1) attrs.colspan = node.attrs.colspan
  if (node.attrs.rowspan != 1) attrs.rowspan = node.attrs.rowspan
  for (let prop in extraAttrs) {
    let setter = extraAttrs[prop].setDOMAttr
    if (setter) setter(node.attrs[prop], attrs)
  }
  return attrs
}

function addTableNodes(nodes, options) {
  let extraAttrs = options.cellAttributes || {}
  let cellAttrs = {
    colspan: {default: 1},
    rowspan: {default: 1}
  }
  for (let prop in extraAttrs)
    cellAttrs[prop] = {default: extraAttrs[prop].default}

  return nodes.append({
    table: {
      content: "table_row+",
      attrs: {header: {default: null}},
      group: "block",
      parseDOM: [{tag: "table", getAttrs(dom) {
        let headerTop = dom.classList.contains("header-top"), headerLeft = dom.classList.contains("header-left")
        return {header: headerTop && headerLeft ? "both" : headerTop ? "top" : headerLeft ? "left" : null}
      }}],
      toDOM(node) {
        let header = node.attrs.header
        let cls = header == "both" ? "header-top header-left" : header ? "header-" + header : null
        return ["table", cls ? {class: cls} : {}, ["tbody", 0]]
      }
    },
    table_row: {
      content: "table_cell*",
      parseDOM: [{tag: "tr"}],
      toDOM() { return ["tr", 0] }
    },
    table_cell: {
      content: "block+",
      attrs: cellAttrs,
      parseDOM: [{tag: "td", getAttrs: dom => getCellAttrs(dom, extraAttrs)},
                 {tag: "th", getAttrs: dom => getCellAttrs(dom, extraAttrs)}],
      toDOM(node) { return ["td", setCellAttrs(node, extraAttrs), 0] }
    }
  })
}
exports.addTableNodes = addTableNodes
