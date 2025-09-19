let svg;
let width;
let height;

export function initSVG(canvas, sites, onUpdate) {
    svg = document.getElementById('voronoi-sites-svg');
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
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', Math.max(8, width * 0.01));
    circle.setAttribute('fill', '#fff0');
    circle.setAttribute('stroke', 'white');
    circle.setAttribute('stroke-width', '2');
    svg.appendChild(circle);
    return circle;
}

export function removeRoom(idx){
    svg.removeChild(svg.children[idx]);
}

// Enables dragging of Voronoi sites (SVG circles)
function enableSiteDragging(canvas, sites, onUpdate) {
    let draggingIdx = null;
    
    svg.addEventListener('mousedown', (e) => {
        if (e.target.tagName !== 'circle') return;
        draggingIdx = Array.from(svg.children).indexOf(e.target);
        if (draggingIdx === -1) return;
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (draggingIdx === null) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const width = canvas.width;
        const height = canvas.height;
        // Convert pixel to normalized coordinates [-1, 1]
        sites[draggingIdx][0] = (x / width) * 2 - 1;
        sites[draggingIdx][1] = -((y / height) * 2 - 1);

        // Move the SVG circle only
        const circle = svg.children[draggingIdx];
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);

        if (onUpdate) onUpdate();
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
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const width = canvas.width;
        const height = canvas.height;
        sites[draggingIdx][0] = (x / width) * 2 - 1;
        sites[draggingIdx][1] = -((y / height) * 2 - 1);
        updateVoronoi(sites, colors);
        const circle = svg.children[draggingIdx];
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        if (onUpdate) onUpdate(sites, colors);
    });

    window.addEventListener('touchend', () => {
        draggingIdx = null;
    });
}