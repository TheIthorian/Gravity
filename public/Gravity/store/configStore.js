import { Store } from './store.js';

/**
 * Class to store client configuration
 */
export class ConfigStore extends Store {
    constructor(storeId) {
        super(storeId);
    }

    /**
     * Returns the stored configuration
     * @returns { object }
     */
    getForGravity() {
        const config = this.getAll();
        if (!config) return {};
        return {
            enableBorder: config['use-border'],
            enableRandomPlanetDirection: config['random-direction'],
            disableGravity: config['disable-gravity'],
            enableVerticalGravity: config['vertical-gravity'],
            enableDrawAnnotations: config['enable-draw-annotations'],
            enableDrawLinesBetweenPlanets: config['enable-draw-lines-between-planets'],
            // lineWidthBetweenPlanets: undefined, // Not implemented
            // lineBetweenPlanetsFade: undefined,  // Not implemented
            // planetColors: undefined,            // Not implemented
            minDisplacement: parseInt(config['min-displacement']),
        };
    }
}
