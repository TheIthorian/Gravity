import { COLORS } from './public/Gravity/constants.js';
import { Gravity } from './public/Gravity/module.js';
import { MotionDetector } from './public/Gravity/motionDetector.js';
import { ConfigStore } from './public/Gravity/configStore.js';
import UI from './public/uiController.js';

const configStore = new ConfigStore('gravityConfig');
const motionDetector = new MotionDetector();

const gravity = new Gravity(
    {
        planetColors: COLORS,
        ...configStore.getForGravity(),
    },
    motionDetector
);

UI(gravity);
