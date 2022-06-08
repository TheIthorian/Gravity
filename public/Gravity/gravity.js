import Particle from './particle.js';
import { Vector } from './vector.js';
import { ColorHandler } from './util.js';
import interactions from './interactions.js';

export default class Gravity {
    height;
    width;
    element; // Div to attach content to
    annotationElm; // Svg element to attach annotations to
    particles;

    colorHandler;

    // config
    //   simulation
    bordered = false;
    gravity = true;
    verticalGravityVector = new Vector(0, -1);
    interactionCalculator = interactions.gravitationalEuler;

    //   annotations
    drawAnnotations = true;
    drawLinesBetweenParticles = false;
    lineWidthBetweenParticles = 2;
    lineBetweenParticlesFade = 0;

    //   particles
    randomDirection = false; // Rename to randomVelocity
    particleColors = [];
    MIN_DISPLACEMENT = 50 ** 2;
    particleRenderer;

    constructor(config, motionDetector) {
        this.config = config || {};

        if (motionDetector) {
            this.motionDetector = motionDetector;
            this.motionDetector.on('windowMotion', e => {
                this.updateParticleWindowPositions(e.detail);
            });
            this.motionDetector.on('deviceorientation', e => {
                this.updateGravityDirection(e.beta, e.gamma);
            });
        }

        this.particles = [];
        this.colorHandler = new ColorHandler(this.particleColors);
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
            enableRandomParticleDirection: this.randomDirection,
            disableGravity: !this.gravity,
            interactionCalculator: this.interactionCalculator,
            enableDrawAnnotations: this.drawAnnotations,
            enableDrawLinesBetweenParticles: this.drawLinesBetweenParticles,
            lineWidthBetweenParticles: this.lineWidthBetweenParticles,
            lineBetweenParticlesFade: this.lineBetweenParticlesFade,
            particleColors: this.particleColors,
            particleRenderer: this.particleRenderer,
        };
    }
    set config(config) {
        config = config ?? {};

        const {
            enableBorder,
            enableRandomParticleDirection,
            disableGravity,
            interactionCalculator,
            enableDrawAnnotations,
            enableDrawLinesBetweenParticles,
            lineWidthBetweenParticles, // Not implemented
            lineBetweenParticlesFade, // Not implemented
            particleColors,
            minDisplacement,
            particleRenderer,
        } = config;

        this.bordered = enableBorder ?? this.bordered;

        this.randomDirection = enableRandomParticleDirection ?? this.randomDirection;

        this.gravity = !(disableGravity ?? !this.gravity);
        this.interactionCalculator = interactionCalculator ?? this.interactionCalculator;
        this.drawAnnotations = enableDrawAnnotations ?? this.drawAnnotations;

        this.drawLinesBetweenParticles =
            enableDrawLinesBetweenParticles ?? this.drawLinesBetweenParticles;

        this.lineWidthBetweenParticles =
            lineWidthBetweenParticles ?? this.lineWidthBetweenParticles;

        this.lineBetweenParticlesFade = lineBetweenParticlesFade ?? this.lineBetweenParticlesFade;

        this.particleColors = particleColors ?? this.particleColors;
        this.minDisplacement = minDisplacement ?? this.minDisplacement;
        this.particleRenderer = particleRenderer ?? this.particleRenderer;
    }

    /**
     * Adds a particle to the DOM.
     * @param {float} x X position
     * @param {float} y Y position
     */
    addParticle(x, y) {
        const particle = new Particle(new Vector(x, -y), {
            color: this.colorHandler.getRandomColor(),
            randomDirection: this.randomDirection,
        });
        this.particles.push(particle);
        this.addParticleToDom(particle);
        particle.addAnnotation(
            this.particles,
            this.annotationElm,
            this.drawLinesBetweenParticles && this.drawAnnotations
        );

        if (this.particles.length == 1) {
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
            this.addParticle(event.clientX, event.clientY);
        });
    }

    /**
     * @param {Particle} particle
     */
    addParticleToDom(particle) {
        const div = document.createElement('div');
        const child = document.createElement('div');
        child.innerHTML = this.particleRenderer ? this.particleRenderer(particle) : '';
        div.appendChild(child);
        div.classList.add('particle');
        div.style.position = 'absolute';
        div.style.left = particle.position.x + 'px';
        div.style.top = -particle.position.y + 'px';
        div.style.width = particle.radius * 2 + 'px';
        div.style.height = particle.radius * 2 + 'px';
        div.style.backgroundColor = particle.color;
        particle.div = div;
        this.element.appendChild(div);
    }

    /**
     * Clears all annotations and adds the svg parent to the DOM.
     */
    _initAnnotations() {
        this.clearAnnotations();
        const annotationElm = this.element.getElementsByTagName('svg')[0];
        if (annotationElm) {
            annotationElm.setAttributeNS(null, 'id', 'annotation');
            annotationElm.setAttributeNS(null, 'width', this.width);
            annotationElm.setAttributeNS(null, 'height', this.height);
            annotationElm.setAttributeNS(null, 'viewBox', `0 0 ${this.width} ${this.height}`);
            annotationElm.innerHTML = '';
            this.annotationElm = annotationElm;
        }
    }

    /**
     * Destorys all annotation DOM elements.
     */
    clearAnnotations() {
        if (this.annotationElm) this.annotationElm.innerHTML = '';
    }

    /**
     * A single iteration through the simulation.
     * Calculates acceleration and moves the particles a single step.
     */
    step() {
        if (this.paused) return;
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];

            // Replace this with calculation callback?
            this.interactionCalculator(particle, this);

            particle.step({
                bordered: this.bordered,
                height: this.height,
                width: this.width,
                dampingFactor: this.dampingFactor ?? 1.0,
                delta: this.delta ?? 0,
            });

            this.reRenderParticle(particle);
        }

        this.updateParticleDomPositions();
        this.updateLinesBetweenParticles();

        this.animation = window.requestAnimationFrame(() => {
            this.step();
        });
    }

    reRenderParticle(particle) {
        if (this.particleRenderer) {
            particle.div.children[0].innerHTML = this.particleRenderer(particle);
        }
    }

    /**
     * Moves the particle's elements in the dom to match stored position
     */
    updateParticleDomPositions() {
        // Move implementation to Particle.js?
        this.particles.forEach(particle => {
            particle.div.style.left = particle.position.x + 'px';
            particle.div.style.top = -particle.position.y + 'px';
        });
    }

    /**
     * Moves annotations to match stored position of particles
     */
    updateLinesBetweenParticles() {
        if (!this.drawAnnotations || !this.drawLinesBetweenParticles) {
            return;
        }

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];

            for (let j = 0; j < this.particles.length; j++) {
                if (j >= i) continue;
                const otherParticle = this.particles[j];
                particle.updateLineToParticle(otherParticle);
            }
        }
    }

    /**
     * Destorys any particles outside the border
     */
    removeOuterParticles() {
        if (this.bordered) {
            const outOuterParticles = [];
            this.particles.forEach(particle => {
                if (!particle.isWithinBounds(this.height, this.width)) {
                    outOuterParticles.push(particle);
                }
            });
            outOuterParticles.forEach(particle => {
                this.removeParticleAnnotationById(particle.id);
            });
            outOuterParticles.forEach(particle => {
                this.removeParticleById(particle.id);
            });
        }
    }

    /**
     * Removes all annotations for a given particle id
     * @param {int} id
     */
    removeParticleAnnotationById(id) {
        const particle = this.particles.find(item => item.id == id);
        particle.removeLinesFromParticle(this.annotationElm);

        this.particles.forEach(otherParticle => {
            if (particle.id != otherParticle.id) {
                particle.removeLinesToParticle(otherParticle, this.annotationElm);
            }
        });
    }

    removeParticleById(id) {
        const index = this.particles.map(x => x.id).indexOf(id);
        const particle = this.particles[index];
        this.element.removeChild(particle.div);
        this.particles.splice(index, 1);
    }

    updateParticleWindowPositions(detail) {
        if (!detail) return;
        const { oldWindowPosition, newWindowPosition } = detail;
        this.particles.forEach(particle => {
            particle.updateWindowPosition(oldWindowPosition, newWindowPosition);
        });
        this.updateParticleDomPositions();
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
        if (this.animation) window.cancelAnimationFrame(this.animation);
        this.particles.forEach(particle => {
            this.element.removeChild(particle.div);
        });
        this.particles = [];
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
        this.annotationElm?.setAttributeNS(null, 'width', this.width);
        this.annotationElm?.setAttributeNS(null, 'height', this.height);
        this.annotationElm?.setAttributeNS(null, 'viewBox', `0 0 ${this.width} ${this.height}`);
    }

    toggleBorder() {
        this.bordered = !this.bordered;
        this.bordered
            ? this.element.classList.add('bordered')
            : this.element.classList.remove('bordered');
        if (this.bordered) this.removeOuterParticles();
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
        if (this.annotationElm) this.annotationElm.style.display = display;
    }

    toggleLinesBetweenParticles() {
        this.drawLinesBetweenParticles = !this.drawLinesBetweenParticles;
        const display = this.drawLinesBetweenParticles ? '' : 'none';
        this.particles.forEach(particle => {
            for (const line of Object.values(particle.lines)) {
                line.style.display = display;
            }
        });
    }

    changeMinimumDisplacement(e) {
        const val = e.target.value;
        this.MIN_DISPLACEMENT = val ** 2;
    }
}
