let gl = null;
let program = null;
let positionBuffer = null;
let positionLocation = null;

const vertexShaderSource = `
attribute vec4 a_position;
varying vec2 v_pos;
void main() {
    gl_Position = a_position;
    v_pos = a_position.xy;
}
`;

const fragmentShaderSource = `
precision highp float;
varying vec2 v_pos;
uniform vec2 u_sites[100];
uniform vec3 u_colors[100];
uniform int u_siteCount;

struct F1Result {
    float minDist;
    vec3 Color;
    float secondMinDist;
};

F1Result F1(vec2 p, int count) {
    float minDist = 100.0;
    vec3 minColor = vec3(0.0);
    float secondMinDist = 100.0;
    for (int i = 0; i < 100; ++i) {
        if (i >= u_siteCount) break;
        float d = distance(v_pos, u_sites[i]);
        if (d < secondMinDist) {
            if (d < minDist) {
                secondMinDist = minDist;
                minDist = d;
                minColor = u_colors[i];
            } else {
                secondMinDist = d;
            }
        }
    }
    F1Result result;
    result.minDist = minDist;
    result.Color = minColor;
    result.secondMinDist = secondMinDist;
    return result;
}

void main() {
    F1Result f1 = F1(v_pos, u_siteCount);
    float val = smoothstep(pow(f1.secondMinDist - f1.minDist, .15), 0.0, 0.3);
    gl_FragColor = vec4(f1.Color * float(val), 1.0);
}
`;

export function init(canvas) {
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
}

// Updates Voronoi sites/colors and redraws
export function update(sites, colors) {
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