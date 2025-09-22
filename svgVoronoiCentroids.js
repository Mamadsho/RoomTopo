let svg;
let width;
let height;
import {clamp} from './utils.js'

export function initSVG(canvas, sites, onUpdate) {
    svg = document.getElementById('voronoi-centroids-svg');
    width = canvas.width;
    height = canvas.height;

    // Create SVG element
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);

    // Position SVG above canvas
    canvas.parentElement.style.position = 'relative';
    canvas.parentElement.appendChild(svg);

    // enableSiteDragging(canvas, sites, svg.onUpdate);
    enableSiteDragging(canvas, sites, onUpdate);

    return svg;
}

export function addRoom(name, cx, cy) {
    // Map normalized coordinates to pixel positions
    // site: [x, y], both in [-1, 1]
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    circle.setAttribute('cx', 0);
    circle.setAttribute('cy', 0);
    circle.setAttribute('r', .05);
    circle.setAttribute('fill', '#fff0');
    circle.setAttribute('stroke', 'white');
    circle.setAttribute('stroke-width', '.015');
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', 0);
    label.setAttribute('y', 0.15);
    label.setAttribute('class', 'map-label');
    label.textContent = name;
    group.appendChild(circle);
    group.appendChild(label);
    svg.appendChild(group);
    return group;
}

export function updateRoomLabel(room, name){
    const label = room.querySelector('text');
    label.textContent = name;
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
        const circle = svg.children[draggingIdx];
        circle.setAttribute('transform', `translate(${x}, ${y})`);

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
            draggingIdx = Array.from(svg.children).indexOf(target);
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
