const COLORS = [];
const G = 1;
const MIN_DISPLACEMENT = 100;
const STEP_TIME = 1;
const INTERVAL = 10;

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

    constructor() {
        this.planets = [];
        this.sim = setInterval(() => {this.step()}, INTERVAL);
    }

    addPlanet(event) {
        const planet = new Planet(new Coordinate(event.clientX, -event.clientY));
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
            // planet.calculateForce(this.planets)
            //     .then(planet.step())
            //     .then(this.updatePlanetPositions());
            planet.calculateForce(this.planets);
            planet.step();
            this.updatePlanetPositions();
        }
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

    constructor(position) {
        this.id = nextId();
        this.position = position;
        this.radius = 5;
        this.color = '#ffffff';
        this.velocity = new Velocity(0, 0);
        this.resultantForce = new Vector(0, 0);
    }

    calculateForce(planets) {
        const resultantForce = new Vector(0, 0);
        for (let i = 0; i < planets.length; i++) {
            const otherPlanet = planets[i];
            if (otherPlanet.id != this.id) {
                let displacement = this.findDisplacement(otherPlanet);
                let distance2 = Math.max(displacement.mod2(), MIN_DISPLACEMENT ** 2);
                let unitVector = displacement.findUnitVector();

                const force = unitVector.multiply((G * otherPlanet.mass()) / distance2);
                resultantForce.add(force);
            }
            
        }
        this.resultantForce = resultantForce;
    }

    step(){
        const dv = this.resultantForce.multiply(STEP_TIME);
        this.velocity.add(dv);

        const dp = this.velocity.multiply(STEP_TIME)
        this.position.add(dp);

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

    setDiv(divElement) {
        this.div = divElement;
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
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    multiply(factor) {
        this.x *= factor;
        this.y *= factor;
        return this;
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
    document.getElementById('reset').addEventListener('click', () => {reset()})
});

function pause() {
    gravity.pauseSim();
    document.getElementById('pause').classList.add('hidden');
    document.getElementById('start').classList.remove('hidden');
}

function start() {
    gravity.startSim();
    document.getElementById('pause').classList.remove('hidden');
    document.getElementById('start').classList.add('hidden');}

function reset() {
    gravity.reset();
    document.getElementById('pause').classList.remove('hidden');
    document.getElementById('start').classList.add('hidden');
}


const gravity = new Gravity();