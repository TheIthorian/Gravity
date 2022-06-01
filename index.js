import { Gravity } from './public/Gravity/module.js';
import { MotionDetector } from './public/Gravity/motionDetector.js';
import { ConfigStore } from './public/Gravity/configStore.js';
import UI from './public/uiController.js';

const COLORS = ['#ffffff', '#ff0000', '#ffff00', '#ff00ff', '#00ff00', '#0dcfff'];
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
