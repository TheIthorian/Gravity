import { BORDER_WIDTH, G, MAX_STARTING_VELOCITY, STEP_TIME } from './constants.js';
import { Vector } from './vector.js';
import { addSvgLineFromVectors, updateSvgLineFromVectors } from './svg.js';

const DEFAULT_PARTICLE_RADIUS = 5;
const DEFAULT_PARTICLE_COLOR = '#ffffff';

const idGen = (function* () {
    let id = 1;
    while (true) {
        yield id++;
    }
})();

function nextId() {
    return idGen.next().value;
}

export default class Particle {
    id;
    div;

    // Sim
    position;
    velocity;
    resultantForce = new Vector(0, 0);

    // Annotations
    lines = {};

    // Config
    color = DEFAULT_PARTICLE_COLOR;
    radius = DEFAULT_PARTICLE_RADIUS;
    randomDirection = false;

    constructor(position, config = {}, startingVelocity = new Vector(0, 0)) {
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

    /**
     * Updates the instance's force vector from interactions with other particles.
     * @param {Particle[]} particles All other particles to consider in the calculation
     * @param {Boolean} gravity Whether gravity is enabled
     * @param {{int, int}} dimensions The effective border
     * @param {int} minDisplacement Minimum distance between particles at which the calculation will be considered
     */
    calculateForce(particles, gravity, { height, width }, minDisplacement) {
        let resultantForce = new Vector(0, 0);

        if (!gravity) {
            this.resultantForce = resultantForce;
            return;
        }

        for (let i = 0; i < particles.length; i++) {
            const otherParticle = particles[i];
            const isOtherInBounds = otherParticle.isWithinBounds(height, width);
            const isInBounds = this.isWithinBounds(height, width);

            if (otherParticle.id != this.id && isOtherInBounds && isInBounds) {
                const displacement = this.findDisplacement(otherParticle);
                const distance2 = Math.max(displacement.mod2(), minDisplacement);
                const unitVector = displacement.findUnitVector();

                const force = unitVector.multiply((G * otherParticle.mass) / distance2);
                resultantForce = resultantForce.add(force);
            }
        }

        this.resultantForce = resultantForce;
    }

    /**
     * Updates the instance's force vector from a given effective vector.
     * @param {boolean} gravity
     * @param {{int, int}} param1
     * @param {Vector} verticalGravityVector
     */
    calculateVerticalForce(gravity, { height, width }, verticalGravityVector) {
        if (!gravity) {
            this.resultantForce = new Vector(0, -0).multiply(1);
            return;
        }

        if (!this.isWithinBounds(height, width)) {
            this.resultantForce = verticalGravityVector.multiply(0.02);
            return;
        }

        this.resultantForce = verticalGravityVector.multiply(0.5);
    }

    /**
     * Updates the particle's position and velocity from its resultant force.
     * @param {{boolean, int, int, double, double}} options
     */
    step({ bordered, height, width, dampingFactor, delta }) {
        const dv = this.resultantForce.multiply(STEP_TIME);
        this.velocity = this.velocity.add(dv);

        // if (verticalGravity && this.position.y < -height + 10 && verticalGravity.y < 0) this.velocity.y = 0;
        if (bordered) this.bounce(height, width, dampingFactor, delta);

        const dp = this.velocity.multiply(STEP_TIME);
        this.position = this.position.add(dp);
    }

    /**
     *
     * @param {Particle} otherParticle
     * @returns {Vector} The displacement from another particle
     */
    findDisplacement(otherParticle) {
        const displacement = this.position.findDisplacement(otherParticle.position);
        return displacement;
    }

    /**
     * Reflects the current velocity.
     * @param {int} height Height of bounding box
     * @param {int} width Width of bounding box
     * @param {float} dampingFactor Factor in which velocity will be multiplied after bouncing
     * @param {float} delta Offset from edge of the bounding box which the bounce will occur
     */
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
        return new Vector(
            (Math.random() - 0.5) * MAX_STARTING_VELOCITY,
            (Math.random() - 0.5) * MAX_STARTING_VELOCITY
        );
    }

    /**
     * @param {Particle[]} particleList All other particles
     * @param {HTMLElement} svgElement The svg element to which annotations will be drawn to
     * @param {boolean} drawLinesBetweenParticles
     */
    addAnnotation(particleList, svgElement, drawLinesBetweenParticles) {
        for (let i = 0; i < particleList.length; i++) {
            const particle = particleList[i];
            if (particle.id != this.id) {
                const line = this.addLineToOtherParticle(particle, svgElement);
                line.style.display = drawLinesBetweenParticles ? null : 'none';
                this.lines[particle.id] = line;
            }
        }
    }

    /**
     * @param {Particle} particle
     * @param {HTMLElement} svgElement The svg element to which annotations will be drawn to
     * @returns {HTMLElement} Line which was added to the svgElement
     */
    addLineToOtherParticle(particle, svgElement) {
        return addSvgLineFromVectors(this.position, particle.position, svgElement);
    }

    /**
     * Removes all lines emmitting from this particle
     * @param {HTMLElement} svgElement The svg element of which to remove the lines from
     */
    removeLinesFromParticle(svgElement) {
        Object.values(this.lines).forEach(line => {
            svgElement?.removeChild(line);
        });
        this.lines = {};
    }

    /**
     * Removes all lines emmitting from this particle
     * @param {Particle} particle The particle from which the lines are coming from
     * @param {HTMLElement} svgElement The svg element of which to remove the lines from
     */
    removeLinesToParticle(particle, svgElement) {
        const line = particle.lines[this.id];
        if (line) svgElement?.removeChild(line);
        delete particle.lines[this.id];
    }

    /**
     * Updates the line positions to match the particles' current position
     * @param {Particle} particle
     */
    updateLineToParticle(particle) {
        const line = this.lines[particle.id];
        if (line) updateSvgLineFromVectors(this.position, particle.position, line);
    }

    /**
     * Updates the particle's relative position to the window given a change in window position,
     * such that the absolute screen position remains the same
     * @param {{double, double}} oldWindowPosition
     * @param {{double, double}} newWindowPosition
     */
    updateWindowPosition(oldWindowPosition, newWindowPosition) {
        const dx = newWindowPosition.x - oldWindowPosition.x;
        const dy = newWindowPosition.y - oldWindowPosition.y;

        this.position.x -= dx / 2;
        this.position.y -= -dy / 2;
    }
}
