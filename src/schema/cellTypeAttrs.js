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

export const dateExtraAttrs = {
  value: {
    default: -1,
    getFromDOM(dom) {
      if (!(dom instanceof HTMLElement)) {
        return {};
      }
      return Number(dom.getAttribute('value')) || -1;
    },

    setDOMAttr(value, attrs) {
      if (value)
        attrs.value = value;
    }
  },
}

export const labelsExtraAttrs = {
  labels: {
    default: [],
    getFromDOM(dom) {
      if (!(dom instanceof HTMLElement)) {
        return {};
      }
      return dom.getAttribute('labels') ? JSON.parse(dom.getAttribute('labels')) : [];
    },

    setDOMAttr(value, attrs) {
      if (value)
        attrs.labels = JSON.stringify(value);
    }
  },
}