export function hexToRgb(hex) {
  hex = hex.replace("#", "");
  return [
    parseInt(hex.substring(0, 2), 16) / 256,
    parseInt(hex.substring(2, 4), 16) / 256,
    parseInt(hex.substring(4, 6), 16) / 256
  ];
}

export function distancesq(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}
export function dot (a, b){
    return a[0] * b[0] + a[1] * b[1];
}

export function det (a, b){
    return a[0] * b[1] - a[1] * b[0];
}

export function arePointsOnSameSideOfLine(p1, p2, line){
  const nor = [line[1][1]-line[0][1], line[0][0]-line[1][0]];
  const a = [p1[0] - line[0][0], p1[1] - line[0][1]];
  const b = [p2[0] - line[0][0], p2[1] - line[0][1]];
  return dot(nor, a) * dot(nor, b) >= 0;
}

export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

// Robust segment/segment intersection helpers
export function segmentsIntersect(p, q, r, s, eps = 1e-12) {
  const rVec = [q[0] - p[0], q[1] - p[1]];
  const sVec = [s[0] - r[0], s[1] - r[1]];
  const qp = [r[0] - p[0], r[1] - p[1]];
  const denom = det(rVec, sVec);

  if (Math.abs(denom) < eps) {
    // Parallel
    if (Math.abs(det(qp, rVec)) < eps) {
      // Colinear: check 1D overlap via projection onto rVec
      const rLen2 = rVec[0] * rVec[0] + rVec[1] * rVec[1];
      if (rLen2 < eps) {
        // p==q: treat as point overlapping r..s
        const minX = Math.min(r[0], s[0]) - eps, maxX = Math.max(r[0], s[0]) + eps;
        const minY = Math.min(r[1], s[1]) - eps, maxY = Math.max(r[1], s[1]) + eps;
        return p[0] >= minX && p[0] <= maxX && p[1] >= minY && p[1] <= maxY;
      }
      const t0 = ( (r[0] - p[0]) * rVec[0] + (r[1] - p[1]) * rVec[1] ) / rLen2;
      const t1 = ( (s[0] - p[0]) * rVec[0] + (s[1] - p[1]) * rVec[1] ) / rLen2;
      const tMin = Math.min(t0, t1), tMax = Math.max(t0, t1);
      return tMax >= -eps && tMin <= 1 + eps;
    }
    return false;
  }

  const t = det(qp, sVec) / denom;
  const u = det(qp, rVec) / denom;
  return t >= -eps && t <= 1 + eps && u >= -eps && u <= 1 + eps;
}

export function segmentIntersectionPoint(p, q, r, s, eps = 1e-12) {
  const rVec = [q[0] - p[0], q[1] - p[1]];
  const sVec = [s[0] - r[0], s[1] - r[1]];
  const qp = [r[0] - p[0], r[1] - p[1]];
  const denom = det(rVec, sVec);

  if (Math.abs(denom) < eps) {
    // Parallel or colinear: return null to avoid ambiguity
    return null;
  }
  const t = det(qp, sVec) / denom;
  const u = det(qp, rVec) / denom;
  if (t < -eps || t > 1 + eps || u < -eps || u > 1 + eps) return null;
  return [p[0] + t * rVec[0], p[1] + t * rVec[1]];
}

// Line/line intersection (infinite lines) using Cramer's rule
export function findIntersection(cs1, ls2, eps = 1e-12){
  const c = [ cs1[1][0] - cs1[0][0], cs1[1][1] - cs1[0][1] ];
  const l = [ ls2[1][0] - ls2[0][0], ls2[1][1] - ls2[0][1] ];
  const o = [ cs1[0][0] - ls2[0][0], cs1[0][1] - ls2[0][1] ];
  const denom = det(c, l);
  if (Math.abs(denom) < eps) return null; // Parallel or colinear
  const k2 = det(c, o)/denom;
  const iv = [k2 * l[0], k2 * l[1]];
  return [iv[0] + ls2[0][0], iv[1] + ls2[0][1]];
}

// Point-in-polygon (ray casting)
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

// Signed polygon area (positive CCW)
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
