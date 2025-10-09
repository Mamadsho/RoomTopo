import { dot, det, arePointsOnSameSideOfLine, findIntersection, pointInPolygon, polygonArea } from "./utils.js";
import { Renderer } from "./svgRenderer.js";

let R /** @type {Renderer} */;

export function init(canvas, renderer){
    R = renderer;
    if (canvas && R && R.syncCanvasSize) R.syncCanvasSize(canvas);
}


export function addLine(p1, p2, stroke=null, container){ return R.addLine(p1, p2, stroke, container); }
export function updateLine(l){ return R.updateLine(l); }

export function addPolygon(pts, stroke=null, container){ return R.addPolygon(pts, stroke, container || R.getVorLayer()); }
export function updatePolygon(polygon){ return R.updatePolygon(polygon); }

export function addDot(center, stroke, container){ return R.addDot(center, stroke, container || R.getVorLayer()); }
export function updateDot(d){ return R.updateDot(d); }


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

    // Use same tolerance as cutPolygon to avoid flip-flopping
    const eps = 1e-9;

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

    // Remove consecutive duplicates and near-colinear vertices to stabilize results
    const cleaned = [];
    const nearEq = (p, q) => Math.abs(p[0]-q[0]) <= eps && Math.abs(p[1]-q[1]) <= eps;
    const isColinear = (a, b, c) => {
        const ab = [b[0]-a[0], b[1]-a[1]];
        const bc = [c[0]-b[0], c[1]-b[1]];
        return Math.abs(det(ab, bc)) <= eps;
    };
    for (let i = 0; i < output.length; i++) {
        const pt = output[i];
        if (cleaned.length === 0 || !nearEq(cleaned[cleaned.length-1], pt)) {
            cleaned.push(pt);
        }
    }
    // Remove colinear middle points
    let changed = true;
    while (changed && cleaned.length > 2) {
        changed = false;
        for (let i = 0; i < cleaned.length; i++) {
            const a = cleaned[(i-1+cleaned.length)%cleaned.length];
            const b = cleaned[i];
            const c = cleaned[(i+1)%cleaned.length];
            if (isColinear(a, b, c)) {
                cleaned.splice(i,1);
                changed = true;
                break;
            }
        }
    }

    // Return updated SVG polygon element when provided, to match call site
    if (b_i && b_i.pts !== undefined) {
        b_i.pts = cleaned;
        return b_i;
    }
    return cleaned;
}

// polygonArea moved to utils.js

export function midline(p1, p2){
    const normal = [p2[1] - p1[1], p1[0] - p2[0]];
    const mid = [(p1[0] + p2[0])/2, (p1[1] + p2[1])/2];
    return [ [mid[0] - normal[0], mid[1] - normal[1]],
             [mid[0] + normal[0], mid[1] + normal[1]] ];
}

// Approximate equality for polygon point arrays
function approxEqualPts(a, b, eps = 1e-9){
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++){
        if (Math.abs(a[i][0] - b[i][0]) > eps || Math.abs(a[i][1] - b[i][1]) > eps) return false;
    }
    return true;
}

export function updateVoronoi(sites, bbox, clippingPolygon) {
    while (R.getVorLayer().children.length > sites.length) {
        R.getVorLayer().removeChild(R.getVorLayer().lastChild);
    }
    // Add new dots and polygons
    for (let i = 0; i < sites.length; i++) {
        if (i >= R.getVorLayer().children.length) {
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
                        const child = R.getVorLayer().children[i];
                        if (child.pts !== null){
                            child.dirty = true;
                            child.pts = null;
                        }
                        continue outerLoop;
                    }
                }
            }
        }
        // Clip now so .pts stores the final polygon
        let clipped = polygonsIntersection(clippingPolygon, pol) || [];
        if (clipped && clipped.pts) clipped = clipped.pts; // normalize to array
        const finalPts = (clipped.length >= 3) ? clipped : null;
        const child = R.getVorLayer().children[i];
        if (!approxEqualPts(child.pts, finalPts)){
            child.dirty = true;
            child.pts = finalPts;
        }
    }
    // Update all dirty polygons (including index 0) and reset flags
    for (let i = sites.length - 1; i >= 0; i--){
        const child = R.getVorLayer().children[i];
        if (!child) continue;
        if (child.dirty) {
            if (child.pts == null){
                child.remove();
                continue;
            } else {
                // Already clipped; just push to DOM
                updatePolygon(child);
                child.dirty = false;
            }
        }
    }
}
