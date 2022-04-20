export class Store {
    storeId = 'gravityConfig';

    constructor(storeId, store) {
        if (storeId) this.storeId = storeId;
        if (store) this.store = store;
    }

    getAll() {
        return JSON.parse(localStorage.getItem(this.storeId));
    }

    get(attribute) {
        const store = this._getStore();
        return attribute ? store[attribute] : store;
    }

    set(attribute, value) {
        const store = this._getStore();
        store[attribute] = value;

        localStorage.setItem(this.storeId, JSON.stringify(store));
    }

    replace(obj) {
        if (typeof obj === 'object') {
            localStorage.setItem(this.storeId, JSON.stringify(obj));
        }
    }

    clear() {
        localStorage.removeItem(this.storeId);
    }

    clearAll() {
        localStorage.clear();
    }

    _getStore() {
        const store = JSON.parse(localStorage.getItem(this.storeId));
        return store ? store : {};
    }

    convertForGravity() {
        const config = this.getAll();
        if (!config) return {};
        return {
            enableBorder: config['use-border'],
            enableRandomPlanetDirection: config['random-direction'],
            disableGravity: config['disable-gravity'],
            enableVerticalGravity: config['vertical-gravity'],
            enableDrawAnnotations: config['enable-draw-annotations'],
            enableDrawLinesBetweenPlanets:
                config['enable-draw-lines-between-planets'],
            // lineWidthBetweenPlanets: undefined, // Not implemented
            // lineBetweenPlanetsFade: undefined,  // Not implemented
            // planetColors: undefined,            // Not implemented
            minDisplacement: parseInt(config['min-displacement']),
        };
    }
}
