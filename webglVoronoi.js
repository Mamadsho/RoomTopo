let gl = null;
let program = null;
let positionBuffer = null;
let positionLocation = null;

export const vertexShaderSource = `
attribute vec4 a_position;
varying vec2 v_pos;
void main() {
    gl_Position = a_position;
    v_pos = a_position.xy;
}
`;

export const fragmentShaderSource = `
precision mediump float;
varying vec2 v_pos;
uniform vec2 u_sites[100];
uniform vec3 u_colors[100];
uniform int u_siteCount;

void main() {
    float minDist = 100.0;
    vec3 minColor = vec3(0.0);
    for (int i = 0; i < 100; ++i) {
        if (i >= u_siteCount) break;
        float d = distance(v_pos, u_sites[i]);
        if (d < minDist) {
            minDist = d;
            minColor = u_colors[i];
        }
    }
    gl_FragColor = vec4(2.0 * minColor * minDist + minColor * float(minDist < .055), 1.0);
}
`;

function createSitesSVG(canvas, sites) {
    // Remove previous SVG if present
    const prev = document.getElementById('voronoi-sites-svg');
    if (prev) prev.remove();

    const width = canvas.width;
    const height = canvas.height;

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'voronoi-sites-svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.style.position = 'absolute';
    svg.style.left = 0 + 'px';
    svg.style.pointerEvents = 'auto'; // Enable pointer events for dragging
    svg.style.zIndex = 10;

    // Map normalized coordinates to pixel positions
    sites.forEach(site => {
        // site: [x, y], both in [-1, 1]
        const cx = ((site[0] + 1) / 2) * width;
        const cy = ((1 - (site[1] + 1) / 2)) * height; // SVG y is downward
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', Math.max(8, width * 0.01));
        circle.setAttribute('fill', '#fff0');
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);
    });

    // Position SVG above canvas
    canvas.parentElement.style.position = 'relative';
    canvas.parentElement.appendChild(svg);
}

// Enables dragging of Voronoi sites (SVG circles)
function enableSiteDragging(canvas, sites, colors, onUpdate = null) {
    const svg = document.getElementById('voronoi-sites-svg');
    if (!svg) return;

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

        updateVoronoi(sites, colors);

        // Move the SVG circle only
        const circle = svg.children[draggingIdx];
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);

        if (onUpdate) onUpdate(sites, colors);
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

// Initializes WebGL, shaders, program, geometry, and draws initial Voronoi
export function initVoronoi(canvas, sites, colors) {
    gl = canvas.getContext('webgl2');
    gl.clearColor(0.05, 0.05, 0.05, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    program = createProgram(gl, vertexShader, fragmentShader);

    gl.useProgram(program);

    // Geometry setup (full screen quad)
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        -0.98, -0.98,
         0.98, -0.98,
        -0.98,  0.98,
         0.98,  0.98,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    updateVoronoi(sites, colors);

    // Create SVG overlay for sites
    createSitesSVG(canvas, sites);

    // Enable dragging by default
    enableSiteDragging(canvas, sites, colors);
}

// Updates Voronoi sites/colors and redraws
export function updateVoronoi(sites, colors) {
    if (!gl || !program) {
        console.warn('Voronoi not initialized. Call initVoronoi first.');
        return;
    }
    const u_sites = gl.getUniformLocation(program, 'u_sites');
    const u_colors = gl.getUniformLocation(program, 'u_colors');
    const u_siteCount = gl.getUniformLocation(program, 'u_siteCount');
    gl.useProgram(program);
    gl.uniform2fv(u_sites, new Float32Array(sites.flat()));
    gl.uniform3fv(u_colors, new Float32Array(colors.flat()));
    gl.uniform1i(u_siteCount, sites.length);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
}