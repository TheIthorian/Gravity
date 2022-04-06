class ColorHandler {

    _colorsA;
    _colorsB;
    _useA;

    constructor(colorList) {
        this._colorsA = colorList.map(x => x);
        this._colorsB = [];
        this._useA = true;
    }

    get colorList() {
        return this._colorsA.concat(this._colorsB);
    }

    randomColor() {
        const fn = (a, b) => {
            const i = Math.floor(Math.random() * a.length);
            const color = a.splice(i, 1);
            b.push(color);
            return color;
        }
        const color = this._useA 
            ? fn(this._colorsA, this._colorsB) 
            : fn(this._colorsB, this._colorsA);

        if (this._colorsA.length == 0) {this._useA = false;}
        if (this._colorsB.length == 0) {this._useA = true;}
        return color;
    }
}

export { ColorHandler };