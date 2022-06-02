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
            enableRandomParticleDirection: config['random-direction'],
            disableGravity: config['disable-gravity'],
            enableVerticalGravity: config['vertical-gravity'],
            enableDrawAnnotations: config['enable-draw-annotations'],
            enableDrawLinesBetweenParticles: config['enable-draw-lines-between-particles'],
            // lineWidthBetweenParticles: undefined, // Not implemented
            // lineBetweenParticlesFade: undefined,  // Not implemented
            // particleColors: undefined,            // Not implemented
            minDisplacement: parseInt(config['min-displacement']),
        };
    }
}
