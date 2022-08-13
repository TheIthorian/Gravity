import { Store } from '../store.js';

const STORE_ID = 'test-store';

const store = new Store(STORE_ID);

const getItem = jest.spyOn(window.localStorage.__proto__, 'getItem');
const setItem = jest.spyOn(window.localStorage.__proto__, 'setItem');
const removeItem = jest.spyOn(window.localStorage.__proto__, 'removeItem');
const clear = jest.spyOn(window.localStorage.__proto__, 'clear');

describe('Store', () => {
    afterEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    describe('getAll', () => {
        it('returns all stored items', () => {
            // Given / When
            store.set('property1', 99);
            store.set('property2', 'abc');
            const properties = store.getAll();

            // Then
            expect(properties).toEqual({
                property1: 99,
                property2: 'abc',
            });
        });

        it('returns null when no items have been set', () => {
            // Given / When
            const properties = store.getAll();

            // Then
            expect(properties).toBeNull();
        });
    });

    describe('get', () => {
        it('returns a specified propert', () => {
            // Given / When
            store.set('property1', 99);
            store.set('property2', 'abc');
            const properties = store.get('property1');

            // Then
            expect(properties).toBe(99);
        });

        it('returns undefined the property is not present', () => {
            // Given / When
            const property = store.get('non-existant-property');

            // Then
            expect(property).toBeUndefined();
        });
    });

    describe('set', () => {
        it('stores the given item to localStorage', () => {
            // Given / When
            store.set('property1', 99);

            // Then
            expect(getItem).toHaveBeenCalledWith(STORE_ID);
            expect(setItem).toHaveBeenCalledWith(STORE_ID, JSON.stringify({ property1: 99 }));
        });
    });

    describe('replace', () => {
        it('replaces the store with a given object', () => {
            // Given
            store.set('old-property', [1, 2, 3]);
            const newProperty = {
                'new-property': 0,
            };

            // When
            store.replace(newProperty);

            // Then
            expect(store.getAll()).toEqual(newProperty);
            expect(setItem).toHaveBeenLastCalledWith(STORE_ID, JSON.stringify(newProperty));
        });
    });

    describe('clear', () => {
        it('clears the store from localstorage', () => {
            // Given
            store.set('property', { 10: '10' });

            // When
            store.clear();

            // Then
            expect(store.getAll()).toBeNull();
            expect(removeItem).toBeCalledTimes(1);
            expect(removeItem).toBeCalledWith(STORE_ID);
        });
    });

    describe('clearAll', () => {
        it('clears all stores from localstorage', () => {
            // Given
            store.set('property', { 10: '10' });
            const store2 = new Store('second-store');
            store2.set('item', 'value');

            // When
            Store.clearAll();

            // Then
            expect(store.getAll()).toBeNull();
            expect(store2.getAll()).toBeNull();
            expect(clear).toBeCalledTimes(1);
        });
    });
});
