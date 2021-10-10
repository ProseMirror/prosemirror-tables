class Filter {
  constructor(
    table,
    colIndex,
    colType,
    filterLogic,
    filterLabel,
    filterValue
  ) {
    this.table = table;
    this.colIndex = colIndex;
    this.colType = colType;
    this.filterLogic = filterLogic;
    this.filterLabel = filterLabel;
    this.filterValue = filterValue;
  }

  getColsOptions() {
    const headersRow = this.table.firstChild;
    const headers = headersRow.content.content.map((headerNode, index) => ({
      index,
      type: headerNode.attrs.type,
      label: headerNode.textContent
    }))

    return 
  }

  renderColDropDown() {
    const 
  }

  toAttrsValue() {
    return {
      colIndex: this.colIndex,
      colType: this.colType,
      filterLogic: this.filterLogic,
      filterLabel: this.filterLabel,
      filterValue: this.filterValue
    }
  }
}