import {Plugin, PluginKey} from "prosemirror-state"
import {Decoration, DecorationSet} from "prosemirror-view"
import {selectionCell} from "./util"
import {addRowBefore, addColumnBefore, addRow} from "./commands"
import { CellSelection } from "./cellselection"
import { TableMap } from "./tablemap";
import { TextSelection } from "prosemirror-state"

export const key = new PluginKey("tableColumnHandles")

const createElementWithClass = (element, className) => {
  const newElement = document.createElement(element);
  newElement.className = className
  return newElement;
} 
export class CellView {
  constructor(node, view, getPos) {
    this.getPos = getPos;
    this.node = node;
    this.view = view;
    this.dom = createElementWithClass('td', '');
    this.contentDOM = this.dom.appendChild(createElementWithClass('div', 'cellContent'))
    this.checkIfFirstCol(view);
    this.checkIfColHeader(view);
  }

  checkIfFirstCol(view) {
    const resolvePos = view.state.doc.resolve(this.getPos());

    if((resolvePos.nodeBefore && resolvePos.parentOffset !== 0) || this.rowHandle) return;

    const rowHandle = createElementWithClass('div', 'tableRowHandle')
    const rowHandleButton = createElementWithClass('button', 'tableRowHandleButton')
    const buttonContent = createElementWithClass('span', 'buttonContent')
    rowHandleButton.appendChild(buttonContent);
    
    rowHandleButton.addEventListener('click', () => {
      view.dispatch(view.state.tr.setSelection(CellSelection.rowSelection(view.state.doc.resolve(this.getPos()))))
    })

    this.rowHandle = rowHandle.appendChild(rowHandleButton)
    this.dom.appendChild(rowHandle)

    const addRowAfterContainer = createElementWithClass('div', 'addRowAfterContainer')

    const addAfterButton = createElementWithClass('button', 'addAfterButton');
    const addAfterButtonText = createElementWithClass('span', 'addButtonText');
    addAfterButtonText.innerText = "+"
    addAfterButton.appendChild(addAfterButtonText)
    addAfterButton.appendChild(createElementWithClass('div', 'addRowButtonContent'))

    addAfterButton.onclick = () => this.addRowBeforeButton(view)

    addRowAfterContainer.appendChild(addAfterButton)
    const addRowAfterMarker = createElementWithClass('div', 'addRowAfterMarker')
    addRowAfterContainer.appendChild(addRowAfterMarker)
    this.dom.appendChild(addRowAfterContainer)

    const table = this.dom
    const marker = this.dom.querySelector('.addRowAfterMarker')
    marker.style=`width: ${table.offsetWidth + 15}px`;
  }

  addRowBeforeButton(view) {
    const resolvePos = view.state.doc.resolve(this.getPos())
    const tableNode = resolvePos.node(-1);
    const tableStart = resolvePos.start(-1)
    const map = TableMap.get(tableNode);

    const tableRect = {
      tableStart,
      map,
      table: tableNode
    }
    debugger
    const rowPos = this.getPos();
    const rowIndex = map.map.indexOf(rowPos - tableStart);

    if (rowIndex === -1) return;

    const rowNumber = rowIndex / map.width;

    const tr = addRow(view.state.tr, tableRect, rowNumber)
    tr.setSelection(TextSelection.create(tr.doc, this.getPos() + 2))
    view.dispatch(tr)
  }

  checkIfColHeader(view) {
    const resolvePos = view.state.doc.resolve(this.getPos());
    const rowStart = this.getPos() - resolvePos.parentOffset - 1;
    const rowResolvedPos = view.state.doc.resolve(rowStart);
    
    if(rowResolvedPos.parentOffset !== 0 || this.colHandle) return;
    
    this.dom.classList.add("colHeader");

    const colHandle = createElementWithClass('div', 'tableColHandle')
    const colHandleButton = createElementWithClass('button', 'tableColHandleButton')
    const buttonContent = createElementWithClass('span', 'buttonContent')
    colHandleButton.appendChild(buttonContent);
    
    colHandleButton.addEventListener('click', () => {
      view.dispatch(view.state.tr.setSelection(CellSelection.colSelection(view.state.doc.resolve(this.getPos()))))
    })

    this.colHandle = colHandle.appendChild(colHandleButton)
    this.dom.appendChild(colHandle)

    const addColAfterContainer = createElementWithClass('div', 'addColAfterContainer')

    const addAfterButton = createElementWithClass('button', 'addAfterButton');
    const addAfterButtonText = createElementWithClass('span', 'addButtonText');
    addAfterButtonText.innerText = "+"
    addAfterButton.appendChild(addAfterButtonText)
    addAfterButton.appendChild(createElementWithClass('div', 'addColButtonContent'))

    addAfterButton.onclick = () => {
      addColumnBefore(view.state, view.dispatch)
    }
    addColAfterContainer.appendChild(addAfterButton)
    const addColAfterMarker = createElementWithClass('div', 'addColAfterMarker')
    addColAfterContainer.appendChild(addColAfterMarker)
    this.dom.appendChild(addColAfterContainer)

    const table = this.dom
    const marker = this.dom.querySelector('.addColAfterMarker')
    marker.style=`height: ${table.offsetHeight + 15}px`;
  }

  update(node,b,c) {
    if (node.type != this.node.type) return false;
    if (this.dom && !this.node.sameMarkup(node)) return false;

    this.checkIfFirstCol(this.view);
    this.checkIfColHeader(this.view);

    this.node = node

    return true;
  }

  selectNode() {
    console.log(this.view.state.selection.isRowSelection());
  }
}


export function columnHandles({} = {}) {
  let plugin = new Plugin({
    key,
    props: {
        nodeViews: {
          table_cell: (node, view, getPos) => new CellView(node, view, getPos),
        },
        decorations(state) {
          const $pos = selectionCell(state)
          if (!$pos) {
            // In case there's no cell
            return DecorationSet.empty
          }
          // debugger;
          const tableNode = $pos.node(-1)
          const tableStart = $pos.start(-1) - 1;
          const decoration = Decoration.node(tableStart, tableStart + tableNode.nodeSize, {class: 'tableFocus'});
          return DecorationSet.create(state.doc, [decoration]);
        }
    }
  })
  return plugin
}
