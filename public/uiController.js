const OPTIONS = [
    {id: 'use-border', action: 'toggleBorder'},
    {id: 'disable-gravity', action: 'toggleGravity'},
    {id: 'random-direction', action: 'toggleRandomDirection'},
    {id: 'enable-draw-annotations', action: 'toggleAnnotations', additionalAction: () => {
        ['enable-draw-lines-between-planets-group'].forEach(id => {
            document.getElementById(id).classList.toggle('hidden');
        });
    }},
    {id: 'enable-draw-lines-between-planets', action: 'toggleLinesBetweenPlanets'},
    {id: 'min-displacement', action: 'changeMinimumDisplacement'}
]

export default function UI(gravity) {
    window.addEventListener('load', () => {
        gravity.setElement(document.getElementById('gravity')); // Sets the gravity div

        // Add event handlers to UI control
        hookControlButtons(gravity);
        hookAdditionalOptions(gravity);
    });

    window.addEventListener('resize', () => { gravity.resize(); });
}

// Hook up additional option checkboxes to the corresponding gravity function
function hookAdditionalOptions(gravity) {
    // Menu handler
    document.getElementById('toggle-additional-options')
            .addEventListener('click', (e) => {toggleDisplayAdditionalOptionsMenu(e)});

    OPTIONS.forEach(option => {
        const fn = option.action;
        const optionElm = document.getElementById(option.id);
        optionElm.addEventListener('change', (e) => { gravity[fn](e) });
        if (option.additionalAction) {
            optionElm.addEventListener('change', (e) => {option.additionalAction(e)});
        }
    });
}

function toggleDisplayAdditionalOptionsMenu(event) {
    document.getElementById('additional-options').classList.toggle('hidden');
    event.target.value = event.target.value == 'hide' ? 'show' : 'hide';
    event.target.innerHTML = event.target.value == 'hide' 
        ? 'Hide additional options' 
        : 'Show additional options';    
}

function hookControlButtons(gravity) {
    document.getElementById('pause').addEventListener('click', () => {pause(gravity)});
    document.getElementById('start').addEventListener('click', () => {start(gravity)});
    document.getElementById('reset').addEventListener('click', () => {reset(gravity)});
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