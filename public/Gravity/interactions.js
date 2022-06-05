import { G } from './constants.js';
import { Vector } from './vector.js';

function gravitationalEuler(particle, gravity) {
    let resultantForce = new Vector(0, 0);

    if (!gravity?.gravity) {
        particle.resultantForce = resultantForce;
        return;
    }

    const { height, width } = gravity.dimensions;

    for (let i = 0; i < gravity.particles.length; i++) {
        const otherParticle = gravity.particles[i];
        const isOtherInBounds = otherParticle.isWithinBounds(height, width);
        const isInBounds = particle.isWithinBounds(height, width);

        if (otherParticle.id != particle.id && isOtherInBounds && isInBounds) {
            const displacement = particle.findDisplacement(otherParticle);
            const distance2 = Math.max(displacement.mod2(), gravity.MIN_DISPLACEMENT);
            const unitVector = displacement.findUnitVector();

            const force = unitVector.multiply((G * otherParticle.mass) / distance2);
            resultantForce = resultantForce.add(force);
        }
    }

    particle.resultantForce = resultantForce;
}

function calculateVerticalForce(particle, gravity) {
    if (!gravity?.gravity) {
        particle.resultantForce = new Vector(0, -0).multiply(1);
        return;
    }

    const { height, width } = gravity.dimensions;

    if (!particle.isWithinBounds(height, width)) {
        particle.resultantForce = gravity.verticalGravityVector.multiply(0.02);
        return;
    }

    particle.resultantForce = gravity.verticalGravityVector.multiply(0.5);
}

export default Object.freeze({
    gravitationalEuler,
    calculateVerticalForce,
});
