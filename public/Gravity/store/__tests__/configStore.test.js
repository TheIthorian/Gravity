import { ConfigStore } from '../configStore';

const STORE_ID = 'test-store';
const store = new ConfigStore(STORE_ID);

describe('ConfigStore', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getForGravity', () => {
        it('returns the stored configuration', () => {
            // Given
            store.getAll = jest.fn();
            store.getAll.mockReturnValue({
                'use-border': true,
                'random-direction': true,
                'disable-gravity': true,
                'vertical-gravity': true,
                'enable-draw-annotations': true,
                'enable-draw-lines-between-planets': true,
                'min-displacement': '100',
            });

            // When
            const config = store.getForGravity();

            // Then
            expect(config).toStrictEqual({
                enableBorder: true,
                enableRandomPlanetDirection: true,
                disableGravity: true,
                enableVerticalGravity: true,
                enableDrawAnnotations: true,
                enableDrawLinesBetweenPlanets: true,
                minDisplacement: 100,
            });
        });

        it('returns an empty object when no config is found', () => {
            // Given / When
            store.getAll = jest.fn();
            store.getAll.mockReturnValue(null);
            const properties = store.getForGravity();

            // Then
            expect(properties).toStrictEqual({});
        });
    });
});
