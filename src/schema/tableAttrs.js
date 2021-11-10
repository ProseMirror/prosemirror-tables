export const tableExtraAttrs = {
  sort: {
    default: {col: null, dir: null},
    getFromDOM(dom) {
      if (!(dom instanceof HTMLElement)) {
        return {};
      }
      return dom.getAttribute('sort') ? JSON.parse(dom.getAttribute('sort')) : [];
    },

    setDOMAttr(value, attrs) {
      if (value)
        attrs.sort = JSON.stringify(value);
    }
  },
  headers: {
    default: true,
    getFromDOM(dom) {
      if (!(dom instanceof HTMLElement)) {
        return {};
      }
      return dom.getAttribute('headers') || true;
    },

    setDOMAttr(value, attrs) {
      if (value)
        attrs.headers = value;
    }
  },
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
  filters: {
    default: [],
     getFromDOM(dom) {
      if (!(dom instanceof HTMLElement)) {
        return {};
      }
      return dom.getAttribute('filters') ? JSON.parse(dom.getAttribute('filters')) : [];
    },

    setDOMAttr(value, attrs) {
      if (value)
        attrs.filters = JSON.stringify(value);
    }
  },
}