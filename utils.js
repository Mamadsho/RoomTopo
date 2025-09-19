export function hexToRgb(hex) {
  hex = hex.replace("#", "");
  return [
    parseInt(hex.substring(0, 2), 16) / 256,
    parseInt(hex.substring(2, 4), 16) / 256,
    parseInt(hex.substring(4, 6), 16) / 256
  ];
}