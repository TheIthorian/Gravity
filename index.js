const COLORS = ['#ffffff', '#ff0000', '#ffff00', '#ff00ff', '#00ff00', '#0000ff'];
const G = 1;
const MIN_DISPLACEMENT = 100;
const STEP_TIME = 1;
const INTERVAL = 10;
const MAX_STARTING_VELOCITY = 10;

var id = 1;
function nextId() {
    id++;
    return id;
}

class Gravity {
    height;
    width;
    element;
    planets;
    sim;

    colorsA;
    colorsB;
    useA;

    bordered;
    randomDirection;
    gravity;

    constructor() {
        this.planets = [];
        this.initColors();
        this.sim = setInterval(() => {this.step()}, INTERVAL);
    }

    addPlanet(event) {
        const planet = new Planet(
            new Coordinate(event.clientX, -event.clientY), 
            this.getRandomColor(), 
            this.randomDirection
        );
        this.planets.push(planet);
        this.addDomElement(planet);
    }

    setDimensions(height, width) {
        this.height = height;
        this.width = width;
    }

    setElement(element) {
        this.element = element;
        this.setDimensions(
            element.clientHeight, element.clientWidth
        );
        this.bordered = element.classList.contains('bordered');
        this.randomDirection = false;
        this.gravity = true;
        this.element.addEventListener('click', (event) => {this.addPlanet(event);});
    }

    addDomElement(planet) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode("."));
        div.classList.add('planet');
        div.style.position = 'absolute';
        div.style.left = planet.position.x + 'px';
        div.style.top = -planet.position.y + 'px';
        div.style.width = (planet.radius * 2) + 'px';
        div.style.height = (planet.radius * 2) + 'px';
        div.style.backgroundColor = planet.color;
        planet.setDiv(div);
        this.element.appendChild(div);
    }

    step() {
        for (let i = 0; i < this.planets.length; i++) {
            const planet = this.planets[i];
            planet.calculateForce(this.planets, this.gravity)
                .then(planet.step({
                    bordered: this.bordered, 
                    height: this.height, 
                    width: this.width
                }))
                .then(this.updatePlanetPositions());
        }

        this.updatePlanetPositions();
    }

    updatePlanetPositions() {
        for (let i = 0; i < this.planets.length; i++) {
            const planet = this.planets[i];
            planet.div.style.left = planet.position.x + 'px';
            planet.div.style.top = -planet.position.y + 'px';
        }
    }

    pauseSim() {
        clearInterval(this.sim);
    }

    startSim() {
        this.sim = setInterval(() => {this.step()}, INTERVAL);
    }

    reset() {
        this.planets = [];
        this.element.innerHTML = "";
        clearInterval(this.sim);
        this.startSim();
    }

    initColors() {
        this.colorsA = COLORS.map(x => x);
        this.colorsB = [];
        this.useA = true;
    }

    getRandomColor() {
        const fn = (a, b) => {
            const i = Math.floor(Math.random() * a.length);
            const color = a.splice(i, 1);
            b.push(color);
            return color;
        }
        const color = this.useA 
            ? fn(this.colorsA, this.colorsB) 
            : fn(this.colorsB, this.colorsA);

        if (this.colorsA.length == 0) {this.useA = false;}
        if (this.colorsB.length == 0) {this.useA = true;}
        return color;
    }

    addBorder() {
        this.bordered = true;
    }

    removeBorder() {
        this.bordered = false;
    }

    resize() {
        this.setDimensions(
            this.element.clientHeight, this.element.clientWidth
        );
    }

    toggleRandomDirection() {
        this.randomDirection = !this.randomDirection;
    }

    toggleGravity() {
        this.gravity = !this.gravity;
    }
}


class Planet {
    id;
    color;
    radius;
    div;
    
    position;
    velocity;
    resultantForce;

    constructor(position, color, randomDirection) {
        this.id = nextId();
        this.position = position;
        this.radius = 5;
        this.color = color;
        this.velocity = randomDirection ? this.getRandomVelocity() : new Velocity(0, 0);
        this.resultantForce = new Vector(0, 0);
    }

