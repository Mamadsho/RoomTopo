import { distancesq, dot, det, arePointsOnSameSideOfLine } from "./utils.js";

let vor_graph;
let links_graph;
let debug_graph;

export function init(canvas){
    vor_graph = document.querySelector("#voronoi-polygons");
    links_graph = document.querySelector("#links-lines");
    debug_graph = document.querySelector("#debug-graph");
    [vor_graph, links_graph, debug_graph].forEach((g)=>{
        g.setAttribute("width", canvas.width);
        g.setAttribute("height", canvas.height);
    });
}


export function addLine(p1, p2, stroke=null, container=links_graph){
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.segment = [p1, p2];
    if (stroke) l.setAttribute('stroke', stroke);
    updateLine(l);
    container.appendChild(l);
    return l;
}

export function updateLine(l){
    l.setAttribute("x1", l.segment[0][0]);
    l.setAttribute("y1", -l.segment[0][1]);
    l.setAttribute("x2", l.segment[1][0]);
    l.setAttribute("y2", -l.segment[1][1]);
}

export function addPolygon(pts, stroke=null, container=vor_graph){
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    p.pts = pts;
    if (stroke) p.setAttribute('stroke', stroke);
    updatePolygon(p);
    container.appendChild(p);
    return p;
}

export function updatePolygon(polygon){
    let attr = "";
    polygon.pts.forEach((p)=>{
        attr += p[0] + "," + -p[1] + " ";
    });
    polygon.setAttribute('points', attr);
}

export function addDot(center, stroke, container=vor_graph){
    const d = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    d.c = center;
    if (stroke) d.setAttribute('stroke', stroke);
    d.setAttribute('r', 0.02);
    updateDot(d);
    container.appendChild(d);
    return d
}

export function updateDot(d){
    d.setAttribute('cx', d.c[0]);
    d.setAttribute('cy', -d.c[1]);
}

export function isIntersecting(l1, l2){
    const a = [ [l1[1][0] - l1[0][0]],
                [l1[1][1] - l1[0][1]] ];
    const nor = [a[1], -a[0]];
    const b = [ [l2[0][0] - l1[0][0]],
                [l2[0][1] - l1[0][1]]];
    const c = [ [l2[1][0] - l1[0][0]],
                [l2[1][1] - l1[0][1]]];
    return dot(nor, b) * dot (nor, c) <= 0;
}

export function findIntersection(cs1, ls2){
    const c = [ cs1[1][0] - cs1[0][0],
                cs1[1][1] - cs1[0][1]];

    const l = [ ls2[1][0] - ls2[0][0],
                ls2[1][1] - ls2[0][1]];
    
    const o = [ cs1[0][0] - ls2[0][0],
                cs1[0][1] - ls2[0][1]];
    
    // k1 * c - k2 * l = o
    // by Cramer's Rule
    // k2 = det(c, o)/det(c, -l);

    const k2 = det(c, o)/det(c, l);
    const iv = [k2 * l[0], k2 * l[1]];
    const ip = [iv[0] + ls2[0][0], iv[1] + ls2[0][1]];
    return ip;
}

export function bisectPolygon(polygon, line){
    const res = cutPolygon(polygon.pts, line.segment);
    if (res){
        addPolygon(res[0], "red");
        addPolygon(res[1], "blue");
    }
    return res;
}

export function cutPolygon(pts, line, eps = 1e-9) {
    const n = pts.length;

    // Shift polygon so the line passes through the origin
    const shifted = pts.map(p => [p[0] - line[0][0], p[1] - line[0][1]]);

    // Normal to the line (perpendicular vector)
    const normal = [line[1][1] - line[0][1], line[0][0] - line[1][0]];

    // Side test with tolerance
    const side = (p) => dot(p, normal) > eps;

    let intersections = [];
    let prevSide = side(shifted[0]);

    // Traverse edges in order to detect crossings
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const currSide = side(shifted[j]);

        if (currSide !== prevSide) {
            intersections.push(i);
        }
        prevSide = currSide;
    }

    // Convex polygon assumption → exactly 2 intersections max
    if (intersections.length !== 2) {
        return null;
    }

    const i0 = intersections[0];
    const i1 = intersections[1];

    // Find intersection points in original coordinates
    const C0 = findIntersection(line, [pts[i0], pts[(i0 + 1) % n]]);
    const C1 = findIntersection(line, [pts[i1], pts[(i1 + 1) % n]]);

    // Since convex & traversal order → i0 < i1 guaranteed
    const P1 = [
        ...pts.slice(0, i0 + 1),
        C0, C1,
        ...pts.slice(i1 + 1, n)
    ];
    const P2 = [
        ...pts.slice(i0 + 1, i1 + 1),
        C1,
        C0
    ];

    return [P1, P2];
}

