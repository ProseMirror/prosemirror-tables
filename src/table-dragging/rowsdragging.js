import { TextSelection } from "prosemirror-state";
import { selectedRect } from "../commands"
import { findParentNodeOfType } from "prosemirror-utils"


const createElementWithClass = (element, className) => {
  const newElement = document.createElement(element);
  newElement.className = className
  return newElement;
} 

export class RowDragHandler  {
    constructor(view, handle, body, getPos, cellDom) {
        this.view = view;
        this.body = body;
        this.getPos = getPos;
        this.cellDom = cellDom;
        this.handle = handle;

        this.tableWrapper= null;
        this.trGhost = null;

        this.firstMove = true;
        this.originCellPos = null;

        this.handle.addEventListener('mousedown', (e) => this.onmousedown(e))
    }

    onmousedown(e) {
      const trRect = this.cellDom.parentElement.getBoundingClientRect();

      const trGhost = createElementWithClass('div', 'tableRowGhost');
      trGhost.style.position = 'absolute';
      trGhost.style.width = `${trRect.width}px`;
      trGhost.style.height = `${trRect.height}px`;
      trGhost.style.background = '#0000ff2e';
      trGhost.style.opacity = 0.5;
      trGhost.style.pointerEvents = 'none';

      this.trGhost = trGhost;

      const originMousePos = this.view.posAtCoords({
          left: e.clientX + 20,
          top: e.clientY
          })

      this.originCellPos = originMousePos.inside

      this.firstMove = true;

      this.body.onmousemove = (e) => this.onmousemove(e, trRect);
      this.body.onmouseup = (e) => this.onmouseup(e);

      // Stop the editor from making selection
      e.preventDefault()
    }

    onmousemove(e, trRect) {
      this.tableWrapper = document.querySelector('.tableFocus')
      const tableRect = this.tableWrapper.querySelector('table').getBoundingClientRect();

      if(this.firstMove) {
        this.tableWrapper.appendChild(this.trGhost);
        this.tableWrapper.classList.add('rowRearrangement')
        this.firstMove = false
      }
      const middleTr = (trRect.height / 2);
        let trGhostTop = e.clientY - tableRect.top - middleTr
        if (e.clientY - middleTr < tableRect.top) {
          trGhostTop = 0;
        }
        if (e.clientY + middleTr > tableRect.bottom) {
          trGhostTop = tableRect.height - trRect.height
        }
        this.trGhost.style.top = `${trGhostTop}px`;
    }

    onmouseup(e) {
      this.trGhost.remove();
      if(this.tableWrapper) this.tableWrapper.classList.remove('rowRearrangement')
      this.body.onmousemove = this.body.onmouseup = null;

      const state =  this.view.state;

      const mousePos = this.view.posAtCoords({
        left: e.clientX + 20,
        top: e.clientY
      })
      if(!mousePos) return 

      const rect = selectedRect(state);

      let originCellIndex = rect.map.map.indexOf(this.originCellPos - rect.tableStart);

      if(originCellIndex === -1) {
        originCellIndex = rect.map.map.indexOf(this.originCellPos - 1 - rect.tableStart);
      }
      const {pos: insertRowPos} = findParentNodeOfType(state.schema.nodes.table_cell)
      (TextSelection.create(state.doc, mousePos.pos)) || mousePos.inside;
      const insertCellIndex = rect.map.map.indexOf(insertRowPos - rect.tableStart);

      if (originCellIndex === -1 || insertCellIndex === -1 || originCellIndex === insertCellIndex) return;

      const originRowNumber = originCellIndex / rect.map.width;
      const insertRowNumber = insertCellIndex / rect.map.width;


      const rowsSlice = rect.table.content.content.slice();
      const [draggedRow] = rowsSlice.splice(originRowNumber, 1);

      rowsSlice.splice(originRowNumber > insertRowNumber ? insertRowNumber : insertRowNumber - 1, 0, draggedRow)

      const { tr } = state;
      tr.replaceWith(rect.tableStart, rect.tableStart + rect.table.content.size, rowsSlice);
      tr.setSelection(TextSelection.create(state.doc, this.getPos()));
      this.view.dispatch(tr)     
    }
}

