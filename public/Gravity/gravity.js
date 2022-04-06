import Planet from './planet.js';
import { Coordinate } from './vector.js';
import { INTERVAL, COLORS } from './constants.js';
import { ColorHandler } from './util.js';

export default class Gravity {
    height;
    width;
    element;
    annotationElm;
    planets;
    sim;

    colorHandler;

    bordered;
    randomDirection;
    gravity;

    constructor() {
        this.planets = [];
        this.colorHandler = new ColorHandler(COLORS);
        this.sim = setInterval(() => {this.step()}, INTERVAL);
    }

    addPlanet(event) {
        const planet = new Planet(
            new Coordinate(event.clientX, -event.clientY), 
            this.colorHandler.getRandomColor(), 
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

    _initAnnotations(element) {
        const annotationElm = document.getElementById('annotation');
        annotationElm.setAttributeNS(null, 'width', this.width);
        annotationElm.setAttributeNS(null, 'height', this.height);
        annotationElm.setAttributeNS(null, 'viewBox', `0 0 ${this.width} ${this.height}`);
        this.annotationElm = annotationElm;
    }

    toggleBorder() {
        this.bordered = !this.bordered;
        this.element.classList.toggle('bordered');
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