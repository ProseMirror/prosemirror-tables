import {Plugin, PluginKey} from "prosemirror-state"
import {Decoration, DecorationSet} from "prosemirror-view"
import {selectionCell} from "./util"
import {addRowBefore, addColumnBefore} from "./commands"


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
    this.dom = createElementWithClass('td', '');
    this.contentDOM = this.dom.appendChild(createElementWithClass('div', 'cellContent'))
    this.checkIfFirstCol = () => {
      const resolvePos = view.state.doc.resolve(this.getPos());
      if (!resolvePos.nodeBefore && !this.rowHandle) {
        // debugger;
        const rowHandle = createElementWithClass('div', 'tableRowHandle')
        this.rowHandle = rowHandle.appendChild(createElementWithClass('button', 'tableRowHandleButton'))
        this.dom.appendChild(rowHandle)
  
        const addRowAfterContainer = createElementWithClass('div', 'addRowAfterContainer')
  
        const addAfterButton = createElementWithClass('button', 'addAfterButton');
  
        addAfterButton.onclick = () => {
          addRowBefore(view.state, view.dispatch)
        }
        addRowAfterContainer.appendChild(addAfterButton)
        const addRowAfterMarker = createElementWithClass('div', 'addAfterMarker')
        // addRowAfterMarker.style = "width: 100%;"
        addRowAfterContainer.appendChild(addRowAfterMarker)
        this.dom.appendChild(addRowAfterContainer)

        const table = this.dom
        const marker = this.dom.querySelector('.addAfterMarker')
        // debugger;
        marker.style=`width: ${table.offsetWidth + 15}px`;
      }
    }
    this.checkIfFirstCol();
  }



  update(node,b,c) {
    if (node.type != this.node.type) return false

    this.checkIfFirstCol();
    this.node = node

    return true;
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