export function pointInPolygon(pt, pol) {
    let inside = false;
    const n = pol.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = pol[i][0], yi = pol[i][1];
        const xj = pol[j][0], yj = pol[j][1];
        const intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
                            (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

export function polygonsIntersection(a_i, b_i){
    let a = (polygonArea(a_i) < 0)? Array.from(a_i) : Array.from(a_i).reverse();
    let b = (polygonArea(b_i) < 0)? Array.from(b_i.pts) : Array.from(b_i.pts).reverse();

    class Point{
        constructor(p){
            this.p = p;
            this.next = null;
            this.insideA = false;
        }
    }

    a.forEach((p, i)=>{
        a[i] = new Point(p);
        // a[i].next = a[(i + 1) % a.length];
    });
    a.forEach((p,i)=>{
        a[i].next = a[(i + 1) % a.length];
    })
    b.forEach((p, i)=>{
        b[i] = new Point(p);
        // b[i].next = b[(i + 1) % b.length];
        b[i].insideA = pointInPolygon(b[i].p, a);
    });
    b.forEach((p,i)=>{
        b[i].next = b[(i + 1) % b.length];
    })

    // Find intersection points and insert them into the polygon linked lists
    // Generate list of inbound intersection points
    let inbound = [];
    let p_next, q_next;
    let p = a[0];
    do {
        p_next = p.next;
        let q = b[0];
        do {
            q_next = q.next;
            if (isIntersecting([p.p, p.next.p], [q.p, q.next.p])){
                const ip_a = new Point(findIntersection([p.p, p.next.p], [q.p, q.next.p]));
                const ip_b = new Point(ip_a.p);
                p.next = ip_a;
                q.next = ip_b;
                ip_a.next = q.next;
                ip_b.next = p.next;
                if (ip_a.next.insideA){
                    inbound.push(ip_a);
                }
            }
        } while ((q = q_next) !== b[0]);
    } while ((p = p_next) !== a[0]);

    i_pol = [];
    p = inbound[0];
    do {
        i_pol.push(p.p);
        p = p.next;
    } while (p != inbound[0]);

    return i_pol;
}

export function polygonArea(pts){
    let area = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++){
        const j = (i + 1) % n;
        area += pts[i][0] * pts[j][1];
        area -= pts[j][0] * pts[i][1];
    }
    return area / 2;
}

export function midline(p1, p2){
    const normal = [p2[1] - p1[1], p1[0] - p2[0]];
    const mid = [(p1[0] + p2[0])/2, (p1[1] + p2[1])/2];
    return [ [mid[0] - normal[0], mid[1] - normal[1]],
             [mid[0] + normal[0], mid[1] + normal[1]] ];
}

export function generateVoronoi(sites, bbox) {
    for (let i = 0; i < sites.length; i++) {
        // addDot(sites[i]);
        let pol = bbox;
        let vpol = addPolygon(pol);
        for (let j = 0; j < sites.length; j++) {
            if (i !== j) {
                const mid = midline(sites[i], sites[j]);
                const cut_pol = cutPolygon(pol, mid);
                if (cut_pol) {
                    if (pointInPolygon(sites[i], cut_pol[0])) { pol = cut_pol[0]; }
                    else { pol = cut_pol[1]; }
                    vpol.pts = pol;
                    // updatePolygon(vpol);
                }
            }
        }
        updatePolygon(vpol);
    }
}

export function updateVoronoi(sites, bbox, clippingPolygon) {
    while (vor_graph.children.length > sites.length) {
        vor_graph.removeChild(vor_graph.lastChild);
    }
    // Add new dots and polygons
    for (let i = 0; i < sites.length; i++) {
        if (i >= vor_graph.children.length) {
            addPolygon(bbox);
        }
    }

    // Update existing dots and polygons
    // if it has changed
    outerLoop: for (let i = 0; i < sites.length; i++) {
        let pol = bbox;
        for (let j = 0; j < sites.length; j++) {
            if (i !== j) {
                const mid = midline(sites[i], sites[j]);
                const cut_pols = cutPolygon(pol, mid);
                if (cut_pols) {

                    if ( arePointsOnSameSideOfLine(sites[i], cut_pols[0][0], mid) ){
                        pol = cut_pols[0];
                    } else { 
                        pol = cut_pols[1];
                    }
                } else {
                    if ( !arePointsOnSameSideOfLine(sites[i], pol[0], mid) ){
                        vor_graph.children[i].dirty = true;
                        vor_graph.children[i].pts = null;
                        continue outerLoop;
                    }
                }
            }
        }
        if (vor_graph.children[i].pts != pol){
            vor_graph.children[i].dirty = true;
            vor_graph.children[i].pts = pol;
        }
    }
    for (let i = sites.length - 1; i > 0; i--){
        if (vor_graph.children[i].dirty) {
            if (vor_graph.children[i].pts == null){
                vor_graph.children[i].remove();
            } else {
                updatePolygon(polygonsIntersection(clippingPolygon, vor_graph.children[i]));
            }
        }
    }
}