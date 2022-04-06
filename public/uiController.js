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


// Additional options

function toggleBorder(gravity) {
    gravity.toggleBorder();
    document.getElementById('gravity').classList.toggle('bordered');
}

function toggleRandomDirection(gravity) {
    gravity.toggleRandomDirection();
}

function toggleGravity(gravity) {
    gravity.toggleGravity();
}

function toggleDisplayAdditionalOptions(event) {
    document.getElementById('additional-options').classList.toggle('hidden');
    event.target.value = event.target.value == 'hide' ? 'show' : 'hide';
    event.target.innerHTML = event.target.value == 'hide' ? 'Hide additional options' : 'Show additional options';    
}

export default function initUI(gravity) {
    window.addEventListener('load', () => {
        gravity.setElement(document.getElementById('gravity'));
        document.getElementById('pause').addEventListener('click', () => {pause(gravity)});
        document.getElementById('start').addEventListener('click', () => {start(gravity)});
        document.getElementById('reset').addEventListener('click', () => {reset(gravity)});
        
        // Additional options
        document.getElementById('use-border').addEventListener('change', () => {toggleBorder(gravity)});
        document.getElementById('random-direction').addEventListener('change', () => {toggleRandomDirection(gravity)});
        document.getElementById('disable-gravity').addEventListener('change', () => {toggleGravity(gravity)});
        document.getElementById('toggle-additional-options').addEventListener('click', (e) => {toggleDisplayAdditionalOptions(e)});
    });

    window.addEventListener('resize', () => {
        gravity.resize();
    });
}