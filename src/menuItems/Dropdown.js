import crel from 'crelt';

function translate(view, text) {
  return view._props.translate ? view._props.translate(text) : text;
}

const prefix = 'ProseMirror-menu';

function renderDropdownItems(items, view) {
  const rendered = [],
    updates = [];
  for (let i = 0; i < items.length; i++) {
    const {dom, update} = items[i].render(view);
    rendered.push(crel('div', {class: prefix + '-dropdown-item'}, dom));
    updates.push(update);
  }
  return {dom: rendered, update: combineUpdates(updates, rendered)};
}

function combineUpdates(updates, nodes) {
  return (state) => {
    let something = false;
    for (let i = 0; i < updates.length; i++) {
      const up = updates[i](state);
      nodes[i].style.display = up ? '' : 'none';
      if (up) something = true;
    }
    return something;
  };
}

// ::- A drop-down menu, displayed as a label with a downwards-pointing
// triangle to the right of it.
export class HoverDropdown {
  // :: ([MenuElement], ?Object)
  // Create a dropdown wrapping the elements. Options may include
  // the following properties:
  //
  // **`label`**`: string`
  //   : The label to show on the drop-down control.
  //
  // **`title`**`: string`
  //   : Sets the
  //     [`title`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/title)
  //     attribute given to the menu control.
  //
  // **`class`**`: string`
  //   : When given, adds an extra CSS class to the menu control.
  //
  // **`css`**`: string`
  //   : When given, adds an extra set of CSS styles to the menu control.
  constructor(content, options) {
    this.options = options || {};
    this.content = Array.isArray(content) ? content : [content];
  }

  // :: (EditorView) → {dom: dom.Node, update: (EditorState)}
  // Render the dropdown menu and sub-items.
  render(view) {
    const content = renderDropdownItems(this.content, view);

    const label = crel(
      'div',
      {
        class: prefix + '-dropdown ' + (this.options.class || ''),
        style: this.options.css,
      },
      translate(view, this.options.label)
    );
    if (this.options.title)
      label.setAttribute('title', translate(view, this.options.title));
    const wrap = crel('div', {class: prefix + '-dropdown-wrap'}, label);

    if (this.options.dataTest) wrap.dataset.test = this.options.dataTest;

    this.expand(wrap, content.dom);

    function update(state) {
      const inner = content.update(state);
      wrap.style.display = inner ? '' : 'none';
      return inner;
    }

    return {dom: wrap, update};
  }

  expand(dom, items) {
    const menuDOM = crel(
      'div',
      {class: prefix + '-dropdown-menu ' + (this.options.class || '')},
      items
    );

    let done = false;
    function close() {
      if (done) return false;
      done = true;
      dom.removeChild(menuDOM);
      return true;
    }
    dom.appendChild(menuDOM);
    return {close, node: menuDOM};
  }
}
