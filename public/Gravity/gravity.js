import Planet from './planet.js';
import { Vector } from './vector.js';
import { ColorHandler } from './util.js';

export default class Gravity {
    height;
    width;
    element; // Div to attach content to
    annotationElm; // Svg element to attach annotations to
    planets;

    colorHandler;

    // config
    //   simulation
    bordered = false;
    gravity = true;
    verticalGravity = false;
    verticalGravityVector = new Vector(0, -1);

    //   annotations
    drawAnnotations = true;
    drawLinesBetweenPlanets = false;
    lineWidthBetweenPlanets = 2;
    lineBetweenPlanetsFade = 0;

    //   planets
    randomDirection = false; // Rename to randomVelocity
    planetColors = [];
    MIN_DISPLACEMENT = 50 ** 2;
    planetRenderer = () => '';

    constructor(config, motionDetector) {
        this.config = config || {};

        if (motionDetector) {
            this.motionDetector = motionDetector;
            this.motionDetector.on('windowMotion', e => {
                this.updatePlanetWindowPositions(e.detail);
            });
            this.motionDetector.on('deviceorientation', e => {
                this.updateGravityDirection(e.beta, e.gamma);
            });
        }

        this.planets = [];
        this.colorHandler = new ColorHandler(this.planetColors);
    }

    /**
     * @param {float} beta Rotation around the x axis, represented in degrees. Value ranging from -180 (inclusive) to 180 (exclusive).
     * This represents a front to back motion of the device.
     * @param {float} gamma Rotation around the y axis, represented in degrees with values ranging from -90 (inclusive) to 90 (exclusive).
     * This represents a left to right motion of the device.
     */
    updateGravityDirection(beta, gamma) {
        const fy = Math.sin((beta * Math.PI) / 180);
        const fx = Math.sin((gamma * Math.PI) / 180) * (1 - fy);
        console.log(fx, fy);
        this.verticalGravityVector = new Vector(fx, -fy);
    }

    get dimensions() {
        return { height: this.height, width: this.width };
    }
    set dimensions(dimensions) {
        this.height = dimensions?.height ?? 0;
        this.width = dimensions?.width ?? 0;
    }

    get config() {
        return {
            enableBorder: this.bordered,
            enableRandomPlanetDirection: this.randomDirection,
            disableGravity: !this.gravity,
            enableVerticalGravity: this.verticalGravity,
            enableDrawAnnotations: this.drawAnnotations,
            enableDrawLinesBetweenPlanets: this.drawLinesBetweenPlanets,
            lineWidthBetweenPlanets: this.lineWidthBetweenPlanets,
            lineBetweenPlanetsFade: this.lineBetweenPlanetsFade,
            planetColors: this.planetColors,
        };
    }
    set config(config) {
        config = config ?? {};

        const {
            enableBorder,
            enableRandomPlanetDirection,
            disableGravity,
            enableVerticalGravity,
            enableDrawAnnotations,
            enableDrawLinesBetweenPlanets,
            lineWidthBetweenPlanets, // Not implemented
            lineBetweenPlanetsFade, // Not implemented
            planetColors, // Not implemented
            minDisplacement,
        } = config;

        this.bordered = enableBorder ?? this.bordered;

        this.randomDirection = enableRandomPlanetDirection ?? this.randomDirection;

        this.gravity = !(disableGravity ?? !this.gravity);
        this.verticalGravity = enableVerticalGravity ?? this.verticalGravity;
        this.drawAnnotations = enableDrawAnnotations ?? this.drawAnnotations;

        this.drawLinesBetweenPlanets =
            enableDrawLinesBetweenPlanets ?? this.drawLinesBetweenPlanets;

        this.lineWidthBetweenPlanets = lineWidthBetweenPlanets ?? this.lineWidthBetweenPlanets;

        this.lineBetweenPlanetsFade = lineBetweenPlanetsFade ?? this.lineBetweenPlanetsFade;

        this.planetColors = planetColors ?? this.planetColors;
        this.minDisplacement = minDisplacement ?? this.minDisplacement;
    }

    /**
     * Adds a planet to the DOM.
     * @param {float} x X position
     * @param {float} y Y position
     */
    addPlanet(x, y) {
        const planet = new Planet(new Vector(x, -y), {
            color: this.colorHandler.getRandomColor(),
            randomDirection: this.randomDirection,
        });
        this.planets.push(planet);
        this.addPlanetToDom(planet);
        planet.addAnnotation(
            this.planets,
            this.annotationElm,
            this.drawLinesBetweenPlanets && this.drawAnnotations
        );

        if (this.planets.length == 1) {
            this.startSim();
        }
    }

    /**
     * @param {HTMLElement} element The element for which rendering will be applied to.
     */
    setElement(element) {
        this.element = element;
        this.dimensions = {
            height: element.clientHeight,
            width: element.clientWidth,
        };
        this.bordered
            ? this.element.classList.add('bordered')
            : this.element.classList.remove('bordered');
        this._initAnnotations();
        this.element.addEventListener('click', event => {
            this.addPlanet(event.clientX, event.clientY);
        });
    }

