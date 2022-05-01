import Gravity from '../gravity.js';
import Planet from '../../planet/planet.js';
// import { ColorHandler } from '../../util.js';

import { Coordinate } from '../../vector.js';

jest.mock('../../planet/planet.js');
jest.mock('../../util.js');

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
                enableRandomPlanetDirection: true,
                disableGravity: true,
                enableVerticalGravity: true,
                enableDrawAnnotations: true,
                enableDrawLinesBetweenPlanets: true,
                lineWidthBetweenPlanets: true,
                lineBetweenPlanetsFade: true,
                planetColors: [],
            };
            const gravity = new Gravity(initialConfig);

            // When
            gravity.config = {};

            // Then
            expect(gravity.config).toStrictEqual(initialConfig);
        });
    });

    describe('addPlanet', () => {
        let gravity;

        beforeEach(() => {
            gravity = new Gravity();
            jest.spyOn(gravity, 'addPlanetToDom').mockImplementation(() => {});
            jest.spyOn(gravity, 'startSim').mockImplementation(() => {});
        });

        it('creates a planet and adds it to the list of planets', () => {
            // Given
            const event = { clientX: 10, clientY: 20 };
            gravity.colorHandler.getRandomColor = jest.fn(() => '#ffffff');

            // When
            gravity.addPlanet(event);

            // Then
            expect(Planet).toHaveBeenCalledWith(new Coordinate(10, -20), {
                color: '#ffffff',
                randomDirection: false,
            });

            expect(gravity.planets.length).toBe(1);
            expect(gravity.addPlanetToDom).toHaveBeenCalledTimes(1);
            expect(gravity.planets[0].addAnnotation).toHaveBeenCalledTimes(1);
            expect(gravity.startSim).toHaveBeenCalledTimes(1);
        });

        it('does not start the sim if another planet exists', () => {
            // Given / When
            gravity.addPlanet({});
            gravity.addPlanet({});

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
            expect(gravity._initAnnotations).toHaveBeenCalledWith(element);
            expect(element.addEventListener).toHaveBeenCalledTimes(1);
        });
    });

    describe('addPlanetToDom', () => {
        let gravity;

        beforeEach(() => {
            gravity = new Gravity({ bordered: false });
            jest.spyOn(gravity, 'planetRenderer').mockImplementation(() => {});
            jest.spyOn(document, 'createTextNode');
        });

        it('sets the element style and add it to the DOM', () => {
            // Given
            const planet = {
                position: new Coordinate(10, 20),
                color: '#ffffff',
                radius: 10,
            };
            gravity.element = document.createElement('div');

            // When
            gravity.addPlanetToDom(planet);
            const childDiv = gravity.element.children[0];

            // Then
            expect(childDiv.classList.contains('planet')).toBe(true);
            expect(childDiv.style.position).toBe('absolute');
            expect(childDiv.style.left).toBe('10px');
            expect(childDiv.style.top).toBe('-20px');
            expect(childDiv.style.width).toBe('20px');
            expect(childDiv.style.height).toBe('20px');
            expect(childDiv.style.backgroundColor).toBe('rgb(255, 255, 255)');
            expect(childDiv).toEqual(planet.div);
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
            const ns = null;

            // When
            gravity._initAnnotations(element);
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
            gravity.planets = [
                new Planet(new Coordinate(0, 10)),
                new Planet(new Coordinate(10, 20)),
            ];
            gravity.gravity = true;
            gravity.dimensions = { width: 100, height: 200 };
            gravity.updatePlanetDomPositions = jest.fn();
            gravity.updateLinesBetweenPlanets = jest.fn();
        });

        it('calculates vertical force for each planet', () => {
            // Given
            gravity.verticalGravity = true;
            gravity.verticalGravityVector = (0.5, 0.5);

            // When
            gravity.step();
            const planet = gravity.planets[1];

            // Then
            expect(planet.calculateVerticalForce).toHaveBeenCalledTimes(1);
            expect(planet.calculateVerticalForce).toHaveBeenCalledWith(
                gravity.gravity,
                gravity.dimensions,
                gravity.verticalGravityVector
            );

            expect(planet.calculateForce).not.toHaveBeenCalled();

            expect(planet.step).toHaveBeenCalledTimes(1);
            expect(planet.step).toHaveBeenCalledWith({
                bordered: gravity.bordered,
                height: 200,
                width: 100,
                dampingFactor: 0.8,
                delta: 0,
            });

            expect(gravity.updatePlanetDomPositions).toHaveBeenCalledTimes(1);
            expect(gravity.updateLinesBetweenPlanets).toHaveBeenCalledTimes(1);
        });

        it('calculates interaction force for each planet', () => {
            // Given
            gravity.verticalGravity = false;

            // When
            gravity.step();
            const planet = gravity.planets[1];

            // Then
            expect(planet.calculateForce).toHaveBeenCalledTimes(1);
            expect(planet.calculateForce).toHaveBeenCalledWith(
                gravity.planets,
                gravity.gravity,
                gravity.dimensions,
                gravity.MIN_DISPLACEMENT
            );

            expect(planet.calculateVerticalForce).not.toHaveBeenCalled();

            expect(planet.step).toHaveBeenCalledTimes(1);
            expect(planet.step).toHaveBeenCalledWith({
                bordered: gravity.bordered,
                height: 200,
                width: 100,
                dampingFactor: 1.0,
                delta: null,
            });

            expect(gravity.updatePlanetDomPositions).toHaveBeenCalledTimes(1);
            expect(gravity.updateLinesBetweenPlanets).toHaveBeenCalledTimes(1);
        });
    });

    describe('updatePlanetDomPositions', () => {
        let gravity;

        beforeEach(() => {
            gravity = new Gravity();
            gravity.planets = [
                { position: { x: 0, y: 10 }, div: document.createElement('div') },
                { position: { x: 10, y: 20 }, div: document.createElement('div') },
            ];
        });

        it('updates the planet styles in DOM', () => {
            // Given / When
            gravity.updatePlanetDomPositions();
            const planet = gravity.planets[1];

            // Then
            expect(planet.div.style.left).toBe('10px');
            expect(planet.div.style.top).toBe('-20px');
        });
    });

    describe('updateLinesBetweenPlanets', () => {
        let gravity;

        beforeEach(() => {
            gravity = new Gravity();
            gravity.planets = [
                new Planet(new Coordinate(0, 10)),
                new Planet(new Coordinate(10, 20)),
            ];
        });

        it('does not update lines when drawAnnotations is false', () => {
            // Given
            gravity.drawAnnotations = false;
            gravity.drawLinesBetweenPlanets = true;

            // When
            gravity.updateLinesBetweenPlanets();
            const planet = gravity.planets[1];

            // Then
            expect(planet.updateLineToPlanet).not.toHaveBeenCalled();
        });

        it('does not update lines when drawLinesBetweenPlanets is false', () => {
            // Given
            gravity.drawAnnotations = true;
            gravity.drawLinesBetweenPlanets = false;

            // When
            gravity.updateLinesBetweenPlanets();
            const planet = gravity.planets[1];

            // Then
            expect(planet.updateLineToPlanet).not.toHaveBeenCalled();
        });

        it('updates the line from the second planet to the first', () => {
            // Given
            gravity.drawAnnotations = true;
            gravity.drawLinesBetweenPlanets = true;

            // When
            gravity.updateLinesBetweenPlanets();

            // Then
            expect(gravity.planets[1].updateLineToPlanet).toHaveBeenCalledTimes(1);
            expect(gravity.planets[1].updateLineToPlanet).toHaveBeenCalledWith(gravity.planets[0]);
        });
    });
});
