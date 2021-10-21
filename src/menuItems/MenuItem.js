import crel from 'crelt';

const SVG = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';

const prefix = 'ProseMirror-icon';

function hashPath(path) {
  let hash = 0;
  for (let i = 0; i < path.length; i++)
    hash = ((hash << 5) - hash + path.charCodeAt(i)) | 0;
  return hash;
}

// Work around classList.toggle being broken in IE11
function setClass(dom, cls, on) {
  if (on) dom.classList.add(cls);
  else dom.classList.remove(cls);
}

function translate(view, text) {
  return view._props.translate ? view._props.translate(text) : text;
}

function buildSVG(name, data) {
  let collection = document.getElementById(prefix + '-collection');
  if (!collection) {
    collection = document.createElementNS(SVG, 'svg');
    collection.id = prefix + '-collection';
    collection.style.display = 'none';
    document.body.insertBefore(collection, document.body.firstChild);
  }
  const sym = document.createElementNS(SVG, 'symbol');
  sym.id = name;
  sym.setAttribute('viewBox', '0 0 ' + data.width + ' ' + data.height);
  const path = sym.appendChild(document.createElementNS(SVG, 'path'));
  path.setAttribute('d', data.path);
  collection.appendChild(sym);
}

export function getIcon(icon) {
  const node = document.createElement('div');
  node.className = prefix;
  if (icon.path) {
    const name = 'pm-icon-' + hashPath(icon.path).toString(16);
    if (!document.getElementById(name)) buildSVG(name, icon);
    const svg = node.appendChild(document.createElementNS(SVG, 'svg'));
    svg.style.width = icon.width / icon.height + 'em';
    const use = svg.appendChild(document.createElementNS(SVG, 'use'));
    use.setAttributeNS(
      XLINK,
      'href',
      /([^#]*)/.exec(document.location)[1] + '#' + name
    );
  } else if (icon.dom) {
    node.appendChild(icon.dom.cloneNode(true));
  } else {
    node.appendChild(document.createElement('span')).textContent =
      icon.text || '';
    if (icon.css) node.firstChild.style.cssText = icon.css;
  }
  return node;
}

// ::- An icon or label that, when clicked, executes a command.
export class MenuItem {
  // :: (MenuItemSpec)
  constructor(spec) {
    // :: MenuItemSpec
    // The spec used to create the menu item.
    this.spec = spec;
  }

  // :: (EditorView) → {dom: dom.Node, update: (EditorState) → bool}
  // Renders the icon according to its [display
  // spec](#menu.MenuItemSpec.display), and adds an event handler which
  // executes the command when the representation is clicked.
  render(view) {
    const spec = this.spec;
    const dom = spec.render
      ? spec.render(view)
      : spec.icon
      ? getIcon(spec.icon)
      : spec.label
      ? crel('div', null, translate(view, spec.label))
      : null;
    if (!dom) throw new RangeError('MenuItem without icon or label property');
    if (spec.title) {
      const title =
        typeof spec.title === 'function' ? spec.title(view.state) : spec.title;
      dom.setAttribute('title', translate(view, title));
    }
    if (spec.class) dom.classList.add(spec.class);
    if (spec.css) dom.style.cssText += spec.css;

    dom.addEventListener('click', (e) => {
      e.preventDefault();
      if (!dom.classList.contains(prefix + '-disabled'))
        spec.run(view.state, view.dispatch, view, e);
    });

    function update(state) {
      if (spec.select) {
        const selected = spec.select(state);
        dom.style.display = selected ? '' : 'none';
        if (!selected) return false;
      }
      let enabled = true;
      if (spec.enable) {
        enabled = spec.enable(state) || false;
        setClass(dom, prefix + '-disabled', !enabled);
      }
      if (spec.active) {
        const active = (enabled && spec.active(state)) || false;
        setClass(dom, prefix + '-active', active);
      }
      return true;
    }

    return {dom, update};
  }
}
