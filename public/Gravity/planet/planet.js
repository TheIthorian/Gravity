import { BORDER_WIDTH, G, MAX_STARTING_VELOCITY, STEP_TIME } from '../constants.js';
import { Velocity, Force } from '../vector.js';
import { addSvgLineFromVectors, updateSvgLineFromVectors } from '../svg.js';

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

    constructor(position, config = {}, startingVelocity = new Velocity(0, 0)) {
        this.config = config;
        this.id = nextId();
        this.position = position;
        this.velocity = this.randomDirection ? this.getRandomVelocity() : startingVelocity;
    }

    get config() {
        return {
            color: this.color,
            randomDirection: this.randomDirection,
            radius: this.radius,
        };
    }
    set config(config) {
        const { color, randomDirection, radius } = config;

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

    calculateForce(planets, gravity, { height, width }, minDisplacement) {
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

    calculateVerticalForce(gravity, { height, width }, verticalGravityVector) {
        if (!gravity) {
            this.resultantForce = new Force(0, -0).multiply(1);
            return;
        }

        if (!this.isWithinBounds(height, width)) {
            this.resultantForce = verticalGravityVector.multiply(0.02);
            return;
        }

        // if (this.position.y < - height + 10 && verticalGravityVector.y < 0) {
        //     this.resultantForce = new Force(0, 0);
        //     return;
        // }

        this.resultantForce = verticalGravityVector.multiply(0.5);
    }

    step({ bordered, height, width, dampingFactor, delta }) {
        const dv = this.resultantForce.multiply(STEP_TIME);
        this.velocity = this.velocity.add(dv);

        // if (verticalGravity && this.position.y < -height + 10 && verticalGravity.y < 0) this.velocity.y = 0;
        if (bordered) this.bounce(height, width, dampingFactor, delta);

        const dp = this.velocity.multiply(STEP_TIME);
        this.position = this.position.add(dp);

        const d = {};
        (d.left = this.div.style.left), (d.top = this.div.style.top);
    }

    findDisplacement(otherPlanet) {
        const displacement = this.position.findDisplacement(otherPlanet.position);
        return displacement;
    }

    bounce(height, width, dampingFactor = 1.0, delta = 2) {
        if (this.position.x + this.radius > width - BORDER_WIDTH) {
            this.velocity.x = -dampingFactor * Math.abs(this.velocity.x);
            this.position.x -= delta;
        }
        if (this.position.x + this.radius < 0 + BORDER_WIDTH) {
            this.velocity.x = dampingFactor * Math.abs(this.velocity.x);
            this.position.x += delta;
        }
        if (this.position.y - this.radius * 2 < -height + BORDER_WIDTH - this.radius) {
            this.velocity.y = dampingFactor * Math.abs(this.velocity.y);
            this.position.y += delta;
        }
        if (this.position.y > 0 - BORDER_WIDTH + this.radius) {
            this.velocity.y = -dampingFactor * Math.abs(this.velocity.y);
            this.position.y -= delta;
        }
    }

    isWithinBounds(height, width) {
        return (
            this.position.x < width - BORDER_WIDTH &&
            this.position.x > 0 + BORDER_WIDTH &&
            this.position.y > -height + BORDER_WIDTH &&
            this.position.y < 0 - BORDER_WIDTH
        );
    }

    getRandomVelocity() {
        return new Velocity(
            (Math.random() - 0.5) * MAX_STARTING_VELOCITY,
            (Math.random() - 0.5) * MAX_STARTING_VELOCITY
        );
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

    updateWindowPosition(oldWindowPosition, newWindowPosition) {
        const dx = newWindowPosition.x - oldWindowPosition.x;
        const dy = newWindowPosition.y - oldWindowPosition.y;

        this.position.x -= dx;
        this.position.y -= -dy;
    }
}
