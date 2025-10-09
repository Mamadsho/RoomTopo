export class Renderer {
  constructor({ vor, links, debug, centroids } = {}){
    this.vorLayer = typeof vor === 'string' ? document.querySelector(vor) : (vor || document.querySelector('#voronoi-polygons'));
    this.linksLayer = typeof links === 'string' ? document.querySelector(links) : (links || document.querySelector('#links-lines'));
    this.debugLayer = typeof debug === 'string' ? document.querySelector(debug) : (debug || document.querySelector('#debug-graph'));
    this.centroidsLayer = typeof centroids === 'string' ? document.querySelector(centroids) : (centroids || document.querySelector('#voronoi-centroids-svg'));
  }

  syncCanvasSize(canvas){
    [this.vorLayer, this.linksLayer, this.debugLayer, this.centroidsLayer].forEach((g)=>{
      if (!g) return;
      g.setAttribute('width', canvas.width);
      g.setAttribute('height', canvas.height);
    });
  }

  getVorLayer(){ return this.vorLayer; }
  getLinksLayer(){ return this.linksLayer; }
  getDebugLayer(){ return this.debugLayer; }
  getCentroidsLayer(){ return this.centroidsLayer; }

  addLine(p1, p2, stroke=null, container=this.linksLayer){
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.segment = [p1, p2];
    if (stroke) l.setAttribute('stroke', stroke);
    this.updateLine(l);
    container.appendChild(l);
    return l;
  }

  updateLine(l){
    l.setAttribute('x1', l.segment[0][0]);
    l.setAttribute('y1', -l.segment[0][1]);
    l.setAttribute('x2', l.segment[1][0]);
    l.setAttribute('y2', -l.segment[1][1]);
  }

  addPolygon(pts, stroke=null, container=this.vorLayer){
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    p.pts = pts;
    if (stroke) p.setAttribute('stroke', stroke);
    this.updatePolygon(p);
    container.appendChild(p);
    return p;
  }

  updatePolygon(polygon){
    let attr = '';
    polygon.pts.forEach((p)=>{
      attr += p[0] + ',' + -p[1] + ' ';
    });
    polygon.setAttribute('points', attr);
  }

  addDot(center, stroke, container=this.vorLayer){
    const d = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    d.c = center;
    if (stroke) d.setAttribute('stroke', stroke);
    d.setAttribute('r', 0.02);
    this.updateDot(d);
    container.appendChild(d);
    return d;
  }

  updateDot(d){
    d.setAttribute('cx', d.c[0]);
    d.setAttribute('cy', -d.c[1]);
  }

  // Centroid groups (circle + text label)
  addCentroidGroup(name, cx, cy, container=this.getCentroidsLayer()){
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'centroid');
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('class', 'label');
    label.textContent = name;
    group.appendChild(circle);
    group.appendChild(label);
    container.appendChild(group);
    group.setAttribute('transform', `translate(${cx||0}, ${cy||0})`);
    return group;
  }

  updateCentroidLabel(group, name){
    const label = group.querySelector('text');
    if (label) label.textContent = name;
  }

  updateCentroidTransform(group, x, y){
    group.setAttribute('transform', `translate(${x}, ${y})`);
  }
}
