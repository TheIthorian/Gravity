import Planet from '../../planet/planet.js';
import { Coordinate } from '../../vector.js';
import { MAX_STARTING_VELOCITY } from '../../constants';

// jest.mock('../../vector.js');

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
            const position = new Coordinate(10, 20);

            // When
            const planet = new Planet(position, config);

            // Then
            expect(planet.id).toBe(1);
            expect(planet.position).toEqual(position);
            expect(planet.velocity.x).toBeCloseTo(0.3 * MAX_STARTING_VELOCITY);
            expect(planet.velocity.y).toBeCloseTo(0.3 * MAX_STARTING_VELOCITY);
            expect(global.Math.random).toHaveBeenCalledTimes(2);
        });
    });

    describe('config', () => {
        let planet;

        beforeEach(() => {
            const position = new Coordinate(10, 20);
            planet = new Planet(position, {});
        });

        it('sets the config', () => {
            // Given
            const config = {
                randomDirection: true,
                color: '#ffffff',
                radius: 10,
            };

            // When
            planet.config = config;

            // Then
            expect(planet.color).toBe('#ffffff');
            expect(planet.randomDirection).toBe(true);
            expect(planet.radius).toBe(10);
        });

        it('only sets valid config', () => {
            // Given
            const config = {
                randomDirection: true,
                color: '#ffffff',
                radius: 10,
            };

            // When
            planet.config = config;
            planet.config = {};

            // Then
            expect(config.color).toBe('#ffffff');
            expect(config.randomDirection).toBe(true);
            expect(config.radius).toBe(10);
        });

        it('gets the config', () => {
            // Given
            planet.randomDirection = false;
            planet.color = '#aaaaaa';
            planet.radius = 10;

            // When
            const config = planet.config;

            // Then
            expect(config.color).toBe('#ffffff');
            expect(config.randomDirection).toBe(true);
            expect(config.radius).toBe(10);
        });
    });
});
