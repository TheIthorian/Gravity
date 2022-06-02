import Particle from '../particle.js';
import { Vector } from '../vector.js';
import { MAX_STARTING_VELOCITY } from '../constants';

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
});
