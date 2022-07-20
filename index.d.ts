// Type definitions for prosemirror-tables 0.8
// Project: https://github.com/ProseMirror/prosemirror-tables
// Definitions by: Oscar Wallhult <https://github.com/superchu>
//                 Eduard Shvedai <https://github.com/eshvedai>
//                 Patrick Simmelbauer <https://github.com/patsimm>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3
import {
  EditorState,
  Plugin,
  SelectionRange,
  Transaction,
  PluginKey,
  Selection,
} from 'prosemirror-state';
import {
  Node as ProsemirrorNode,
  NodeSpec,
  Slice,
  ResolvedPos,
  Schema,
  NodeType,
} from 'prosemirror-model';
import { Mappable } from 'prosemirror-transform';
import { EditorView, NodeView } from 'prosemirror-view';

export interface TableEditingOptions {
  allowTableNodeSelection?: boolean;
}

export interface TableNodesOptions {
  tableGroup?: string;
  cellContent: string;
  cellAttributes: { [key: string]: CellAttributes };
}

export type getFromDOM = (dom: Element) => any;
export type setDOMAttr = (value: any, attrs: any) => any;

export interface CellAttributes {
  default: any;
  getFromDOM?: getFromDOM;
  setDOMAttr?: setDOMAttr;
}

export interface TableNodes {
  table: NodeSpec;
  table_row: NodeSpec;
  table_cell: NodeSpec;
  table_header: NodeSpec;
}

export function tableNodes(options: TableNodesOptions): TableNodes;

export interface CellSelectionJSON {
  type: string;
  anchor: number;
  head: number;
}

export class CellSelection extends Selection {
  constructor($anchorCell: ResolvedPos, $headCell?: ResolvedPos);

  $anchor: ResolvedPos;
  $head: ResolvedPos;
  $anchorCell: ResolvedPos;
  $headCell: ResolvedPos;
  ranges: Array<SelectionRange>;

  map(doc: ProsemirrorNode, mapping: Mappable): any;
  content(): Slice;
  replace(tr: Transaction, content: Slice): void;
  replaceWith(tr: Transaction, node: ProsemirrorNode): void;
  forEachCell(f: (node: ProsemirrorNode, pos: number) => void): void;
  isRowSelection(): boolean;
  isColSelection(): boolean;
  eq(other: Selection): boolean;
  toJSON(): CellSelectionJSON;
  getBookmark(): CellBookmark;

  static colSelection(
    anchorCell: ResolvedPos,
    headCell?: ResolvedPos,
  ): CellSelection;
  static rowSelection(
    anchorCell: ResolvedPos,
    headCell?: ResolvedPos,
  ): CellSelection;
  static create(
    doc: ProsemirrorNode,
    anchorCell: number,
    headCell?: number,
  ): CellSelection;
  static fromJSON(doc: ProsemirrorNode, json: CellSelectionJSON): CellSelection;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface TableRect extends Rect {
  tableStart: number;
  map: TableMap;
  table: ProsemirrorNode;
}

export class TableMap {
  width: number;
  height: number;
  map: number[];
  problems?: object[];

  findCell(pos: number): Rect;
  colCount(pos: number): number;
  nextCell(pos: number, axis: string, dir: number): number;
  rectBetween(a: number, b: number): Rect;
  cellsInRect(rect: Rect): number[];
  positionAt(row: number, col: number, table: ProsemirrorNode): number;

  static get(table: ProsemirrorNode): TableMap;
}

export interface CellBookmark {
  anchor: number;
  head: number;
  map(mapping: Mappable): CellBookmark;
  resolve(doc: ProsemirrorNode): Selection;
}

export function tableEditing(options?: TableEditingOptions): Plugin;

export function deleteTable(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean;

export function goToNextCell(
  direction: number,
): (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;

export function toggleHeaderCell(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean;

export function toggleHeaderColumn(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean;

export function toggleHeaderRow(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean;

/**
 * Toggles between row/column header and normal cells (Only applies to first row/column).
 * For deprecated behavior pass useDeprecatedLogic in options with true.
 */
export function toggleHeader(
  type: 'column' | 'row',
  options?: { useDeprecatedLogic?: boolean },
): (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;

export function setCellAttr(
  name: string,
  value: any,
): (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;

export function splitCell(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean;

export interface GetCellTypeOptions {
  node: ProsemirrorNode;
  row: number;
  col: number;
}

export function splitCellWithType(
  getCellType: (options: GetCellTypeOptions) => NodeType,
): (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;

export function mergeCells(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean;

export function deleteRow(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean;

export function selectedRect(state: EditorState): TableRect;

export function rowIsHeader(
  map: TableMap,
  table: ProsemirrorNode,
  row: number,
): boolean;

export function addRowAfter(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean;

export function addRowBefore(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean;

export function addRow(
  transaction: Transaction,
  rect: TableRect,
  row: number,
): Transaction;

export function deleteColumn(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean;

export function addColumnAfter(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean;

export function addColumnBefore(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean;

export function addColumn(
  transaction: Transaction,
  rect: TableRect,
  row: number,
): Transaction;

export function columnResizing(props: {
  handleWidth?: number;
  cellMinWidth?: number;
  View?: new (
    node: ProsemirrorNode,
    cellMinWidth: number,
    view: EditorView,
  ) => NodeView;
}): Plugin;

export const columnResizingPluginKey: PluginKey;

export const tableEditingKey: PluginKey;
export const fixTablesKey: PluginKey;

export function updateColumnsOnResize(
  node: ProsemirrorNode,
  colgroup: Element,
  table: Element,
  cellMinWidth: number,
  overrideCol?: number,
  overrideValue?: number,
): void;

export function cellAround(pos: ResolvedPos): ResolvedPos | null;

export function isInTable(state: EditorState): boolean;

export function removeColSpan<T extends {}>(
  attrs: T,
  pos: number,
  n?: number,
): T;
export function addColSpan<T extends {}>(attrs: T, pos: number, n?: number): T;

type TableRoles = 'table' | 'row' | 'cell' | 'header_cell';

export function columnIsHeader(
  map: TableMap,
  table: ProsemirrorNode,
  col: number,
): boolean;
export function tableNodeTypes(schema: Schema): Record<TableRoles, NodeType>;

export function selectionCell(
  state: EditorState,
): ResolvedPos | null | undefined;

export function moveCellForward(pos: ResolvedPos): ResolvedPos;

export function inSameTable($a: ResolvedPos, $b: ResolvedPos): boolean;

export function findCell(pos: ResolvedPos): {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export function colCount(pos: ResolvedPos): number;

export function nextCell(
  pos: ResolvedPos,
  axis: string,
  dir: number,
): null | ResolvedPos;

export function fixTables(
  state: EditorState,
  oldState?: EditorState,
): null | Transaction;
