import { BORDER_WIDTH, G, MAX_STARTING_VELOCITY, MIN_DISPLACEMENT, STEP_TIME } from "./constants.js";
import { Velocity, Force } from "./vector.js";
import {  
    addSvgLineFromVectors,
    updateSvgLineFromVectors
} from "./svg.js";

var id = 1;
function nextId() {
    id++;
    return id;
}

export default class Planet {
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
        this.resultantForce = new Force(0, 0);
        this.lines = {};
    }

    async calculateForce(planets, gravity, {height, width}) {
        let resultantForce = new Force(0, 0);

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