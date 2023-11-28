import { Node } from 'prosemirror-model';
import { EditorView, NodeView } from 'prosemirror-view';
import { CellAttrs } from './util';

/**
 * @public
 */
export class TableView implements NodeView {
  public dom: HTMLDivElement;
  public table: HTMLTableElement;
  public colgroup: HTMLTableColElement;
  public contentDOM: HTMLTableSectionElement;

  constructor(
    public node: Node,
    public cellMinWidth: number,
    public maxTableWidth: number,
    public view: EditorView,
  ) {
    this.dom = document.createElement('div');
    this.dom.className = 'tableWrapper';
    this.table = this.dom.appendChild(document.createElement('table'));
    this.colgroup = this.table.appendChild(document.createElement('colgroup'));
    updateColumnsOnResize(
      node,
      this.colgroup,
      this.table,
      cellMinWidth,
      maxTableWidth,
    );
    this.contentDOM = this.table.appendChild(document.createElement('tbody'));
  }

  update(node: Node): boolean {
    if (node.type != this.node.type) return false;
    this.node = node;
    updateColumnsOnResize(
      node,
      this.colgroup,
      this.table,
      this.cellMinWidth,
      this.maxTableWidth
    );
    return true;
  }

  ignoreMutation(record: MutationRecord): boolean {
    return (
      record.type == 'attributes' &&
      (record.target == this.table || this.colgroup.contains(record.target))
    );
  }
}

/**
 * @public
 */
export function updateColumnsOnResize(
  node: Node,
  colgroup: HTMLTableColElement,
  table: HTMLTableElement,
  cellMinWidth: number,
  maxTableWidth = 0,
  overrideCol = -1,
  overrideValue= 0,
): number {
  let totalWidth = 0;
  let fixedWidth = true;
  let finalWidth = overrideValue || 0;
  let nextDOM = colgroup.firstChild as HTMLElement;
  const row = node.firstChild;
  if (!row) {
    return 0;
  }

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
        nextDOM = nextDOM.nextSibling as HTMLElement;
      }
    }
  }

  while (nextDOM) {
    let after = nextDOM.nextSibling as HTMLElement;
    nextDOM.parentNode?.removeChild(nextDOM);
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
