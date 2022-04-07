import Planet from './planet.js';
import { Coordinate } from './vector.js';
import { INTERVAL, COLORS } from './constants.js';
import { ColorHandler } from './util.js';

export default class Gravity {
    height;
    width;
    element; // Div to attach content to
    annotationElm; // Svg element to attach annotations to
    planets;
    sim; // Rename to simInterval

    colorHandler;

    // config
    //   simulation
    bordered;
    gravity;

    //   annotations
    drawAnnotations;
    drawLinesBetweenPlanets;
    lineWidthBetweenPlanets;
    lineBetweenPlanetsFade;

    //   planets
    randomDirection; // Rename to randomVelocity
    planetColors;
    

    constructor(config) {
        this.planets = [];
        this.colorHandler = new ColorHandler(COLORS);
        this.config = config;
    }

    get dimensions() {
        return {height: this.height, width: this.width};
    } 
    set dimensions(dimensions) {
        if (!dimensions) throw 'dimensions is undefined';
        this.height = dimensions.height ?? 0;
        this.width = dimensions.width ?? 0;
    }

    get config() {
        return {
            enableBorder: this.bordered,
            enableRandomPlanetDirection: this.randomDirection,
            disableGravity: !this.gravity,
            enableDrawAnnotations: this.drawAnnotations,
            enableDrawLinesBetweenPlanets: this.drawLinesBetweenPlanets,
            lineWidthBetweenPlanets: this.lineWidthBetweenPlanets,
            lineBetweenPlanetsFade: this.lineBetweenPlanetsFade,
            planetColors: this.planetColors
        }
    }
    set config(config) {
        config = config ?? {};

        const { 
            enableBorder, 
            enableRandomPlanetDirection, 
            disableGravity,
            enableDrawAnnotations,
            enableDrawLinesBetweenPlanets,
            lineWidthBetweenPlanets, // Not implemented
            lineBetweenPlanetsFade,  // Not implemented
            planetColors             // Not implemented
        } = config;
        
        this.enableBorder = !!enableBorder;
        this.randomDirection = !!enableRandomPlanetDirection;
        this.gravity = !disableGravity;
        this.drawAnnotations = !enableDrawAnnotations;
        this.drawLinesBetweenPlanets = !!enableDrawLinesBetweenPlanets;
        this.lineWidthBetweenPlanets = lineWidthBetweenPlanets ?? 2;
        this.lineBetweenPlanetsFade = !!lineBetweenPlanetsFade;
        this.planetColors = planetColors ?? [];
    }

    addPlanet(event) {
        const planet = new Planet(
            new Coordinate(event.clientX, -event.clientY), 
            this.colorHandler.getRandomColor(), 
            this.randomDirection
        );
        this.planets.push(planet);
        this.addPlanetToDom(planet);
        planet.addAnnotation(this.planets, this.annotationElm, this.drawLinesBetweenPlanets);

        if (this.planets.length == 1) {
            this.startSim();
        }
    }

    setElement(element) {
        this.element = element;
        this.dimensions = { height: element.clientHeight, width: element.clientWidth };
        this._initAnnotations(element);
        this.bordered = element.classList.contains('bordered');
        this.randomDirection = false;
        this.gravity = true;
        this.element.addEventListener('click', (event) => {this.addPlanet(event);});
    }

    addPlanetToDom(planet) {
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

    _initAnnotations(element) {
        this.clearAnnotations();
        const annotationElm = element.getElementsByTagName('svg')[0];
        annotationElm.setAttributeNS(null, 'id', 'annotation');
        annotationElm.setAttributeNS(null, 'width', this.width);
        annotationElm.setAttributeNS(null, 'height', this.height);
        annotationElm.setAttributeNS(null, 'viewBox', `0 0 ${this.width} ${this.height}`);
        annotationElm.innerHTML = '';
        this.annotationElm = annotationElm;
    }

    clearAnnotations() {
        if (this.annotationElm) this.annotationElm.innerHTML = '';
    }

    step() {
        for (let i = 0; i < this.planets.length; i++) {
            const planet = this.planets[i];
            planet.calculateForce(this.planets, this.gravity, {...this.dimensions});
            planet.step({
                bordered: this.bordered, 
                height: this.height, 
                width: this.width
            });
        }

        this.updatePlanetDomPositions();
        this.updateLinesBetweenPlanets();
    }

    updatePlanetDomPositions() {
        this.planets.forEach(planet => {
            planet.div.style.left = planet.position.x + 'px';
            planet.div.style.top = -planet.position.y + 'px';
        });
    }

    updateLinesBetweenPlanets() {
        if (!this.drawAnnotations || !this.drawLinesBetweenPlanets) {
            return;
        }

        for (let i = 0; i < this.planets.length; i++) {
            const planet = this.planets[i];

            for (let j = 0; j < this.planets.length; j++) {
                if (j >= i) continue;
                const otherPlanet = this.planets[j];
                planet.updateLineToPlanet(otherPlanet);
            }
        }
    }


    // Instance controls 
    pauseSim() { clearInterval(this.sim); }
    startSim() {
        clearInterval(this.sim);
        this.sim = setInterval(() => {this.step()}, INTERVAL); 
    }

    reset() {
        this.planets.forEach(planet => {
            this.element.removeChild(planet.div);
        });
        this.planets = [];
        this._initAnnotations(this.element);
        this.startSim();
    }

    resize() {
        this.dimensions = {
            height: this.element.clientHeight, 
            width: this.element.clientWidth
        };
        this.annotationElm.setAttributeNS(null, 'width', this.width);
        this.annotationElm.setAttributeNS(null, 'height', this.height);
        this.annotationElm.setAttributeNS(null, 'viewBox', `0 0 ${this.width} ${this.height}`);
    }

    toggleBorder() {
        this.bordered = !this.bordered;
        this.element.classList.toggle('bordered');
    }

    toggleRandomDirection() {
        this.randomDirection = !this.randomDirection;
    }

    toggleGravity() {
        this.gravity = !this.gravity;
    }

    toggleAnnotations() {
        this.drawAnnotations = !this.drawAnnotations;
        const display = this.drawAnnotations ? '' : 'none';
        this.annotationElm.style.display = display;
    }

    toggleLinesBetweenPlanets() {
        this.drawLinesBetweenPlanets = !this.drawLinesBetweenPlanets;
        const display = this.drawLinesBetweenPlanets ? '' : 'none';
        this.planets.forEach(planet => {
            for (const line of Object.values(planet.lines)) {
                line.style.display = display;
            }
        });
    }
}