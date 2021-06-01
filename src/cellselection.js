// This file defines a ProseMirror selection subclass that models
// table cell selections. The table plugin needs to be active to wire
// in the user interaction part of table selections (so that you
// actually get such selections when you select across cells).

import {
  Selection,
  TextSelection,
  NodeSelection,
  SelectionRange,
} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';
import {Fragment, Slice} from 'prosemirror-model';

import {inSameTable, pointsAtCell, setAttr, removeColSpan} from './util';
import {TableMap} from './tablemap';

// ::- A [`Selection`](http://prosemirror.net/docs/ref/#state.Selection)
// subclass that represents a cell selection spanning part of a table.
// With the plugin enabled, these will be created when the user
// selects across cells, and will be drawn by giving selected cells a
// `selectedCell` CSS class.
export class CellSelection extends Selection {
  // :: (ResolvedPos, ?ResolvedPos)
  // A table selection is identified by its anchor and head cells. The
  // positions given to this constructor should point _before_ two
  // cells in the same table. They may be the same, to select a single
  // cell.
  constructor($anchorCell, $headCell = $anchorCell) {
    const table = $anchorCell.node(-1),
      map = TableMap.get(table),
      start = $anchorCell.start(-1);
    const rect = map.rectBetween(
      $anchorCell.pos - start,
      $headCell.pos - start
    );
    const doc = $anchorCell.node(0);
    const cells = map
      .cellsInRect(rect)
      .filter((p) => p != $headCell.pos - start);
    // Make the head cell the first range, so that it counts as the
    // primary part of the selection
    cells.unshift($headCell.pos - start);
    const ranges = cells.map((pos) => {
      const cell = table.nodeAt(pos),
        from = pos + start + 1;
      return new SelectionRange(
        doc.resolve(from),
        doc.resolve(from + cell.content.size)
      );
    });
    super(ranges[0].$from, ranges[0].$to, ranges);
    // :: ResolvedPos
    // A resolved position pointing _in front of_ the anchor cell (the one
    // that doesn't move when extending the selection).
    this.$anchorCell = $anchorCell;
    // :: ResolvedPos
    // A resolved position pointing in front of the head cell (the one
    // moves when extending the selection).
    this.$headCell = $headCell;
  }

  map(doc, mapping) {
    const $anchorCell = doc.resolve(mapping.map(this.$anchorCell.pos));
    const $headCell = doc.resolve(mapping.map(this.$headCell.pos));
    if (
      pointsAtCell($anchorCell) &&
      pointsAtCell($headCell) &&
      inSameTable($anchorCell, $headCell)
    ) {
      const tableChanged = this.$anchorCell.node(-1) != $anchorCell.node(-1);
      if (tableChanged && this.isRowSelection())
        return CellSelection.rowSelection($anchorCell, $headCell);
      else if (tableChanged && this.isColSelection())
        return CellSelection.colSelection($anchorCell, $headCell);
      else return new CellSelection($anchorCell, $headCell);
    }
    return TextSelection.between($anchorCell, $headCell);
  }

  // :: () → Slice
  // Returns a rectangular slice of table rows containing the selected
  // cells.
  content() {
    const table = this.$anchorCell.node(-1),
      map = TableMap.get(table),
      start = this.$anchorCell.start(-1);
    const rect = map.rectBetween(
      this.$anchorCell.pos - start,
      this.$headCell.pos - start
    );
    const seen = {},
      rows = [];
    for (let row = rect.top; row < rect.bottom; row++) {
      const rowContent = [];
      for (
        let index = row * map.width + rect.left, col = rect.left;
        col < rect.right;
        col++, index++
      ) {
        const pos = map.map[index];
        if (!seen[pos]) {
          seen[pos] = true;
          const cellRect = map.findCell(pos);
          let cell = table.nodeAt(pos);
          const extraLeft = rect.left - cellRect.left,
            extraRight = cellRect.right - rect.right;
          if (extraLeft > 0 || extraRight > 0) {
            let attrs = cell.attrs;
            if (extraLeft > 0) attrs = removeColSpan(attrs, 0, extraLeft);
            if (extraRight > 0)
              attrs = removeColSpan(
                attrs,
                attrs.colspan - extraRight,
                extraRight
              );
            if (cellRect.left < rect.left) {
              cell = cell.type.createAndFill(attrs);
            } else {
              cell = cell.type.create(attrs, cell.content);
            }
          }
          if (cellRect.top < rect.top || cellRect.bottom > rect.bottom) {
            const attrs = setAttr(
              cell.attrs,
              'rowspan',
              Math.min(cellRect.bottom, rect.bottom) -
                Math.max(cellRect.top, rect.top)
            );
            if (cellRect.top < rect.top) cell = cell.type.createAndFill(attrs);
            else cell = cell.type.create(attrs, cell.content);
          }
          rowContent.push(cell);
        }
      }
      rows.push(table.child(row).copy(Fragment.from(rowContent)));
    }

    const fragment =
      this.isColSelection() && this.isRowSelection() ? table : rows;
    return new Slice(Fragment.from(fragment), 1, 1);
  }