    /**
     * @param {Planet} planet
     */
    addPlanetToDom(planet) {
        const div = document.createElement('div');
        const child = document.createElement('div');
        child.innerHTML = this.planetRenderer();
        div.appendChild(child);
        div.classList.add('planet');
        div.style.position = 'absolute';
        div.style.left = planet.position.x + 'px';
        div.style.top = -planet.position.y + 'px';
        div.style.width = planet.radius * 2 + 'px';
        div.style.height = planet.radius * 2 + 'px';
        div.style.backgroundColor = planet.color;
        planet.div = div;
        this.element.appendChild(div);
    }

    /**
     * Clears all annotations and adds the svg parent to the DOM.
     */
    _initAnnotations() {
        this.clearAnnotations();
        const annotationElm = this.element.getElementsByTagName('svg')[0];
        annotationElm.setAttributeNS(null, 'id', 'annotation');
        annotationElm.setAttributeNS(null, 'width', this.width);
        annotationElm.setAttributeNS(null, 'height', this.height);
        annotationElm.setAttributeNS(null, 'viewBox', `0 0 ${this.width} ${this.height}`);
        annotationElm.innerHTML = '';
        this.annotationElm = annotationElm;
    }

    /**
     * Destorys all annotation DOM elements.
     */
    clearAnnotations() {
        if (this.annotationElm) this.annotationElm.innerHTML = '';
    }

    /**
     * A single iteration through the simulation.
     * Calculates acceleration and moves the planets a single step.
     */
    step() {
        if (this.paused) return;
        for (let i = 0; i < this.planets.length; i++) {
            const planet = this.planets[i];

            // Replace this with calculation callback?
            if (this.verticalGravity) {
                planet.calculateVerticalForce(
                    this.gravity,
                    { ...this.dimensions },
                    this.verticalGravityVector
                );
            } else {
                planet.calculateForce(
                    this.planets,
                    this.gravity,
                    { ...this.dimensions },
                    this.MIN_DISPLACEMENT
                );
            }

            planet.step({
                bordered: this.bordered,
                height: this.height,
                width: this.width,
                dampingFactor: this.verticalGravity ? 0.8 : 1.0,
                delta: this.verticalGravity ? 0 : null,
            });
        }

        this.updatePlanetDomPositions();
        this.updateLinesBetweenPlanets();

        window.requestAnimationFrame(() => {
            this.step();
        });
    }

    /**
     * Moves the planet's elements in the dom to match stored position
     */
    updatePlanetDomPositions() {
        // Move implementation to Planet.js?
        this.planets.forEach(planet => {
            planet.div.style.left = planet.position.x + 'px';
            planet.div.style.top = -planet.position.y + 'px';
        });
    }

    /**
     * Moves annotations to match stored position of planets
     */
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

    /**
     * Destorys any planets outside the border
     */
    removeOuterPlanets() {
        if (this.bordered) {
            const outOuterPlanets = [];
            this.planets.forEach(planet => {
                if (!planet.isWithinBounds(this.height, this.width)) {
                    outOuterPlanets.push(planet);
                }
            });
            outOuterPlanets.forEach(planet => {
                this.removePlanetAnnotationById(planet.id);
            });
            outOuterPlanets.forEach(planet => {
                this.removePlanetById(planet.id);
            });
        }
    }

    /**
     * Removes all annotations for a given planet id
     * @param {int} id
     */
    removePlanetAnnotationById(id) {
        const planet = this.planets.find(item => item.id == id);
        planet.removeLinesFromPlanet(this.annotationElm);

        this.planets.forEach(otherPlanet => {
            if (planet.id != otherPlanet.id) {
                planet.removeLinesToPlanet(otherPlanet, this.annotationElm);
            }
        });
    }

    removePlanetById(id) {
        const index = this.planets.map(x => x.id).indexOf(id);
        const planet = this.planets[index];
        this.element.removeChild(planet.div);
        this.planets.splice(index, 1);
    }

    updatePlanetWindowPositions(detail) {
        if (!detail) return;
        const { oldWindowPosition, newWindowPosition } = detail;
        this.planets.forEach(planet => {
            planet.updateWindowPosition(oldWindowPosition, newWindowPosition);
        });
        this.updatePlanetDomPositions();
    }

    // Instance controls
    pauseSim() {
        this.paused = true;
    }
    startSim() {
        this.paused = false;

        window.requestAnimationFrame(() => {
            this.step();
        });
    }

    reset() {
        this.planets.forEach(planet => {
            this.element.removeChild(planet.div);
        });
        this.planets = [];
        this._initAnnotations();
        this.paused = false;
    }

    /**
     * Recalculates the dimensions. Should be used if element is resized.
     */
    resize() {
        this.dimensions = {
            height: this.element.clientHeight,
            width: this.element.clientWidth,
        };
        this.annotationElm.setAttributeNS(null, 'width', this.width);
        this.annotationElm.setAttributeNS(null, 'height', this.height);
        this.annotationElm.setAttributeNS(null, 'viewBox', `0 0 ${this.width} ${this.height}`);
    }

    toggleBorder() {
        this.bordered = !this.bordered;
        this.bordered
            ? this.element.classList.add('bordered')
            : this.element.classList.remove('bordered');
        if (this.bordered) this.removeOuterPlanets();
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

    changeMinimumDisplacement(e) {
        const val = e.target.value;
        this.MIN_DISPLACEMENT = val ** 2;
    }

    toggleVerticalGravity() {
        this.verticalGravity = !this.verticalGravity;
    }
}
