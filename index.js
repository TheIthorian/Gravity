import { COLORS } from './public/Gravity/constants.js';
import { Gravity } from './public/Gravity/module.js';
import { MotionDetector } from './public/Gravity/motionDetector.js';
import { Store } from './public/Gravity/store.js';
import UI from './public/uiController.js';

const configStore = new Store('gravityConfig');
const motionDetector = new MotionDetector();

const gravity = new Gravity(
    {
        planetColors: COLORS,
        ...configStore.convertForGravity(),
    }, 
    motionDetector
);

UI(gravity);