  replace(tr, content = Slice.empty) {
    const mapFrom = tr.steps.length,
      ranges = this.ranges;
    for (let i = 0; i < ranges.length; i++) {
      const {$from, $to} = ranges[i],
        mapping = tr.mapping.slice(mapFrom);
      tr.replace(
        mapping.map($from.pos),
        mapping.map($to.pos),
        i ? Slice.empty : content
      );
    }
    const sel = Selection.findFrom(
      tr.doc.resolve(tr.mapping.slice(mapFrom).map(this.to)),
      -1
    );
    if (sel) tr.setSelection(sel);
  }

  replaceWith(tr, node) {
    this.replace(tr, new Slice(Fragment.from(node), 0, 0));
  }

  forEachCell(f) {
    const table = this.$anchorCell.node(-1),
      map = TableMap.get(table),
      start = this.$anchorCell.start(-1);
    const cells = map.cellsInRect(
      map.rectBetween(this.$anchorCell.pos - start, this.$headCell.pos - start)
    );
    for (let i = 0; i < cells.length; i++)
      f(table.nodeAt(cells[i]), start + cells[i]);
  }

  // :: () → bool
  // True if this selection goes all the way from the top to the
  // bottom of the table.
  isColSelection() {
    const anchorTop = this.$anchorCell.index(-1),
      headTop = this.$headCell.index(-1);
    if (Math.min(anchorTop, headTop) > 0) return false;
    const anchorBot = anchorTop + this.$anchorCell.nodeAfter.attrs.rowspan,
      headBot = headTop + this.$headCell.nodeAfter.attrs.rowspan;
    return Math.max(anchorBot, headBot) == this.$headCell.node(-1).childCount;
  }

  // :: (ResolvedPos, ?ResolvedPos) → CellSelection
  // Returns the smallest column selection that covers the given anchor
  // and head cell.
  static colSelection($anchorCell, $headCell = $anchorCell) {
    const map = TableMap.get($anchorCell.node(-1)),
      start = $anchorCell.start(-1);
    const anchorRect = map.findCell($anchorCell.pos - start),
      headRect = map.findCell($headCell.pos - start);
    const doc = $anchorCell.node(0);
    if (anchorRect.top <= headRect.top) {
      if (anchorRect.top > 0)
        $anchorCell = doc.resolve(start + map.map[anchorRect.left]);
      if (headRect.bottom < map.height)
        $headCell = doc.resolve(
          start + map.map[map.width * (map.height - 1) + headRect.right - 1]
        );
    } else {
      if (headRect.top > 0)
        $headCell = doc.resolve(start + map.map[headRect.left]);
      if (anchorRect.bottom < map.height)
        $anchorCell = doc.resolve(
          start + map.map[map.width * (map.height - 1) + anchorRect.right - 1]
        );
    }
    return new CellSelection($anchorCell, $headCell);
  }

  // :: () → bool
  // True if this selection goes all the way from the left to the
  // right of the table.
  isRowSelection() {
    const map = TableMap.get(this.$anchorCell.node(-1)),
      start = this.$anchorCell.start(-1);
    const anchorLeft = map.colCount(this.$anchorCell.pos - start),
      headLeft = map.colCount(this.$headCell.pos - start);
    if (Math.min(anchorLeft, headLeft) > 0) return false;
    const anchorRight = anchorLeft + this.$anchorCell.nodeAfter.attrs.colspan,
      headRight = headLeft + this.$headCell.nodeAfter.attrs.colspan;
    return Math.max(anchorRight, headRight) == map.width;
  }

