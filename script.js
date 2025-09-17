document.querySelector('h1').textContent = 'Hello, Universe!';
// canvas setup
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');
gl.clearColor(0.05, 0.05, 0.05, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
console.log('WebGL context initialized');

// Vertex shader
const vertexShaderSource = `
attribute vec4 a_position;
varying vec2 v_pos;
void main() {
    gl_Position = a_position;
    v_pos = a_position.xy;
}
`;

// 8 Voronoi sites
const sites = [
    [-0.3,  0.2],
    [ 0.1, -0.1],
    [ 0.4,  0.3],
    [-0.2, -0.4],
    [ 0.0,  0.5],
    [ 0.5, -0.3],
    [-0.4,  0.4],
    [ 0.3, -0.5]
];

// Fragment shader for Voronoi with grayscale snapping
const fragmentShaderSource = `
precision mediump float;
varying vec2 v_pos;
uniform vec2 u_sites[8];

vec3 indexColor(int idx) {
    float gray = float(idx) / 8.0;
    return vec3(gray, gray, gray);
}

void main() {
    float minDist = 100.0;
    int minIdx = 0;
    for (int i = 0; i < 8; ++i) {
        float d = distance(v_pos, u_sites[i]);
        if (d < minDist) {
            minDist = d;
            minIdx = i;
        }
    }
    gl_FragColor = vec4(indexColor(minIdx), 1.0);
}
`;

// Shader compilation
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(vertexShader));
}
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(fragmentShader));
}

// Program creation
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
}
const program = createProgram(gl, vertexShader, fragmentShader);
const u_sites = gl.getUniformLocation(program, 'u_sites');
gl.useProgram(program);
gl.uniform2fv(u_sites, new Float32Array(sites.flat()));

// Geometry setup
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [
    -0.95, -0.95,
     0.95, -0.95,
    -0.95,  0.95,
     0.95,  0.95,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
const positionLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// Draw
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
console.log('Quad drawn on canvas');
