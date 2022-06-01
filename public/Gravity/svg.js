function addSvgLine(x1, x2, y1, y2, svgElement) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttributeNS(null, 'x1', x1);
    line.setAttributeNS(null, 'x2', x2);
    line.setAttributeNS(null, 'y1', -y1);
    line.setAttributeNS(null, 'y2', -y2);
    line.setAttributeNS(null, 'stroke-width', '2');
    line.setAttributeNS(null, 'stroke', 'white');

    svgElement?.appendChild(line);
    return line;
}

function addSvgLineFromVectors(p1, p2, svgElement) {
    return addSvgLine(p1.x, p2.x, p1.y, p2.y, svgElement);
}

function updateSvgLine(x1, x2, y1, y2, lineElement) {
    lineElement.setAttributeNS(null, 'x1', x1);
    lineElement.setAttributeNS(null, 'x2', x2);
    lineElement.setAttributeNS(null, 'y1', -y1);
    lineElement.setAttributeNS(null, 'y2', -y2);
}

function updateSvgLineFromVectors(p1, p2, lineElement) {
    updateSvgLine(p1.x, p2.x, p1.y, p2.y, lineElement);
}

export { addSvgLine, addSvgLineFromVectors, updateSvgLine, updateSvgLineFromVectors };