  eq(other) {
    return (
      other instanceof CellSelection &&
      other.$anchorCell.pos == this.$anchorCell.pos &&
      other.$headCell.pos == this.$headCell.pos
    );
  }

  // :: (ResolvedPos, ?ResolvedPos) → CellSelection
  // Returns the smallest row selection that covers the given anchor
  // and head cell.
  static rowSelection($anchorCell, $headCell = $anchorCell) {
    const map = TableMap.get($anchorCell.node(-1)),
      start = $anchorCell.start(-1);
    const anchorRect = map.findCell($anchorCell.pos - start),
      headRect = map.findCell($headCell.pos - start);
    const doc = $anchorCell.node(0);
    if (anchorRect.left <= headRect.left) {
      if (anchorRect.left > 0)
        $anchorCell = doc.resolve(start + map.map[anchorRect.top * map.width]);
      if (headRect.right < map.width)
        $headCell = doc.resolve(
          start + map.map[map.width * (headRect.top + 1) - 1]
        );
    } else {
      if (headRect.left > 0)
        $headCell = doc.resolve(start + map.map[headRect.top * map.width]);
      if (anchorRect.right < map.width)
        $anchorCell = doc.resolve(
          start + map.map[map.width * (anchorRect.top + 1) - 1]
        );
    }
    return new CellSelection($anchorCell, $headCell);
  }

  toJSON() {
    return {
      type: 'cell',
      anchor: this.$anchorCell.pos,
      head: this.$headCell.pos,
    };
  }

  static fromJSON(doc, json) {
    return new CellSelection(doc.resolve(json.anchor), doc.resolve(json.head));
  }

  // :: (Node, number, ?number) → CellSelection
  static create(doc, anchorCell, headCell = anchorCell) {
    return new CellSelection(doc.resolve(anchorCell), doc.resolve(headCell));
  }

  getBookmark() {
    return new CellBookmark(this.$anchorCell.pos, this.$headCell.pos);
  }
}

CellSelection.prototype.visible = false;

Selection.jsonID('cell', CellSelection);

class CellBookmark {
  constructor(anchor, head) {
    this.anchor = anchor;
    this.head = head;
  }
  map(mapping) {
    return new CellBookmark(mapping.map(this.anchor), mapping.map(this.head));
  }
  resolve(doc) {
    const $anchorCell = doc.resolve(this.anchor),
      $headCell = doc.resolve(this.head);
    if (
      $anchorCell.parent.type.spec.tableRole == 'row' &&
      $headCell.parent.type.spec.tableRole == 'row' &&
      $anchorCell.index() < $anchorCell.parent.childCount &&
      $headCell.index() < $headCell.parent.childCount &&
      inSameTable($anchorCell, $headCell)
    )
      return new CellSelection($anchorCell, $headCell);
    else return Selection.near($headCell, 1);
  }
}

function addDecoration(decoArray, classString, pos, nodeSize) {
  decoArray.push(
    Decoration.node(pos, pos + nodeSize, {
      class: classString,
    })
  );
}

