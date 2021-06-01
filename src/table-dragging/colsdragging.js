import {TextSelection} from 'prosemirror-state';
import {selectedRect} from '../commands';
import {findParentNodeOfType} from 'prosemirror-utils';
import {switchCols} from './commands';
import {createElementWithClass} from '../util';

/**
 * ColDragHandler is controlling columns dragging behavior in tables.
 *
 * - onmousedown - create column ghost and add event listeners for mousemove and mouseup.
 * - mousemove - append ghost to table on first move, and update ghost position on every move.
 * - mouseup - execute drop behavior - delete origin and drop column in new position.
 */

export class ColDragHandler {
  constructor(view, handle, body, getPos, cellDom) {
    this.view = view;
    this.body = body;
    this.getPos = getPos;
    this.cellDom = cellDom;
    this.handle = handle;

    this.tableWrapper = null;
    this.colGhost = null;

    this.firstMove = true;
    this.originCellPos = null;

    this.handle.addEventListener('mousedown', (e) => this.onmousedown(e));
  }

  onmousedown(e) {
    const tableRect =
      this.cellDom.parentElement.parentElement.getBoundingClientRect();

    const colGhost = createElementWithClass('div', 'tableColGhost');
    colGhost.style.position = 'absolute';
    colGhost.style.width = `${this.cellDom.offsetWidth}px`;
    colGhost.style.height = `${tableRect.height}px`;
    colGhost.style.background = '#0000ff2e';
    colGhost.style.opacity = 0.5;
    colGhost.style.pointerEvents = 'none';

    this.colGhost = colGhost;
    this.colGhost.style.top = `0px`;

    const originMousePos = this.view.posAtCoords({
      left: e.clientX + 20,
      top: e.clientY,
    });

    this.originCellPos = originMousePos.inside;

    this.firstMove = true;

    this.body.onmousemove = (e) => this.onmousemove(e, tableRect);
    this.body.onmouseup = (e) => this.onmouseup(e);

    // Stop the editor from making selection
    e.preventDefault();
  }

  onmousemove(e, tableRect) {
    this.tableWrapper = document.querySelector('.tableFocus').firstChild;

    // append ghost to dom and add class only in the fist move in each drag
    if (this.firstMove) {
      this.tableWrapper.appendChild(this.colGhost);
      this.tableWrapper.parentElement.classList.add('colRearrangement');
      this.firstMove = false;
    }

    const colMiddle = this.cellDom.offsetWidth / 2;

    let colGhostLeft = e.clientX - tableRect.left - colMiddle;
    if (e.clientX - colMiddle < tableRect.left) {
      colGhostLeft = 0;
    }
    if (e.clientX + colMiddle > tableRect.right) {
      colGhostLeft = tableRect.width - this.cellDom.offsetWidth;
    }

    this.colGhost.style.left = `${colGhostLeft}px`;
  }

  onmouseup(e) {
    this.colGhost.remove();
    if (this.tableWrapper)
      this.tableWrapper.parentElement.classList.remove('colRearrangement');
    this.body.onmousemove = this.body.onmouseup = null;

    const state = this.view.state;

    const mousePos = this.view.posAtCoords({
      left: e.clientX,
      top: e.clientY + 20,
    });
    if (!mousePos) return;

    const rect = selectedRect(state);

    let originCellIndex = rect.map.map.indexOf(
      this.originCellPos - rect.tableStart
    );

    if (originCellIndex === -1) {
      originCellIndex = rect.map.map.indexOf(
        this.originCellPos - 1 - rect.tableStart
      );
    }

    const insertRowPos =
      findParentNodeOfType(state.schema.nodes.table_cell)(
        TextSelection.create(state.doc, mousePos.pos)
      ).pos || mousePos.inside;

    const insertCellIndex = rect.map.map.indexOf(
      insertRowPos - rect.tableStart
    );

    if (
      originCellIndex === -1 ||
      insertCellIndex === -1 ||
      originCellIndex === insertCellIndex
    )
      return;

    const originColNumber = originCellIndex % rect.map.width;
    const insertColNumber = insertCellIndex % rect.map.width;

    switchCols(
      this.view,
      rect,
      originColNumber,
      insertColNumber,
      this.getPos()
    );
  }
}
