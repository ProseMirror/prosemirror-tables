import {Plugin, PluginKey} from "prosemirror-state"
import {Decoration, DecorationSet} from "prosemirror-view"
import {selectionCell} from "./util"
import {addRowBefore, addColumnBefore, addRow, selectedRect} from "./commands"
import { CellSelection } from "./cellselection"
import { TableMap } from "./tablemap";
import { TextSelection } from "prosemirror-state"
import { TableView } from './tableview'
import { findParentNodeOfType } from "prosemirror-utils"

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

    rowHandleButton.onmousedown = (e) => {
      console.log('mouse down')
      const tableWrapper = document.querySelector('.tableFocus')
      tableWrapper.classList.add('rowRearrangement')
      const tableRect = tableWrapper.querySelector('table').getBoundingClientRect();
      const trRect = this.dom.parentElement.getBoundingClientRect();

      const trGhost = createElementWithClass('div', 'tableRowGhost');
      trGhost.style.position = 'absolute';
      trGhost.style.width = `${trRect.width}px`;
      trGhost.style.height = `${trRect.height}px`;
      trGhost.style.background = '#0000ff2e';
      trGhost.style.opacity = 0.5;
      trGhost.style.pointerEvents = 'none';

      tableWrapper.appendChild(trGhost);
      
      const onmousemove = (e) => {
        const middleTr = (trRect.height / 2);
          let trGhostTop = e.clientY - tableRect.top - middleTr
          if (e.clientY - middleTr < tableRect.top) {
            trGhostTop = 0;
          }
          if (e.clientY + middleTr > tableRect.bottom) {
            trGhostTop = tableRect.height - trRect.height
          }
          trGhost.style.top = `${trGhostTop}px`;
      };
      onmousemove(e);
      document.body.onmousemove = onmousemove;
      document.body.onmouseup = (e) => {
        trGhost.remove();
        tableWrapper.classList.remove('rowRearrangement')
        document.body.onmousemove = document.body.onmouseup = null;

        const mousePos = this.view.posAtCoords({
          left: e.clientX + 20,
          top: e.clientY
        })
        if(!mousePos) return 

        const rect = selectedRect(this.view.state);

        const originRowPos = this.getPos();
        const originCellIndex = rect.map.map.indexOf(originRowPos - rect.tableStart);

        const {pos: insertRowPos} = findParentNodeOfType(this.view.state.schema.nodes.table_cell)
          (TextSelection.create(this.view.state.doc, mousePos.pos)) || mousePos.inside;
        const insertCellIndex = rect.map.map.indexOf(insertRowPos - rect.tableStart);

        console.log(originCellIndex,insertCellIndex);
        if (originCellIndex === -1 || insertCellIndex === -1) return;

        const originRowNumber = originCellIndex / rect.map.width;
        const insertRowNumber = insertCellIndex / rect.map.width;


        const rowsSlice = rect.table.content.content.slice();
        const [draggedRow] = rowsSlice.splice(originRowNumber, 1);

        rowsSlice.splice(originRowNumber > insertRowNumber ? insertRowNumber : insertRowNumber - 1, 0, draggedRow)

        const { tr } = this.view.state;
        tr.replaceWith(rect.tableStart, rect.tableStart + rect.table.content.size, rowsSlice)
        this.view.dispatch(tr)        
        
      };

      // Stop the editor from making selection
      e.preventDefault();
    };

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

  ignoreMutation(record) {
    if (record.type === 'attributes' && record.target.classList.contains('addRowAfterMarker')) {
      return true
    }
    return false
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
          table: (node, view, getPos) => new TableView(node, 200, view, getPos),
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
