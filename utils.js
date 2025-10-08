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