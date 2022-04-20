class Vector {
    x;
    y;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(vector) {
        const x = this.x + vector.x;
        const y = this.y + vector.y;
        return new Vector(x, y);
    }

    multiply(factor) {
        const x = this.x * factor;
        const y = this.y * factor;
        return new Vector(x, y);
    }

    mod() {
        return Math.sqrt(this.mod2());
    }

    mod2() {
        return this.x ** 2 + this.y ** 2;
    }

    findDisplacement(vector) {
        const dx = vector.x - this.x;
        const dy = vector.y - this.y;
        return new Vector(dx, dy);
    }

    findUnitVector() {
        return new Vector(this.x / this.mod(), this.y / this.mod());
    }
}

class Coordinate extends Vector {}

class Velocity extends Vector {}

class Force extends Vector {}

export { Vector, Coordinate, Velocity, Force };
