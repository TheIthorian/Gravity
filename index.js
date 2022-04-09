import { COLORS } from './public/Gravity/constants.js';
import { Gravity } from './public/Gravity/module.js';
import UI from './public/uiController.js';


let minDisplacement = document.getElementById('min-displacement')?.value;

const gravity = new Gravity({
    planetColors: COLORS,
    minDisplacement
});

UI(gravity);