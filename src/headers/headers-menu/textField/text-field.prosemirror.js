import {Field} from './menu-field.prosemirror';

// ::- A field class for single-line text fields.
export class TextField extends Field {
  render() {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = this.options.id;
    input.className = this.options.class;
    input.placeholder = this.options.placeholder;
    input.value = this.options.value || '';
    input.autocomplete = 'off';

    this.dom = input;

    return input;
  }
}
