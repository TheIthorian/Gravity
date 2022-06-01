import { Store } from './Gravity/store.js';

const OPTIONS = [
    { id: 'use-border', action: 'toggleBorder' },
    { id: 'disable-gravity', action: 'toggleGravity' },
    { id: 'vertical-gravity', action: 'toggleVerticalGravity' },
    { id: 'random-direction', action: 'toggleRandomDirection' },
    {
        id: 'enable-draw-annotations',
        action: 'toggleAnnotations',
        additionalAction: () => {
            ['enable-draw-lines-between-planets-group'].forEach(id => {
                const visible = document.getElementById('enable-draw-annotations').checked;
                const option = document.getElementById(id);
                visible ? option.classList.remove('hidden') : option.classList.add('hidden');
            });
        },
    },
    {
        id: 'enable-draw-lines-between-planets',
        action: 'toggleLinesBetweenPlanets',
    },
    { id: 'min-displacement', action: 'changeMinimumDisplacement' },
];

const configStore = new Store('gravityConfig');

var debugElement;

export default function UI(gravity) {
    window.addEventListener('load', () => {
        gravity.setElement(document.getElementById('gravity')); // Sets the gravity div

        // Add event handlers to UI control
        hookControlButtons(gravity);
        hookAdditionalOptions(gravity);
        setStoredConfigValues();
        setupLogger();
        setupHotkeys(gravity);
    });

    window.addEventListener('resize', () => {
        gravity.resize();
    });
}

function setStoredConfigValues() {
    const config = configStore.getAll();
    if (!config) return;

    Object.entries(config).forEach(item => {
        const option = document.getElementById(item[0]);
        if (option.type === 'checkbox') {
            option.checked = item[1];
        } else {
            option.value = item[1];
        }

        if (option.id === 'enable-draw-annotations') {
            const optionElm = document.getElementById('enable-draw-lines-between-planets-group');
            option.checked
                ? optionElm.classList.remove('hidden')
                : optionElm.classList.add('hidden');
        }
    });
}

// Hook up additional option checkboxes to the corresponding gravity function
function hookAdditionalOptions(gravity) {
    // Menu handler
    document.getElementById('toggle-additional-options').addEventListener('click', e => {
        toggleDisplayAdditionalOptionsMenu(e);
    });

    OPTIONS.forEach(option => {
        const fn = option.action;
        const optionElm = document.getElementById(option.id);
        optionElm.addEventListener('change', e => {
            gravity[fn](e);
            configStore.set(
                option.id,
                e.target.type === 'checkbox' ? e.target.checked : e.target.value
            );
            console.log('config', configStore.getAll());
        });
        if (option.additionalAction) {
            optionElm.addEventListener('change', e => {
                option.additionalAction(e);
            });
        }
    });
}

function toggleDisplayAdditionalOptionsMenu() {
    const button = document.getElementById('toggle-additional-options');
    const menu = button.nextElementSibling;
    const isHidden = menu.classList.contains('hidden');

    if (isHidden) {
        button.innerHTML = 'Hide additional options';
        button.value = 'hide';
        menu.classList.remove('hidden');
    } else {
        button.innerHTML = 'Show additional options';
        button.value = 'show';
        menu.classList.add('hidden');
    }
}

function hookControlButtons(gravity) {
    document.getElementById('pause').addEventListener('click', () => {
        pause(gravity);
    });
    document.getElementById('start').addEventListener('click', () => {
        start(gravity);
    });
    document.getElementById('reset').addEventListener('click', () => {
        reset(gravity);
    });
}

function pause(gravity) {
    gravity.pauseSim();
    document.getElementById('pause').classList.add('hidden');
    document.getElementById('start').classList.remove('hidden');
}

function start(gravity) {
    gravity.startSim();
    document.getElementById('pause').classList.remove('hidden');
    document.getElementById('start').classList.add('hidden');
}

function reset(gravity) {
    gravity.reset();
    document.getElementById('pause').classList.remove('hidden');
    document.getElementById('start').classList.add('hidden');
}

function toggleDebug() {
    debugElement?.classList?.toggle('hidden');
}

function setupLogger() {
    debugElement = document.createElement('pre');

    debugElement.style.color = 'white';
    debugElement.style.position = 'absolute';
    debugElement.style.left = '10px';
    debugElement.style.bottom = '10px';
    debugElement.classList.add('hidden');
    document.getElementsByTagName('body')[0].appendChild(debugElement);

    // Reference to native method
    var oldLog = console.log;

    console.log = function (...items) {
        // Call native method first
        oldLog.apply(this, items);

        // Use JSON to transform objects, all others display normally
        items.forEach((item, i) => {
            items[i] = typeof item === 'object' ? JSON.stringify(item, null, 4) : item;
        });
        debugElement.innerHTML = items.join(' ') + '<br />';
    };
}

function setupHotkeys(gravity) {
    const hotkeys = {
        KeyM: toggleDisplayAdditionalOptionsMenu,
        KeyP: () => pause(gravity),
        KeyD: toggleDebug,
        Space: () =>
            gravity.addPlanet({
                clientX: Math.random() * window.innerWidth,
                clientY: Math.random() * window.innerHeight,
            }),
    };

    window.addEventListener('keydown', e => {
        console.log(e, e.code);
        for (const [key, fn] of Object.entries(hotkeys)) {
            if (e.code === key) {
                console.log(key);
                fn();
            }
        }
    });
}
