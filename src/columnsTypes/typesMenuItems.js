import {MenuItem} from 'prosemirror-menu';
import {createElementWithClass} from '../util';
import {types} from './types.config';

export const getTypesItems = () => {
  return types.map((type) => {
    const dom = createElementWithClass('div', type.id);
    dom.classList.add(type.id);

    const icon = createElementWithClass('img', 'typeItemIcon');
    icon.src = type.icon;

    const label = createElementWithClass('span', 'typeItemLabel');
    label.innerText = type.displayName;

    dom.appendChild(icon);
    dom.appendChild(label);

    return new MenuItem({
      render: () => dom,
      class: 'typeItem',
      run(state, dispatch, view) {
        type.handler.convert(state, dispatch, view, type.id);
      },
    });
  });
};
