document.querySelector('h1').textContent = 'Hello, Universe!';
// canvas setup
const canvas = document.getElementById('canvas');
// simple webgl setup
const gl = canvas.getContext('webgl');
gl.clearColor(0.4, 0.2, 0.3, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
console.log('WebGL context initialized');
// basic quad shading setup
// fragment shader color is based on vertex position
const vertexShaderSource = `
attribute vec4 a_position;
varying vec2 v_pos;
void main() {
    gl_Position = a_position;
    v_pos = a_position.xy;
}
`;
const fragmentShaderSource = `
precision mediump float;
varying vec2 v_pos;
void main() {
    // Map position from [-0.5, 0.5] to [0, 1] for color
    vec2 colorPos = v_pos + 0.5;
    gl_FragColor = vec4(colorPos.x, colorPos.y, 0.5, 1.0);
}
`;
// compile shaders
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
// create program
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
}
const program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);

// set up geometry
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [
    -0.5, -0.5,
     0.5, -0.5,
    -0.5,  0.5,
     0.5,  0.5,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
const positionLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
// draw
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
console.log('Quad drawn on canvas');
