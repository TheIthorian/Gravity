import Gravity from '../gravity.js';
import Particle from '../particle.js';

import { Vector } from '../vector.js';

jest.mock('../particle.js');
jest.mock('../util.js');

describe('Gravity', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {});

    describe('dimensions', () => {
        it('defaults width and height to 0', () => {
            // Given
            const gravity = new Gravity();

            // When
            gravity.dimensions = null;

            // Then
            expect(gravity.dimensions).toStrictEqual({
                height: 0,
                width: 0,
            });
        });

        it('sets the width and height', () => {
            // Given
            const gravity = new Gravity();

            // When
            gravity.dimensions = {
                height: 100,
                width: 200,
            };

            // Then
            expect(gravity.dimensions).toStrictEqual({
                height: 100,
                width: 200,
            });
        });
    });

    describe('config', () => {
        it('does not change config when no config is provided', () => {
            // Given
            const initialConfig = {
                enableBorder: true,
                enableRandomParticleDirection: true,
                disableGravity: true,
                interactionCalculator: jest.fn(),
                enableDrawAnnotations: true,
                enableDrawLinesBetweenParticles: true,
                lineWidthBetweenParticles: true,
                lineBetweenParticlesFade: true,
                particleColors: [],
                particleRenderer: undefined,
            };
            const gravity = new Gravity(initialConfig);

            // When
            gravity.config = {};

            // Then
            expect(gravity.config).toStrictEqual(initialConfig);
        });
    });

    describe('addParticle', () => {
        let gravity;

        beforeEach(() => {
            gravity = new Gravity();
            jest.spyOn(gravity, 'addParticleToDom').mockImplementation(() => {});
            jest.spyOn(gravity, 'startSim').mockImplementation(() => {});
        });

        it('creates a particle and adds it to the list of particles', () => {
            // Given
            gravity.colorHandler.getRandomColor = jest.fn(() => '#ffffff');

            // When
            gravity.addParticle(10, 20);

            // Then
            expect(Particle).toHaveBeenCalledWith(new Vector(10, -20), {
                color: '#ffffff',
                randomDirection: false,
            });

            expect(gravity.particles.length).toBe(1);
            expect(gravity.addParticleToDom).toHaveBeenCalledTimes(1);
            expect(gravity.particles[0].addAnnotation).toHaveBeenCalledTimes(1);
            expect(gravity.startSim).toHaveBeenCalledTimes(1);
        });

        it('does not start the sim if another particle exists', () => {
            // Given / When
            gravity.addParticle({});
            gravity.addParticle({});

            // Then
            expect(gravity.startSim).toHaveBeenCalledTimes(1);
        });
    });

    describe('setElement', () => {
        let gravity;

        beforeEach(() => {
            gravity = new Gravity({ bordered: false });
            jest.spyOn(gravity, '_initAnnotations').mockImplementation(() => {});
        });

        it('sets the element', () => {
            // Given
            let element = document.createElement('div');
            element.style.height = 100;
            element.style.width = 200;
            jest.spyOn(element, 'addEventListener');

            // When
            gravity.setElement(element);

            // Then
            expect(gravity.element).toBe(element);
            expect(gravity.dimensions).toStrictEqual({
                height: element.clientHeight,
                width: element.clientWidth,
            });
            expect(gravity.element.classList.contains('bordered')).toBe(false);
            expect(gravity._initAnnotations).toHaveBeenCalledTimes(1);
            expect(gravity._initAnnotations).toHaveBeenCalled();
            expect(element.addEventListener).toHaveBeenCalledTimes(1);
        });
    });

    describe('addParticleToDom', () => {
        let gravity;

        beforeEach(() => {
            gravity = new Gravity({ bordered: false, particleRenderer: jest.fn() });
            jest.spyOn(gravity, 'particleRenderer').mockImplementation(() => {});
            jest.spyOn(document, 'createTextNode');
        });

        it('sets the element style and add it to the DOM', () => {
            // Given
            const particle = {
                position: new Vector(10, 20),
                color: '#ffffff',
                radius: 10,
            };
            gravity.element = document.createElement('div');

            // When
            gravity.addParticleToDom(particle);
            const childDiv = gravity.element.children[0];

            // Then
            expect(childDiv.classList.contains('particle')).toBe(true);
            expect(childDiv.style.position).toBe('absolute');
            expect(childDiv.style.left).toBe('10px');
            expect(childDiv.style.top).toBe('-20px');
            expect(childDiv.style.width).toBe('20px');
            expect(childDiv.style.height).toBe('20px');
            expect(childDiv.style.backgroundColor).toBe('rgb(255, 255, 255)');
            expect(childDiv).toEqual(particle.div);
        });
    });

    describe('_initAnnotations', () => {
        let gravity;

        beforeEach(() => {
            gravity = new Gravity();
            gravity.element = document.createElement('div');
        });

        it('sets up the svg element for a given parent element', () => {
            // Given
            gravity.width = 100;
            gravity.height = 200;
            const element = document.createElement('div');
            element.innerHTML = '<svg><svg>';
            gravity.element = element;
            const ns = null;

            // When
            gravity._initAnnotations();
            const annotationElm = gravity.annotationElm;

            // Then
            expect(annotationElm.id).toBe('annotation');
            expect(annotationElm.getAttributeNS(ns, 'width')).toBe('100');
            expect(annotationElm.getAttributeNS(ns, 'height')).toBe('200');
            expect(annotationElm.getAttributeNS(ns, 'viewBox')).toBe('0 0 100 200');
            expect(gravity.annotationElm).toBe(annotationElm);
        });
    });

    describe('step', () => {
        let gravity;

        beforeEach(() => {
            gravity = new Gravity();
            gravity.particles = [new Particle(new Vector(0, 10)), new Particle(new Vector(10, 20))];
            gravity.gravity = true;
            gravity.dimensions = { width: 100, height: 200 };
            gravity.reRenderParticle = jest.fn();
            gravity.updateParticleDomPositions = jest.fn();
            gravity.updateLinesBetweenParticles = jest.fn();
            window.requestAnimationFrame = jest.fn();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('does not run any calculations if the simulation is paused', () => {
            // Given
            gravity.paused = true;
            gravity.interactionCalculator = jest.fn();

            // When
            const particle = gravity.particles[1];
            gravity.step();

            // Then
            expect(gravity.interactionCalculator).not.toHaveBeenCalled(); // Once for each particle
            expect(particle.step).not.toHaveBeenCalled();
            expect(window.requestAnimationFrame).not.toHaveBeenCalled();
        });

        it('calculates interaction force for each particle', () => {
            // Given
            gravity.interactionCalculator = jest.fn();

            // When
            gravity.step();
            const particle = gravity.particles[1];

            // Then
            expect(gravity.interactionCalculator).toHaveBeenCalledTimes(2); // Once for each particle
            expect(gravity.interactionCalculator).toHaveBeenCalledWith(particle, gravity);

            expect(particle.step).toHaveBeenCalledTimes(1);
            expect(particle.step).toHaveBeenCalledWith({
                bordered: false,
                height: 200,
                width: 100,
                dampingFactor: 1.0,
                delta: 0,
            });

            expect(gravity.reRenderParticle).toHaveBeenCalledTimes(2);
            expect(gravity.reRenderParticle).toHaveBeenCalledWith(particle);

            expect(gravity.updateParticleDomPositions).toHaveBeenCalledTimes(1);
            expect(gravity.updateLinesBetweenParticles).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateParticleDomPositions', () => {
        let gravity;

        beforeEach(() => {
            gravity = new Gravity();
            gravity.particles = [
                { position: { x: 0, y: 10 }, div: document.createElement('div') },
                { position: { x: 10, y: 20 }, div: document.createElement('div') },
            ];
        });

        it('updates the particle styles in DOM', () => {
            // Given / When
            gravity.updateParticleDomPositions();
            const particle = gravity.particles[1];

            // Then
            expect(particle.div.style.left).toBe('10px');
            expect(particle.div.style.top).toBe('-20px');
        });
    });

    describe('updateLinesBetweenParticles', () => {
        let gravity;

        beforeEach(() => {
            gravity = new Gravity();
            gravity.particles = [new Particle(new Vector(0, 10)), new Particle(new Vector(10, 20))];
        });

        it('does not update lines when drawAnnotations is false', () => {
            // Given
            gravity.drawAnnotations = false;
            gravity.drawLinesBetweenParticles = true;

            // When
            gravity.updateLinesBetweenParticles();
            const particle = gravity.particles[1];

            // Then
            expect(particle.updateLineToParticle).not.toHaveBeenCalled();
        });

        it('does not update lines when drawLinesBetweenParticles is false', () => {
            // Given
            gravity.drawAnnotations = true;
            gravity.drawLinesBetweenParticles = false;

            // When
            gravity.updateLinesBetweenParticles();
            const particle = gravity.particles[1];

            // Then
            expect(particle.updateLineToParticle).not.toHaveBeenCalled();
        });

        it('updates the line from the second particle to the first', () => {
            // Given
            gravity.drawAnnotations = true;
            gravity.drawLinesBetweenParticles = true;

            // When
            gravity.updateLinesBetweenParticles();

            // Then
            expect(gravity.particles[1].updateLineToParticle).toHaveBeenCalledTimes(1);
            expect(gravity.particles[1].updateLineToParticle).toHaveBeenCalledWith(
                gravity.particles[0]
            );
        });
    });
});
