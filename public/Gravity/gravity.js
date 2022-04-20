import Planet from './planet.js';
import { Coordinate, Vector } from './vector.js';
import { INTERVAL } from './constants.js';
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
    planetRenderer = () => "";
    

    constructor(config, motionDetector) {
        this.config = config;
        this.motionDetector = motionDetector;
        this.motionDetector.on('windowMotion', (e) => {this.updatePlanetWindowPositions(e.detail)});
        this.motionDetector.on('deviceorientation', (e) => {this.updateGravityDirection(e.beta, e.gamma)});
        this.planets = [];
        this.colorHandler = new ColorHandler(this.planetColors);
    }

    updateGravityDirection(beta, gamma) {
        const fy = Math.sin(beta * Math.PI / 180);
        const fx = Math.sin(gamma * Math.PI / 180) * (1 - fy);
        console.log(fx, fy);
        this.verticalGravityVector = new Vector(fx, -fy);
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
            enableVerticalGravity: this.verticalGravity,
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
            enableVerticalGravity,
            enableDrawAnnotations,
            enableDrawLinesBetweenPlanets,
            lineWidthBetweenPlanets, // Not implemented
            lineBetweenPlanetsFade,  // Not implemented
            planetColors,            // Not implemented
            minDisplacement
        } = config;
        
        this.bordered = enableBorder ?? this.bordered;
        this.randomDirection = enableRandomPlanetDirection ?? this.randomDirection;
        this.gravity = !disableGravity ?? this.gravity;
        this.verticalGravity = enableVerticalGravity ?? this.verticalGravity;
        this.drawAnnotations = enableDrawAnnotations ?? this.drawAnnotations;
        this.drawLinesBetweenPlanets = enableDrawLinesBetweenPlanets ?? this.drawLinesBetweenPlanets;
        this.lineWidthBetweenPlanets = lineWidthBetweenPlanets ?? this.lineWidthBetweenPlanets;
        this.lineBetweenPlanetsFade = lineBetweenPlanetsFade ?? this.lineBetweenPlanetsFade;
        this.planetColors = planetColors ?? this.planetColors;
        this.minDisplacement = minDisplacement ?? this.minDisplacement;
    }

    addPlanet(event) {
        const planet = new Planet(
            new Coordinate(event.clientX, -event.clientY), 
            {
                color: this.colorHandler.getRandomColor(),  
                randomDirection: this.randomDirection
            }
        );
        this.planets.push(planet);
        this.addPlanetToDom(planet);
        planet.addAnnotation(this.planets, this.annotationElm, this.drawLinesBetweenPlanets && this.drawAnnotations);

        if (this.planets.length == 1) {
            this.startSim();
        }
    }

    setElement(element) {
        this.element = element;
        this.dimensions = { height: element.clientHeight, width: element.clientWidth };
        this.bordered 
            ? this.element.classList.add('bordered') 
            : this.element.classList.remove('bordered');
        this._initAnnotations(element);
        this.element.addEventListener('click', (event) => {this.addPlanet(event);});
    }

    addPlanetToDom(planet) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(this.planetRenderer()));
        div.classList.add('planet');
        div.style.position = 'absolute';
        div.style.left = planet.position.x + 'px';
        div.style.top = -planet.position.y + 'px';
        div.style.width = (planet.radius * 2) + 'px';
        div.style.height = (planet.radius * 2) + 'px';
        div.style.backgroundColor = planet.color;
        planet.div = div;
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
            if (this.verticalGravity) {
                planet.calculateVerticalForce(this.gravity, {...this.dimensions}, this.verticalGravityVector);
            } else {
                planet.calculateForce(
                    this.planets, 
                    this.gravity,
                    {...this.dimensions}, 
                    this.MIN_DISPLACEMENT
                );
            }
            
            planet.step({
                bordered: this.bordered, 
                height: this.height, 
                width: this.width,
                dampingFactor: this.verticalGravity ? 0.8 : 1.0,
                delta : this.verticalGravity ? 0 : null
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

    removeOuterPlanets() {
        if (this.bordered) {
            const outOuterPlanets = [];
            this.planets.forEach((planet) => {
                if (!planet.isWithinBounds(this.height, this.width)) {
                    outOuterPlanets.push(planet);
                }
            });
            outOuterPlanets.forEach((planet, index) => {
                const idList = this.planets.map(x => x.id);
                index = idList.indexOf(planet.id);
                this.removePlanetAnnotationByIndex(index);
            });
            outOuterPlanets.forEach((planet, index) => {
                const idList = this.planets.map(x => x.id);
                index = idList.indexOf(planet.id);
                this.removePlanetByIndex(index);
            })
        }
    }

    removePlanetAnnotationByIndex(index) {
        const planet = this.planets[index];
        planet.removeLinesFromPlanet(this.annotationElm);

        this.planets.forEach(otherPlanet => {
            if (planet.id != otherPlanet.id) {
                planet.removeLinesToPlanet(otherPlanet, this.annotationElm);
            }
        });
    }

    removePlanetByIndex(index) {
        const planet = this.planets[index];
        this.element.removeChild(planet.div);
        this.planets.splice(index, 1);
    }

    updatePlanetWindowPositions(detail) {
        if (!detail) return;
        const {oldWindowPosition, newWindowPosition} = detail;
        this.planets.forEach(planet => {
            planet.updateWindowPosition(oldWindowPosition, newWindowPosition);
        });
        this.updatePlanetDomPositions();
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
        this.bordered 
            ? this.element.classList.add('bordered') 
            : this.element.classList.remove('bordered');
        if(this.bordered) this.removeOuterPlanets();
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
        console.log('MIN_DISPLACEMENT: ', val);
        this.MIN_DISPLACEMENT = val ** 2;
    }

    toggleVerticalGravity() {
        this.verticalGravity = !this.verticalGravity;
    }
}