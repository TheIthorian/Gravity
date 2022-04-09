import { BORDER_WIDTH, G, MAX_STARTING_VELOCITY, STEP_TIME } from "./constants.js";
import { Velocity, Force } from "./vector.js";
import {  
    addSvgLineFromVectors,
    updateSvgLineFromVectors
} from "./svg.js";

const DEFAULT_PLANET_RADIUS = 5;
const DEFAULT_PLANET_COLOR = '#ffffff';

var id = 1;
function nextId() {
    return id++;
}

export default class Planet {
    id;
    div;
    
    // Sim
    position;
    velocity;
    resultantForce = new Force(0, 0);

    // Annotations
    lines = {};

    // Config
    color = DEFAULT_PLANET_COLOR;
    radius = DEFAULT_PLANET_RADIUS;
    randomDirection = false;

    constructor(position, config, startingVelocity = new Velocity(0, 0)) {
        this.config = config;
        this.id = nextId();
        this.position = position;
        this.velocity = this.randomDirection ? this.getRandomVelocity() : startingVelocity;
    }

    get config() {
        return {
            color: this.color,
            randomDirection: this.randomDirection
        }
    }
    set config(config) {
        const {
            color,
            randomDirection,
            radius
        } = config;

        this.color = color ?? this.color;
        this.randomDirection = randomDirection ?? this.randomDirection;
        this.radius = radius ?? this.radius;
    }

    get mass() {
        return this.radius ** 3;
    }

    get div() {
        return this.div;
    }

    set div(divElement) {
        this.div = divElement;
        this.div.id = this.id;
    }

    calculateForce(planets, gravity, {height, width}, minDisplacement) {
        let resultantForce = new Force(0, 0);

        if (!gravity) { 
            this.resultantForce = resultantForce;
            return;
        }

        for (let i = 0; i < planets.length; i++) {
            const otherPlanet = planets[i];
            const isOtherInBounds = otherPlanet.isWithinBounds(height, width);
            const isInBounds = this.isWithinBounds(height, width);

            if (otherPlanet.id != this.id && isOtherInBounds && isInBounds) {
                const displacement = this.findDisplacement(otherPlanet);
                const distance2 = Math.max(displacement.mod2(), minDisplacement);
                const unitVector = displacement.findUnitVector();

                const force = unitVector.multiply((G * otherPlanet.mass) / distance2);
                resultantForce = resultantForce.add(force);
            }
        }

        this.resultantForce = resultantForce;
    }

    step({bordered, height, width}){
        const dv = this.resultantForce.multiply(STEP_TIME);
        this.velocity = this.velocity.add(dv);

        if (bordered) this.bounce(height, width);

        const dp = this.velocity.multiply(STEP_TIME);
        this.position = this.position.add(dp);

        const d = {};
        d.left = this.div.style.left, 
        d.top = this.div.style.top;
    }

    findDisplacement(otherPlanet) {
        const displacement = this.position.findDisplacement(otherPlanet.position);
        return displacement;
    }

    bounce(height, width) {
        const Delta = 2;
        const dampingFactor = 1.0;
        if (this.position.x + this.radius > width - BORDER_WIDTH) {
            this.velocity.x *= -dampingFactor;
            this.position.x -= Delta;
        }
        if (this.position.x + this.radius < 0 + BORDER_WIDTH) {
            this.velocity.x *= -dampingFactor;
            this.position.x += Delta;
        }
        if (this.position.y - this.radius * 2 < -height + BORDER_WIDTH - this.radius) {
            this.velocity.y *= -dampingFactor;
            this.position.y += Delta;
        }
        if (this.position.y > 0 - BORDER_WIDTH + this.radius) {
            this.velocity.y *= -dampingFactor;
            this.position.y -= Delta;
        }
    }

    isWithinBounds(height, width) {
        return this.position.x < width - BORDER_WIDTH 
            && this.position.x > 0 + BORDER_WIDTH 
            && this.position.y > -height + BORDER_WIDTH 
            && this.position.y < 0 - BORDER_WIDTH;
    }

    getRandomVelocity() {
        return new Velocity(
            (Math.random() - 0.5) * MAX_STARTING_VELOCITY,
            (Math.random() - 0.5) * MAX_STARTING_VELOCITY
        )
    }

    addAnnotation(planetList, svgElement, drawLinesBetweenPlanets) {
        for (let i = 0; i < planetList.length; i++) {
            const planet = planetList[i];
            if (planet.id != this.id) {
                const line = this.addLineToOtherPlanet(planet, svgElement);
                line.style.display = drawLinesBetweenPlanets ? null : 'none';
                this.lines[planet.id] = line;
            }
        }
    }

    addLineToOtherPlanet(planet, svgElement) {
        return addSvgLineFromVectors(this.position, planet.position, svgElement);
    }

    removeLinesFromPlanet(svgElement) {
        Object.values(this.lines).forEach(line => {
            svgElement.removeChild(line);
        });
        this.lines = {};
    }

    removeLinesToPlanet(planet, svgElement) {
        const line = planet.lines[this.id];
        if (line) svgElement.removeChild(line);
        delete planet.lines[this.id];
    }    

    updateLineToPlanet(planet) {
        const line = this.lines[planet.id];
        if (line) updateSvgLineFromVectors(this.position, planet.position, line);
    }
}