    async calculateForce(planets, gravity) {
        let resultantForce = new Vector(0, 0);

        if (!gravity) { 
            this.resultantForce = resultantForce; 
        } else {
            for (let i = 0; i < planets.length; i++) {
                const otherPlanet = planets[i];
                if (otherPlanet.id != this.id) {
                    const displacement = this.findDisplacement(otherPlanet);
                    const distance2 = Math.max(displacement.mod2(), MIN_DISPLACEMENT ** 2);
                    const unitVector = displacement.findUnitVector();
    
                    const force = unitVector.multiply((G * otherPlanet.mass()) / distance2);
                    resultantForce = resultantForce.add(force);
                }
            }
        }        
        this.resultantForce = resultantForce;
    }

    step({bordered, height, width}){
        const dv = this.resultantForce.multiply(STEP_TIME);
        this.velocity = this.velocity.add(dv);

        if (bordered) {
            this.bounce(height, width);
        }
        const dp = this.velocity.multiply(STEP_TIME);

        this.position = this.position.add(dp);

        const d = {};
        d.left = this.div.style.left, 
        d.top = this.div.style.top;
    }

    mass() {
        return this.radius ** 3;
    }

    findDisplacement(otherPlanet) {
        const displacement = this.position.findDisplacement(otherPlanet.position);
        return displacement;
    }

    bounce(height, width) {
        if (this.position.x > width) {
            this.velocity.x *= -1;
        }
        if (this.position.x < 0) {
            this.velocity.x *= -1;
        }
        if (this.position.y <-height) {
            this.velocity.y *= -1;
        }
        if (this.position.y > 0) {
            this.velocity.y *= -1;
        }
    }

    setDiv(divElement) {
        this.div = divElement;
    }

    getRandomVelocity() {
        return new Velocity(
            (Math.random() - 0.5) * MAX_STARTING_VELOCITY,
            (Math.random() - 0.5) * MAX_STARTING_VELOCITY
        )
    }
}

class Vector {
    x;
    y;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(vector) {
        const x = this.x + vector.x;
        const y = this.y + vector.y;
        return new Vector(x, y);
        
    }

    multiply(factor) {
        const x = this.x * factor;
        const y = this.y * factor;
        return new Vector(x, y);
    }

    mod() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    mod2() {
        return this.x ** 2 + this.y ** 2;
    }

    findDisplacement(vector) {
        const dx = vector.x - this.x;
        const dy = vector.y - this.y;
        return new Vector(dx, dy);
    }

    findUnitVector() {
        return new Vector(this.x / this.mod(), this.y/this.mod());
    }
}

class Coordinate extends Vector {}

class Velocity extends Vector {}

class Force extends Vector {}


window.addEventListener('load', () => {
    gravity.setElement(document.getElementById('gravity'));
    document.getElementById('pause').addEventListener('click', () => {pause()});
    document.getElementById('start').addEventListener('click', () => {start()});
    document.getElementById('reset').addEventListener('click', () => {reset()});
    document.getElementById('add-border').addEventListener('click', () => {addBorder()});
    document.getElementById('remove-border').addEventListener('click', () => {removeBorder()});
    document.getElementById('random-direction').addEventListener('change', () => {toggleRandomDirection()});
    document.getElementById('disable-gravity').addEventListener('change', () => {toggleGravity()});
});

window.addEventListener('resize', () => {
    gravity.resize();
});

function pause() {
    gravity.pauseSim();
    document.getElementById('pause').classList.add('hidden');
    document.getElementById('start').classList.remove('hidden');
}

function start() {
    gravity.startSim();
    document.getElementById('pause').classList.remove('hidden');
    document.getElementById('start').classList.add('hidden');
}

function reset() {
    gravity.reset();
    document.getElementById('pause').classList.remove('hidden');
    document.getElementById('start').classList.add('hidden');
}

function addBorder() {
    gravity.addBorder();
    document.getElementById('add-border').classList.add('hidden');
    document.getElementById('remove-border').classList.remove('hidden');
    document.getElementById('gravity').classList.add('bordered');
}

function removeBorder() {
    gravity.removeBorder();
    document.getElementById('add-border').classList.remove('hidden');
    document.getElementById('remove-border').classList.add('hidden');
    document.getElementById('gravity').classList.remove('bordered');
}

function toggleRandomDirection() {
    gravity.toggleRandomDirection();
}

function toggleGravity() {
    gravity.toggleGravity();
}

const gravity = new Gravity();