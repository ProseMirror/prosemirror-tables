import {Plugin, PluginKey} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';
import {selectionCell} from './util';
import {
  addRowBeforeButton,
  addColBeforeButton,
  sortColumn,
  selectRow,
  selectCol,
} from './commands';
import {TableMap} from './tablemap';
import {TableView} from './tableview';
import {RowDragHandler} from './table-dragging/rowsdragging';
import {ColDragHandler} from './table-dragging/colsdragging';
import {getColIndex, createElementWithClass} from './util';
import {setCellAttrs} from './schema';

export const key = new PluginKey('tableColumnHandles');

export class CellView {
  constructor(node, view, getPos) {
    this.getPos = getPos;
    this.node = node;
    this.view = view;
    this.dom = createElementWithClass('td', '');
    this.contentDOM = this.dom.appendChild(
      createElementWithClass('div', 'cellContent')
    );
    this.checkIfFirstCol(this.view);
    this.checkIfColHeader(this.view);

    this.dom.style = `${setCellAttrs(node, {}).style}`;
  }

  checkIfFirstCol(view) {
    const resolvePos = view.state.doc.resolve(this.getPos());
    const tableNode = resolvePos.node(-1);
    const tableMap = TableMap.get(tableNode);

    const colNumber = tableMap.colCount(this.getPos() - resolvePos.start(-1));

    if (colNumber !== 0 || this.rowHandle) {
      return;
    }

    this.node.attrs.firstCol = true;

    const rowHandle = createElementWithClass('div', 'tableRowHandle');
    rowHandle.contentEditable = false;
    const rowHandleButton = createElementWithClass(
      'button',
      'tableRowHandleButton'
    );
    const buttonContent = createElementWithClass('span', 'buttonContent');
    rowHandleButton.appendChild(buttonContent);

    this.rowHandle = rowHandle.appendChild(rowHandleButton);
    this.dom.appendChild(rowHandle);

    this.rowHandle.onclick = (e) => selectRow(e, view, this.getPos());
    this.rowDragHandler = new RowDragHandler(
      this.view,
      this.rowHandle,
      document.body,
      this.getPos,
      this.dom
    );

    const addRowAfterContainer = createElementWithClass(
      'div',
      'addRowAfterContainer'
    );
    addRowAfterContainer.contentEditable = false;

    const addAfterButton = createElementWithClass('button', 'addAfterButton');
    const addAfterButtonText = createElementWithClass('span', 'addButtonText');
    addAfterButtonText.innerText = '+';
    addAfterButton.appendChild(addAfterButtonText);
    addAfterButton.appendChild(
      createElementWithClass('div', 'addRowButtonContent')
    );

    addAfterButton.onclick = () => addRowBeforeButton(view, this.getPos());

    addRowAfterContainer.appendChild(addAfterButton);
    const addRowAfterMarker = createElementWithClass(
      'div',
      'addRowAfterMarker'
    );
    addRowAfterContainer.appendChild(addRowAfterMarker);
    this.dom.appendChild(addRowAfterContainer);
  }

  checkIfColHeader(view) {
    const resolvePos = view.state.doc.resolve(this.getPos());
    const rowStart = this.getPos() - resolvePos.parentOffset - 1;
    const rowResolvedPos = view.state.doc.resolve(rowStart);

    if (rowResolvedPos.parentOffset !== 0 || this.colHandle) return;

    this.node.attrs.firstRow = true;
    const colHandle = createElementWithClass('div', 'tableColHandle');
    const colHandleButton = createElementWithClass(
      'button',
      'tableColHandleButton'
    );
    const buttonContent = createElementWithClass('span', 'buttonContent');
    colHandleButton.appendChild(buttonContent);

    colHandleButton.onclick = (e) => selectCol(e, view, this.getPos());

    colHandle.appendChild(colHandleButton);
    colHandle.contentEditable = false;

    this.colHandle = colHandle;
    this.dom.appendChild(colHandle);

    this.colDragHandler = new ColDragHandler(
      this.view,
      this.colHandle,
      document.body,
      this.getPos,
      this.dom
    );

    const addColAfterContainer = createElementWithClass(
      'div',
      'addColAfterContainer'
    );
    addColAfterContainer.contentEditable = false;

    const addAfterButton = createElementWithClass('button', 'addAfterButton');
    const addAfterButtonText = createElementWithClass('span', 'addButtonText');
    addAfterButtonText.innerText = '+';
    addAfterButton.appendChild(addAfterButtonText);
    addAfterButton.appendChild(
      createElementWithClass('div', 'addColButtonContent')
    );

    addAfterButton.onclick = () => {
      addColBeforeButton(view, this.getPos());
    };
    addColAfterContainer.appendChild(addAfterButton);
    const addColAfterMarker = createElementWithClass(
      'div',
      'addColAfterMarker'
    );
    addColAfterContainer.appendChild(addColAfterMarker);
    this.colMarker = addColAfterContainer;
    this.dom.appendChild(addColAfterContainer);

    const tableAttrs = resolvePos.node(1).attrs;

    // add sort and style only if headers allowed
    if (tableAttrs.headers) {
      this.dom.classList.add('colHeader');

      const sortButton = createElementWithClass('button', 'sortColButton');
      sortButton.contentEditable = false;

      const sortedCol = tableAttrs.sort.col;
      const colIndex = getColIndex(this.view.state, this.getPos());

      if (sortedCol === colIndex) {
        sortButton.classList.add(
          tableAttrs.sort.dir === 'down' ? 'sortedDown' : 'sortedUp'
        );
      }

      sortButton.onclick = () => {
        if (colIndex === null) return;

        if (sortedCol !== colIndex || tableAttrs.sort.dir === 'up') {
          sortColumn(view, colIndex, this.getPos(), 1);
        } else {
          sortColumn(view, colIndex, this.getPos(), -1);
        }

        view.focus();
      };
      this.sortButton = this.dom.appendChild(sortButton);
    }
  }

  ignoreMutation(record) {
    if (
      (record.type === 'attributes' &&
        record.target.classList.contains('addRowAfterMarker')) ||
      record.target.classList.contains('addColAfterMarker')
    ) {
      return true;
    }
    return false;
  }

  update(node, b, c) {
    if (node.type != this.node.type) return false;
    if (this.dom && !this.node.sameMarkup(node)) return false;

    this.checkIfFirstCol(this.view);
    this.checkIfColHeader(this.view);

    this.node = node;
    this.dom.style = `${setCellAttrs(node, {}).style}`;

    return true;
  }
}

export function columnHandles({} = {}) {
  const plugin = new Plugin({
    key,
    props: {
      nodeViews: {
        table_cell: (node, view, getPos) => new CellView(node, view, getPos),
        table: (node, view, getPos) => new TableView(node, 200, view, getPos),
      },
      decorations(state) {
        const $pos = selectionCell(state);
        if (!$pos) {
          // In case there's no cell
          return DecorationSet.empty;
        }
        const tableNode = $pos.node(-1);
        const tableStart = $pos.start(-1) - 1;
        const decoration = Decoration.node(
          tableStart,
          tableStart + tableNode.nodeSize,
          {class: 'tableFocus'}
        );
        return DecorationSet.create(state.doc, [decoration]);
      },
    },
  });
  return plugin;
}
