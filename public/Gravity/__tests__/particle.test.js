import Particle from '../particle.js';
import { Vector } from '../vector.js';
import { MAX_STARTING_VELOCITY } from '../constants';
import { addSvgLineFromVectors, updateSvgLineFromVectors } from '../svg.js';

jest.mock('../svg');

describe('Gravity', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('sets id and velocity', () => {
            // Given
            const config = {
                randomDirection: true,
            };
            jest.spyOn(global.Math, 'random').mockReturnValue(0.8);
            const position = new Vector(10, 20);

            // When
            const particle = new Particle(position, config);

            // Then
            expect(particle.id).toBe(1);
            expect(particle.position).toEqual(position);
            expect(particle.velocity.x).toBeCloseTo(0.3 * MAX_STARTING_VELOCITY);
            expect(particle.velocity.y).toBeCloseTo(0.3 * MAX_STARTING_VELOCITY);
            expect(global.Math.random).toHaveBeenCalledTimes(2);
        });
    });

    describe('config', () => {
        let particle;

        beforeEach(() => {
            const position = new Vector(10, 20);
            particle = new Particle(position, {});
        });

        it('sets the config', () => {
            // Given
            const config = {
                randomDirection: true,
                color: '#ffffff',
                radius: 10,
            };

            // When
            particle.config = config;

            // Then
            expect(particle.color).toBe('#ffffff');
            expect(particle.randomDirection).toBe(true);
            expect(particle.radius).toBe(10);
        });

        it('only sets valid config', () => {
            // Given
            const config = {
                randomDirection: true,
                color: '#ffffff',
                radius: 10,
            };

            // When
            particle.config = config;
            particle.config = {};

            // Then
            expect(config.color).toBe('#ffffff');
            expect(config.randomDirection).toBe(true);
            expect(config.radius).toBe(10);
        });

        it('gets the config', () => {
            // Given
            particle.randomDirection = false;
            particle.color = '#aaaaaa';
            particle.radius = 10;

            // When
            const config = particle.config;

            // Then
            expect(config.color).toBe('#aaaaaa');
            expect(config.randomDirection).toBe(false);
            expect(config.radius).toBe(10);
        });
    });

    describe('step', () => {
        let particle;

        beforeEach(() => {
            particle = new Particle(new Vector(0, 0));
            particle.resultantForce = new Vector(5, 5);
            particle.bounce = jest.fn();
        });

        afterEach(() => jest.clearAllMocks());

        it('updates the particles velocity and position', () => {
            // Given / When
            particle.step({ bordered: false });

            // Then
            expect(particle.velocity.x).toBe(5);
            expect(particle.velocity.y).toBe(5);

            expect(particle.bounce).not.toHaveBeenCalled();

            expect(particle.position.x).toBe(5);
            expect(particle.position.y).toBe(5);
        });

        it('calls bounce if bordered is true', () => {
            const [height, width] = [100, 200];
            const [dampingFactor, delta] = [10, 20];

            // Given / When
            particle.step({ bordered: true, height, width, dampingFactor, delta });

            // Then
            expect(particle.velocity.x).toBe(5);
            expect(particle.velocity.y).toBe(5);

            expect(particle.bounce).toHaveBeenCalledWith(height, width, dampingFactor, delta);

            expect(particle.position.x).toBe(5);
            expect(particle.position.y).toBe(5);
        });
    });

    describe('findDisplacement', () => {
        it('finds the displacement vector from this particle to another', () => {
            // Given
            const particle = new Particle(new Vector(0, 0));
            const particle2 = new Particle(new Vector(3, 4));

            // When
            const displacement = particle.findDisplacement(particle2);

            // Then
            expect(displacement.x).toBe(3);
            expect(displacement.y).toBe(4);
        });
    });

    describe('bounce', () => {
        beforeEach(() => {});
        it('', () => {});
    });

    describe('isWithinBounds', () => {
        let particle;
        beforeEach(() => {
            particle = new Particle(new Vector(10, -10));
        });

        it('returns true if the particle is within the bounds', () => {
            // Given
            const [height, width] = [20, 20];

            // When / Then
            expect(particle.isWithinBounds(height, width)).toBe(true);
        });

        it('returns false if the particle x position is greater than the width', () => {
            // Given
            const [height, width] = [10, 20];

            // When / Then
            expect(particle.isWithinBounds(height, width)).toBe(false);
        });

        it('returns false if the particle x position is less than 0', () => {
            // Given
            const [height, width] = [0, 20];

            // When / Then
            expect(particle.isWithinBounds(height, width)).toBe(false);
        });

        it('returns false if the particle y position is greater than the height', () => {
            // Given
            const [height, width] = [20, 10];

            // When / Then
            expect(particle.isWithinBounds(height, width)).toBe(false);
        });

        it('returns false if the particle y position is less than 0', () => {
            // Given
            const [height, width] = [20, 0];

            // When / Then
            expect(particle.isWithinBounds(height, width)).toBe(false);
        });
    });

    describe('getRandomVelocity', () => {
        it('returns a random velocity', () => {
            // Given
            const particle = new Particle(new Vector(0, 0));
            Math.random = jest.fn(() => 0.7);

            // When / Then
            expect(particle.getRandomVelocity().x).toBeCloseTo(0.6); // (0.7 - 0.5) * 3
            expect(particle.getRandomVelocity().y).toBeCloseTo(0.6); // (0.7 - 0.5) * 3
        });
    });

    describe('addAnnotation', () => {
        let particle1, particle2, particles, svgElement;

        beforeEach(() => {
            particle1 = new Particle(new Vector(0, 0));
            particle2 = new Particle(new Vector(10, 0));
            particles = [particle1, particle2];
            addSvgLineFromVectors.mockReturnValue({ style: { display: null } });
            svgElement;
        });

        it('adds a line to all other particles', () => {
            // Given / When
            particle1.addAnnotation(particles, svgElement, true);

            // Then
            expect(addSvgLineFromVectors).toHaveBeenCalledWith(
                particle1.position,
                particle2.position,
                svgElement
            );
            expect(addSvgLineFromVectors).toHaveBeenCalledTimes(1);
            expect(particle1.lines[particle2.id]).toEqual({ style: { display: null } });
        });

        it('adds a line to all other particles, hiding the line when drawLinesBetweenParticles is false', () => {
            // Given / When
            particle1.addAnnotation(particles, svgElement, false);

            // Then
            expect(addSvgLineFromVectors).toHaveBeenCalledWith(
                particle1.position,
                particle2.position,
                svgElement
            );
            expect(addSvgLineFromVectors).toHaveBeenCalledTimes(1);
            expect(particle1.lines[particle2.id]).toEqual({ style: { display: 'none' } });
        });
    });

    describe('removeLinesFromParticle', () => {
        it('removes all children from the svg element that belong to the particle', () => {
            // Given
            const particle = new Particle(new Vector(0, 0));
            particle.lines = { 1: 'line' };
            const svgElement = { removeChild: jest.fn() };

            // When
            particle.removeLinesFromParticle(svgElement);

            // Then
            expect(svgElement.removeChild).toHaveBeenCalledWith('line');
            expect(svgElement.removeChild).toHaveBeenCalledTimes(1);
            expect(particle.lines).toEqual({});
        });
    });

    describe('removeLinesToParticle', () => {
        it('removes the line from the svg element and deletes it from the particle', () => {
            // Given
            const particle1 = new Particle(new Vector(0, 0));
            particle1.id = 1;
            const particle2 = { lines: { 1: 'line' } };
            const svgElement = { removeChild: jest.fn() };

            // When
            particle1.removeLinesToParticle(particle2, svgElement);

            // Then
            expect(svgElement.removeChild).toHaveBeenCalledWith('line');
            expect(svgElement.removeChild).toHaveBeenCalledTimes(1);
            expect(particle2.lines).toEqual({});
        });
    });

    describe('updateLineToParticle', () => {
        it('calls updateSvgLineFromVectors if a line exists', () => {
            // Given
            const particle1 = new Particle(new Vector(0, 0));
            const particle2 = {};
            particle1.lines = { [particle2.id]: 'line' };

            // When
            particle1.updateLineToParticle(particle2);

            // Then
            expect(updateSvgLineFromVectors).toHaveBeenCalledWith(
                particle1.position,
                particle2.position,
                'line'
            );
        });

        it('does not call updateSvgLineFromVectors if a line does not exists', () => {
            // Given
            const particle1 = new Particle(new Vector(0, 0));
            const particle2 = {};
            particle1.lines = {};

            // When
            particle1.updateLineToParticle(particle2);

            // Then
            expect(updateSvgLineFromVectors).not.toHaveBeenCalled();
        });
    });

    describe('updateWindowPosition', () => {
        it('updates the particle position', () => {
            // Given
            const particle = new Particle(new Vector(0, 0));
            const oldWindowPosition = { x: 100, y: 200 };
            const newWindowPosition = { x: 110, y: 220 };

            // When
            particle.updateWindowPosition(oldWindowPosition, newWindowPosition);

            // Then
            expect(particle.position.x).toBe(-5);
            expect(particle.position.y).toBe(10);
        });
    });
});
