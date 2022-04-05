const COLORS = ['#ffffff', '#ff0000', '#ffff00', '#ff00ff', '#00ff00', '#0dcfff'];

const G = 1; // Gravitaional constant
const MIN_DISPLACEMENT = 100 ** 2;
const MAX_STARTING_VELOCITY = 3;
const BORDER_WIDTH = 10;

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
    annotationElm;
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
        planet.addAnnotation(this.planets, this.annotationElm);
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
        this._initAnnotations(element);

        this.bordered = element.classList.contains('bordered');
        this.randomDirection = false;
        this.gravity = true;
        this.element.addEventListener('click', (event) => {this.addPlanet(event);});
    }

    addDomElement(planet) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(""));
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
            planet.calculateForce(this.planets, this.gravity, {height: this.height, width: this.width})
                .then(planet.step({
                    bordered: this.bordered, 
                    height: this.height, 
                    width: this.width
                }))
                .then(this.updatePlanetPositions());
        }

        this.updatePlanetPositions();
        this.updateLines();
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

    _initAnnotations(element) {
        const annotationElm = document.getElementById('annotation');
        annotationElm.setAttributeNS(null, 'width', this.width);
        annotationElm.setAttributeNS(null, 'height', this.height);
        annotationElm.setAttributeNS(null, 'viewBox', `0 0 ${this.width} ${this.height}`);
        this.annotationElm = annotationElm;
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

    toggleBorder() {
        this.bordered = !this.bordered;
    }

    resize() {
        this.setDimensions(
            this.element.clientHeight, this.element.clientWidth
        );
        this.annotationElm.setAttributeNS(null, 'width', this.width);
        this.annotationElm.setAttributeNS(null, 'height', this.height);
        this.annotationElm.setAttributeNS(null, 'viewBox', `0 0 ${this.width} ${this.height}`);
    }

    toggleRandomDirection() {
        this.randomDirection = !this.randomDirection;
    }

    toggleGravity() {
        this.gravity = !this.gravity;
    }

    updateLines() {      
        for (let i = 0; i < this.planets.length; i++) {
            const planet = this.planets[i];

            for (let j = 0; j < this.planets.length; j++) {
                if (j >= i) continue;
                const otherPlanet = this.planets[j];
                planet.updateLineToPlanet(otherPlanet);
            }
            
        }
    }
}

// Move to own class

function addSvgLine(x1, x2, y1, y2, svgElement) {
    //  Should use the same line and then change the position to animate
    const line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
    line.setAttributeNS(null, 'x1', x1);
    line.setAttributeNS(null, 'x2', x2);
    line.setAttributeNS(null, 'y1', -y1);
    line.setAttributeNS(null, 'y2', -y2);
    line.setAttributeNS(null, 'stroke-width', '2');
    line.setAttributeNS(null, 'stroke', 'white');

    svgElement.appendChild(line);
    return line;
}

function addSvgLineFromVectors(p1, p2, svgElement) {
    return addSvgLine(p1.x, p2.x, p1.y, p2.y, svgElement);
}

function updateSvgLine(x1, x2, y1, y2, lineElement) {
    lineElement.setAttributeNS(null, 'x1', x1);
    lineElement.setAttributeNS(null, 'x2', x2);
    lineElement.setAttributeNS(null, 'y1', -y1);
    lineElement.setAttributeNS(null, 'y2', -y2);
}

function updateSvgLineFromVectors(p1, p2, lineElement) {
    updateSvgLine(p1.x, p2.x, p1.y, p2.y, lineElement)
}


class Planet {
    id;
    color;
    radius;
    div;
    
    position;
    velocity;
    resultantForce;

    lines;

    constructor(position, color, randomDirection) {
        this.id = nextId();
        this.position = position;
        this.radius = 5;
        this.color = color;
        this.velocity = randomDirection ? this.getRandomVelocity() : new Velocity(0, 0);
        this.resultantForce = new Vector(0, 0);
        this.lines = {};
    }

    async calculateForce(planets, gravity, {height, width}) {
        let resultantForce = new Vector(0, 0);

        if (!gravity) { 
            this.resultantForce = resultantForce; 
        } else {
            for (let i = 0; i < planets.length; i++) {
                const otherPlanet = planets[i];
                const isOtherInBounds = otherPlanet.isWithinBounds(height, width);
                const isInBounds = this.isWithinBounds(height, width)
                if (otherPlanet.id != this.id && isOtherInBounds && isInBounds) {
                    const displacement = this.findDisplacement(otherPlanet);
                    const distance2 = Math.max(displacement.mod2(), MIN_DISPLACEMENT);
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
        if (this.position.x > width - BORDER_WIDTH) {
            this.velocity.x *= -0.95;
        }
        if (this.position.x < 0 - BORDER_WIDTH) {
            this.velocity.x *= -0.95;
        }
        if (this.position.y < -height + BORDER_WIDTH) {
            this.velocity.y *= -0.95;
        }
        if (this.position.y > 0 + BORDER_WIDTH) {
            this.velocity.y *= -0.95;
        }
    }

    isWithinBounds(height, width) {
        return this.position.x < width - BORDER_WIDTH 
            && this.position.x > 0 + BORDER_WIDTH 
            && this.position.y > -height + BORDER_WIDTH 
            && this.position.y < 0 - BORDER_WIDTH;
    }

    setDiv(divElement) {
        this.div = divElement;
        this.div.id = this.id;
    }

    getRandomVelocity() {
        return new Velocity(
            (Math.random() - 0.5) * MAX_STARTING_VELOCITY,
            (Math.random() - 0.5) * MAX_STARTING_VELOCITY
        )
    }

    addAnnotation(planetList, svgElement) {
        for (let i = 0; i < planetList.length; i++) {
            const planet = planetList[i];
            if (planet.id != this.id) {
                this.lines[planet.id] = this.addLineToOtherPlanet(planet, svgElement);
            }
        }
    }

    addLineToOtherPlanet(planet, svgElement) {
        return addSvgLineFromVectors(this.position, planet.position, svgElement);
    }

    updateLineToPlanet(planet) {
        const line = this.lines[planet.id];
        updateSvgLineFromVectors(this.position, planet.position, line);
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
    
    // Additional options
    document.getElementById('use-border').addEventListener('change', () => {toggleBorder()});
    document.getElementById('random-direction').addEventListener('change', () => {toggleRandomDirection()});
    document.getElementById('disable-gravity').addEventListener('change', () => {toggleGravity()});
    document.getElementById('toggle-additional-options').addEventListener('click', (e) => {toggleDisplayAdditionalOptions(e)});
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


// Additional options

function toggleBorder() {
    gravity.toggleBorder();
    document.getElementById('gravity').classList.toggle('bordered');
}

function toggleRandomDirection() {
    gravity.toggleRandomDirection();
}

function toggleGravity() {
    gravity.toggleGravity();
}

function toggleDisplayAdditionalOptions(event) {
    document.getElementById('additional-options').classList.toggle('hidden');
    event.target.value = event.target.value == 'hide' ? 'show' : 'hide';
    event.target.innerHTML = event.target.value == 'hide' ? 'Hide additional options' : 'Show additional options';    
}

const gravity = new Gravity();