export function drawCellSelection(state) {
  if (!(state.selection instanceof CellSelection)) return null;
  const cells = [];

  const selectionRect = state.selection.content().content;
  let rowsNumber;
  let cellsPerRow;
  if (selectionRect.firstChild.type.name === 'table') {
    rowsNumber = selectionRect.firstChild.childCount;
    cellsPerRow =
      selectionRect.content[0].content.content[0].content.content.reduce(
        (cols, cell) => {
          cols += Number(cell.attrs.colspan || 1);
          return cols;
        },
        0
      );
  } else {
    rowsNumber = selectionRect.childCount;
    cellsPerRow = selectionRect.content[0].content.content.reduce(
      (cols, cell) => {
        cols += Number(cell.attrs.colspan || 1);
        return cols;
      },
      0
    );
  }
  const selectionMap = new Array(rowsNumber).fill(0);

  let currentRow = 0;
  state.selection.forEachCell((node, pos) => {
    const inLastRow = currentRow + node.attrs.rowspan === rowsNumber;
    const inFirstRow = currentRow === 0;
    const firstInRow = selectionMap[currentRow] === 0;
    const lastInRow = selectionMap[currentRow] === cellsPerRow - 1;

    if (inLastRow)
      addDecoration(cells, 'selectionBottomBorder', pos, node.nodeSize);
    if (inFirstRow)
      addDecoration(cells, 'selectionTopBorder', pos, node.nodeSize);
    if (firstInRow)
      addDecoration(cells, 'selectionLeftBorder', pos, node.nodeSize);
    if (lastInRow)
      addDecoration(cells, 'selectionRightBorder', pos, node.nodeSize);

    for (let i = 0; i < node.attrs.rowspan; i++) {
      selectionMap[currentRow + i] += node.attrs.colspan;
    }

    if (selectionMap[currentRow] === cellsPerRow) {
      while (selectionMap[currentRow] === cellsPerRow) {
        currentRow += 1;
      }
    }

    cells.push(
      Decoration.node(pos, pos + node.nodeSize, {
        class: 'selectedCell',
      })
    );

    if (state.selection.isRowSelection()) {
      cells.push(
        Decoration.node(pos, pos + node.nodeSize, {
          class: 'inRowSelection',
        })
      );
    }

    if (state.selection.isColSelection()) {
      cells.push(
        Decoration.node(pos, pos + node.nodeSize, {
          class: 'inColSelection',
        })
      );
    }
  });
  return DecorationSet.create(state.doc, cells);
}

function isCellBoundarySelection({$from, $to}) {
  if ($from.pos == $to.pos || $from.pos < $from.pos - 6) return false; // Cheap elimination
  let afterFrom = $from.pos,
    beforeTo = $to.pos,
    depth = $from.depth;
  for (; depth >= 0; depth--, afterFrom++)
    if ($from.after(depth + 1) < $from.end(depth)) break;
  for (let d = $to.depth; d >= 0; d--, beforeTo--)
    if ($to.before(d + 1) > $to.start(d)) break;
  return (
    afterFrom == beforeTo &&
    /row|table/.test($from.node(depth).type.spec.tableRole)
  );
}

function isTextSelectionAcrossCells({$from, $to}) {
  let fromCellBoundaryNode;
  let toCellBoundaryNode;

  for (let i = $from.depth; i > 0; i--) {
    const node = $from.node(i);
    if (
      node.type.spec.tableRole === 'cell' ||
      node.type.spec.tableRole === 'header_cell'
    ) {
      fromCellBoundaryNode = node;
      break;
    }
  }

  for (let i = $to.depth; i > 0; i--) {
    const node = $to.node(i);
    if (
      node.type.spec.tableRole === 'cell' ||
      node.type.spec.tableRole === 'header_cell'
    ) {
      toCellBoundaryNode = node;
      break;
    }
  }

  return fromCellBoundaryNode !== toCellBoundaryNode && $to.parentOffset === 0;
}

export function normalizeSelection(state, tr, allowTableNodeSelection) {
  const sel = (tr || state).selection,
    doc = (tr || state).doc;
  let normalize, role;
  if (sel instanceof NodeSelection && (role = sel.node.type.spec.tableRole)) {
    if (role == 'cell' || role == 'header_cell') {
      normalize = CellSelection.create(doc, sel.from);
    } else if (role == 'row') {
      const $cell = doc.resolve(sel.from + 1);
      normalize = CellSelection.rowSelection($cell, $cell);
    } else if (!allowTableNodeSelection) {
      const map = TableMap.get(sel.node),
        start = sel.from + 1;
      const lastCell = start + map.map[map.width * map.height - 1];
      normalize = CellSelection.create(doc, start + 1, lastCell);
    }
  } else if (sel instanceof TextSelection && isCellBoundarySelection(sel)) {
    normalize = TextSelection.create(doc, sel.from);
  } else if (sel instanceof TextSelection && isTextSelectionAcrossCells(sel)) {
    normalize = TextSelection.create(doc, sel.$from.start(), sel.$from.end());
  }
  if (normalize) (tr || (tr = state.tr)).setSelection(normalize);
  return tr;
}
