import { dot, det, arePointsOnSameSideOfLine, findIntersection, pointInPolygon, polygonArea } from "./utils.js";

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

// Note: segment intersection helper removed; not used after simplification

// findIntersection moved to utils.js

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

// pointInPolygon moved to utils.js

export function polygonsIntersection(a_i, b_i){
    // Accept either raw point arrays or SVG polygon elements with `.pts`
    let clip = Array.isArray(a_i) ? Array.from(a_i) : Array.from(a_i.pts);
    let subj = Array.isArray(b_i) ? Array.from(b_i) : Array.from(b_i.pts);

    // Ensure clip polygon is CCW so "inside" is consistently left-of-edge
    if (polygonArea(clip) < 0) clip = clip.slice().reverse();

    const eps = 1e-12;

    const inside = (pt, a, b) => {
        const ab = [b[0] - a[0], b[1] - a[1]];
        const ap = [pt[0] - a[0], pt[1] - a[1]];
        return det(ab, ap) >= -eps;
    };


    let output = subj;
    for (let i = 0; i < clip.length; i++) {
        const a = clip[i];
        const b = clip[(i + 1) % clip.length];

        const input = output;
        output = [];
        if (input.length === 0) break;

        let S = input[input.length - 1];
        for (const E of input) {
            const Ein = inside(E, a, b);
            const Sin = inside(S, a, b);
            if (Ein) {
                if (!Sin) {
                    const I = findIntersection([S, E], [a, b]);
                    if (I) output.push(I);
                }
                output.push(E);
            } else if (Sin) {
                const I = findIntersection([S, E], [a, b]);
                if (I) output.push(I);
            }
            S = E;
        }
    }

    // Return updated SVG polygon element when provided, to match call site
    if (b_i && b_i.pts !== undefined) {
        b_i.pts = output;
        return b_i;
    }
    return output;
}

// polygonArea moved to utils.js

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
