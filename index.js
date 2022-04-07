import { COLORS } from './public/Gravity/constants.js';
import { Gravity } from './public/Gravity/module.js';
import UI from './public/uiController.js';


const gravity = new Gravity({
    planetColors: COLORS
});

UI(gravity);