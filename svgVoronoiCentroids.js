let svg;
let width;
let height;
import {clamp} from './utils.js'
import { Renderer } from './svgRenderer.js';

let R /** @type {Renderer} */;

export function initSVG(canvas, sites, onUpdate, renderer) {
    R = renderer;
    svg = R.getCentroidsLayer();
    width = canvas.width;
    height = canvas.height;
    enableSiteDragging(canvas, sites, onUpdate);
    return svg;
}

export function addRoom(name, cx, cy) {
    return R.addCentroidGroup(name, cx, cy);
}

export function updateRoomLabel(room, name){
    R.updateCentroidLabel(room, name);
}

export function removeRoom(idx){
    svg.removeChild(svg.children[idx]);
}

// Enables dragging of Voronoi sites (SVG circles)
function enableSiteDragging(canvas, sites, onUpdate) {
    let draggingIdx = null;
    
    svg.addEventListener('mousedown', (e) => {
        if (e.target.tagName !== 'circle') return;
        draggingIdx = Array.from(svg.children).indexOf(e.target.parentElement);
        if (draggingIdx === -1) return;
        e.preventDefault();
    });

    function onDrag( ax, ay ){
        const width = canvas.width;
        const height = canvas.height;
        // Convert pixel to normalized coordinates [-1, 1]
        const rx = 2 * ax / width - 1.0;
        const ry = 2 * ay / height - 1.0;
        const x = clamp(rx, -1, 1);
        const y = clamp(ry, -1, 1);

        sites[draggingIdx][0] = x;
        sites[draggingIdx][1] = -y;

        // Move the SVG dot group only
        const group = svg.children[draggingIdx];
        R.updateCentroidTransform(group, x, y);

        if (onUpdate) onUpdate();
    }

    window.addEventListener('mousemove', (e) => {
        if (draggingIdx === null) return;
        const rect = canvas.getBoundingClientRect();
        const ax = e.clientX - rect.left;
        const ay = e.clientY - rect.top;
        
        onDrag( ax, ay );
    });
    
    

    window.addEventListener('mouseup', () => {
        draggingIdx = null;
    });

    svg.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.tagName === 'circle') {
            draggingIdx = Array.from(svg.children).indexOf(target.parentElement);
            e.preventDefault();
        }
    });

    window.addEventListener('touchmove', (e) => {
        if (draggingIdx === null) return;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const ax = touch.clientX - rect.left;
        const ay = touch.clientY - rect.top;

        onDrag( ax, ay );
    });

    window.addEventListener('touchend', () => {
        draggingIdx = null;
    });
}
