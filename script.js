import { initVoronoi, updateVoronoi } from './webglVoronoi.js';

document.querySelector('h1').textContent = 'Hello, Universe!';

// 8 Voronoi sites
const sites = [
    [-0.3,  0.2],
    [ 0.1, -0.1],
    [ 0.4,  0.3],
    [-0.9, -0.4],
    [ 0.0,  0.5],
    [ 0.7, -0.3],
];

// Add colors for each site
const colors = [
    [1.0, 0.0, 0.0], // red
    [0.0, 1.0, 0.0], // green
    [0.0, 0.0, 1.0], // blue
    [1.0, 1.0, 0.0], // yellow
    [1.0, 0.0, 1.0], // magenta
    [0.0, 1.0, 1.0], // cyan
    [0.5, 0.5, 0.5], // gray
    [1.0, 0.5, 0.0]  // orange
];

// canvas setup
const canvas = document.getElementById('canvas');

// Initialize Voronoi rendering
initVoronoi(canvas, sites, colors);

// Example: update Voronoi later (call this when you want to update)
// updateVoronoi(newSites, newColors);
