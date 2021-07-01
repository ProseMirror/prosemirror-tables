import {Decoration, DecorationSet} from 'prosemirror-view';
import {
  Plugin, 
  PluginKey,
  NodeSelection,
  Selection,
  SelectionRange,
} from "prosemirror-state"

const key = new PluginKey("multiselect")

export function multiselect() {
  return new Plugin({
    key,
    props: {
      decorations: (state) => {
        console.log("HELLO decorations");
        if (!(state.selection instanceof MultiNodeSelection)) {
          return null;
        }

        const decorations = state.selection.ranges.map((range) => {
          return Decoration.node(range.$from.pos, range.$to.pos, {
            class: "multiselected"
          });
        });

        return DecorationSet.create(state.doc, decorations);
      },

      handleDOMEvents: {
        mousedown: (view, event) => {
          console.log("HELLO handleClickOn");
          const sel = view.state.selection;

          if (event.metaKey && sel && sel instanceof NodeSelection) {
            const mousePos = view.posAtCoords({left: event.clientX, top: event.clientY});
            if (!mousePos) return;
            const $mousePos = view.state.doc.resolve(mousePos.pos)
            const $nodeAtMousePos = view.state.doc.resolve($mousePos.pos - $mousePos.nodeBefore.nodeSize);
            const newSel = new MultiNodeSelection([sel.$anchor, $nodeAtMousePos]);
            view.dispatch(view.state.tr.setSelection(newSel));
            event.preventDefault();
            return true;
          }
        }
      }
    },
  });
}

export function blockAround($pos) {
  console.log("HELLO blockAround", $pos, $pos.depth);
  for (let d = $pos.depth - 1; d > 0; d--) {
    debugger;
    if ($pos.node(d).isBlock) return console.log("OK") || $pos.node(0).resolve($pos.before(d + 1))
  }
  return null
}

export default class MultiNodeSelection extends Selection {
  // :: (ResolvedPos)
  // Create a node selection. Does not verify the validity of its
  // argument.
  constructor($positions) {
    let $anchor = null;
    let $head = null;
    let nodes = [];
    const ranges = $positions.map(($pos) => {
      let node = $pos.nodeAfter;
      nodes.push(nodes);
      let $end = $pos.node(0).resolve($pos.pos + node.nodeSize);
      if (!$anchor) {
        $anchor = $pos;
      }

      if (!$head) {
        $head = $end;
      }

      $anchor = $anchor.min($pos);
      $head = $head.max($end);

      return new SelectionRange($pos, $end);
    });
    super($anchor, $head, ranges);
    this.nodes = nodes;
  }

  map(doc, mapping) {
    console.log("HELLO MultiNodeSelection map");
    const nodePositions = [];
    this.ranges.forEach((range) => {
      let { deleted, pos } = mapping.mapResult(range.$from.pos);
      let $pos = doc.resolve(pos);
      if (deleted) {
        return;
      }

      nodePositions.push($pos);
    });

    if (nodePositions.length === 0) {
      return Selection.near(this.$anchor);
    }

    return nodePositions.length > 1
      ? new MultiNodeSelection(nodePositions)
      : new NodeSelection(nodePositions[0]);
  }

  // content() {
  //   return this.$from.node(0).slice(this.from, this.to, true);
  // }

  eq(other) {
    if (!(other instanceof MultiNodeSelection)) {
      return false;
    }

    const nodePositions = this.ranges.map((r) => r.$from).join("-");
    const otherPositions = other.ranges.map((r) => r.$from).join("-");

    return nodePositions === otherPositions;
  }

  replace(tr, content) {
    console.log("HELLO MultiNodeSelection replace", tr, content);
    super.replace(tr, content);
  }

  toJSON() {
    return {
      type: "multinode",
      ranges: this.ranges.map((range) => [range.$from.pos]),
    };
  }

  // getBookmark() {
  //   return new NodeBookmark(this.anchor);
  // }

  includes(pos) {
    for (var i = 0; i < this.ranges.length; i++) {
      const range = this.ranges[i];
      if (range.$from.pos === pos) {
        return true;
      }
    }

    return false;
  }

  static fromJSON(doc, json) {
    const nodePositions = json.nodePositions.map((pos) => doc.resolve(pos));
    return new MultiNodeSelection(nodePositions);
  }

  // // :: (Node, number) → NodeSelection
  // // Create a node selection from non-resolved positions.
  // static create(doc, from) {
  //   return new this(doc.resolve(from));
  // }

  // // :: (Node) → bool
  // // Determines whether the given node may be selected as a node
  // // selection.
  static isSelectable(node) {
    return !node.isText && node.type.spec.selectable !== false;
  }
}

Selection.jsonID("multinode", MultiNodeSelection);
MultiNodeSelection.prototype.visible = false;

