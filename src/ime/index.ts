import {
  Plugin,
  PluginKey,
  type PluginSpec,
  type EditorState,
} from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';

import { safari } from './browser';

const key = new PluginKey<boolean>('safari-ime-span');

let isComposing = false;

const spec: PluginSpec<any> = {
  key,
  props: {
    decorations: createDecorations,
    handleDOMEvents: {
      compositionstart: () => {
        isComposing = true;
      },
      compositionend: () => {
        isComposing = false;
      },
    },
  },
};

function createDecorations(state: EditorState): DecorationSet | undefined {
  const { $from, $to, to } = state.selection;
  if (isComposing && $from.sameParent($to)) {
    const deco = Decoration.widget(to, createSpan, {
      ignoreSelection: true,
      key: 'safari-ime-span',
    });
    return DecorationSet.create(state.doc, [deco]);
  }
}

function createSpan(view: EditorView): HTMLSpanElement {
  const span = view.dom.ownerDocument.createElement('span');
  span.className = 'ProseMirror-safari-ime-span';
  return span;
}

/**
 * A plugin as a workaround for a bug in Safari that causes the composition
 * based IME to remove the empty HTML element with CSS `position: relative`.
 *
 * See also https://github.com/ProseMirror/prosemirror/issues/934
 *
 * @public @group Plugins
 */
export const imeSpan = new Plugin(safari ? spec : { key });
