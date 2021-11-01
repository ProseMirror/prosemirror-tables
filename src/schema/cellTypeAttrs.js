export const checkboxExtraAttrs = {
  checked: {
    default: false,
    getFromDOM(dom) {
      if (!(dom instanceof HTMLElement)) {
        return {};
      }
      return dom.getAttribute('checked') || '';
    },

    setDOMAttr(value, attrs) {
      if (value)
        attrs.checked = value;
    }
  },
}