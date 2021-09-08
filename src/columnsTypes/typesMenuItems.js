import {MenuItem} from 'prosemirror-menu';
import {createElementWithClass} from '../util';
import {types} from './types.config';

export const getTypesItems = () => {
  return types.map((type) => {
    const dom = document.createElement('div');

    const icon = createElementWithClass('div', `${type.id}ItemIcon`);
    icon.classList.add('typeIcon');

    const label = createElementWithClass('span', 'typeItemLabel');
    label.innerText = type.displayName;

    dom.appendChild(icon);
    dom.appendChild(label);

    return new MenuItem({
      render: () => dom,
      class: 'typeItem',
      run(state, dispatch, view) {
        return type.handler.convert(state, dispatch, view, type.id);
      },
    });
  });
};
