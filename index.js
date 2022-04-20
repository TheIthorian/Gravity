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

var output = document.createElement('pre');
output.style.color = 'white';
output.style.position = 'absolute';
output.style.left = '10px';
output.style.bottom = '10px';
document.getElementsByTagName('body')[0].appendChild(output);

// Reference to native method(s)
var oldLog = console.log;

console.log = function (...items) {
    // Call native method first
    oldLog.apply(this, items);

    // Use JSON to transform objects, all others display normally
    items.forEach((item, i) => {
        items[i] =
            typeof item === 'object' ? JSON.stringify(item, null, 4) : item;
    });
    output.innerHTML = items.join(' ') + '<br />';
};

console.log('hello');
