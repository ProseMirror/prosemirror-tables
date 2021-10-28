import React from 'react';
import ReactDOM from 'react-dom';

export class ReactNodeView {
  constructor(node, view, getPos, decorations, component, componentProps) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.decorations = decorations;
    this.component = component;
    this.componentProps = componentProps || {};

    // creates initial element and adds class
    this.dom = this.createDOM();

    this.dom.setAttribute('data-test', `${this.node.type.name}-dom`);

    // appends contentDOM if relevant
    if (!this.node.isLeaf) {
      this.contentDOM = this.createContentDOM();
      this.contentDOM.setAttribute(
        'data-test',
        `${this.node.type.name}-content`
      );
      this.dom.appendChild(this.contentDOM);
    }

    // renders and creates portal
    this.renderComponent();
  }

  handleRef = (node) => this._handleRef(node);

  _handleRef(node) {
    const {contentDOM} = this;

    // move the contentDOM node inside the inner reference after rendering
    if (node && contentDOM && !node.contains(contentDOM)) {
      node.appendChild(contentDOM);
    }
  }

  renderPortal(forwardRef, node, index, componentProps) {
    const NodeViewComponent = (props) => {
      return (
        <this.component
          {...props}
          {...componentProps}
          componentId={node.attrs.componentId}
          dom={this.dom}
          editorContentRef={forwardRef}
          getPos={this.getPos}
          index={index}
          isVisible={node.attrs.isVisible}
          node={node}
          view={this.view}
        />
      );
    };
    return NodeViewComponent;
  }

  renderComponent() {
    const component = this.renderPortal(
      this.handleRef,
      this.node,
      this.index,
      this.componentProps
    );

    ReactDOM.render(component(), this.dom);
  }

  destroy() {
    this.dom = undefined;
    this.contentDOM = undefined;
  }

  // https://discuss.prosemirror.net/t/draggable-and-nodeviews/955
  // eslint-disable-next-line class-methods-use-this
  // stopEvent(e) {
  //   if (e.target.dataset && e.target.dataset.drag) {
  //     return false;
  //   }
  //   return e.type === 'mousedown' && !e.type.startsWith('drag');
  // }

  setDomAttrs(node, element) {
    Object.keys(node.attrs || {}).forEach((attr) => {
      element.setAttribute(attr, node.attrs[attr]);
    });
  }

  update(node) {
    if (this.node.type.name !== node.type.name) {
      return false;
    }

    if (this.dom && !this.node.sameMarkup(node)) {
      this.setDomAttrs(node, this.dom);
      this.node = node;
      this.renderComponent();
    }
    return true;
  }

  ignoreMutation() {
    return false;
  }
}

export default ReactNodeView;
