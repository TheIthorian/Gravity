import { COLORS } from './public/Gravity/constants.js';
import { Gravity } from './public/Gravity/module.js';
import { Store } from './public/Gravity/store.js';
import UI from './public/uiController.js';

const configStore = new Store('gravityConfig');

const gravity = new Gravity({
    planetColors: COLORS,
    ...configStore.convertForGravity()
});

UI(gravity);

console.log('config', configStore.getAll());
console.log('config', gravity.config);