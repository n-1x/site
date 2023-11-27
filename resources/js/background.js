const vertices = [-1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
const indices = [0, 2, 3, 0, 1, 2];

let canvas = null;
let gl = null;
let uniformTime = null;
let uniformMouse = null;
let uniformHSL = null;
let root = document.querySelector(":root");
let shaderProgram;

/* Step3: Create and compile Shader programs */
// Vertex shader source code
const vertCode = `
    attribute vec2 coordinates;
    void main(void) {
    gl_Position = vec4(coordinates,0.0, 1.0);
    }
`;

//Fragment shader source code
const fragCode = `
        precision mediump float;
        
        uniform vec2 iResolution;
        uniform vec2 iMouse;
        uniform vec3 colour;
        uniform float iTime;

        const vec2 ratio = vec2(1.73, 1.);
        const vec2 hratio = ratio * .5;
        const vec2 hex = normalize(ratio);

        float hexDist(vec2 p) {
        p = abs(p);

        float c = dot(p, hex);
        return max(c, p.y);
        }

        vec3 hexCoords(vec2 p) {
        vec2 a = mod(p, ratio) - hratio;
        vec2 b = mod(p - hratio, ratio) - hratio;
        vec3 col = vec3(0);
        
        vec2 gv = dot(a,a) < dot(b,b) ? a : b;
        float hd = hexDist(gv);
        vec2 hid = p-gv;
        return vec3(hd, hid.x, hid.y);
        }

        void main(void) {
        vec2 uv = (gl_FragCoord.xy - .5 * iResolution) / iResolution.y;
        vec2 muv = (iMouse - .5 * iResolution) / iResolution.y;
        
        const float scale = 8.;
        vec3 c = hexCoords(uv * scale);
        vec3 mc = hexCoords(muv * scale);

        vec2 mth = c.yz - mc.yz;
        float distSq = dot(mth,mth);

        float l = .3 + .1 * sin(distSq*0.1 - iTime*1.2);
        float brightness = smoothstep(0.49, 0.5, c.x) * l;
        vec3 col = colour * max(0.05,brightness);

        gl_FragColor = vec4(col, 1.);
        }
    `;

function checkLinkStatusAndDraw(vs, fs) {
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error(`Link failed: ${gl.getProgramInfoLog(shaderProgram)}`);
        console.error(`vs info-log: ${gl.getShaderInfoLog(vs)}`);
        console.error(`fs info-log: ${gl.getShaderInfoLog(fs)}`);
    }
    else {
        renderInit();
    }
}

function startWebGL() {
    gl = canvas.getContext('webgl');
    shaderProgram = gl.createProgram()

    const ext = gl.getExtension("KHR_parallel_shader_compile");
    const vs = gl.createShader(gl.VERTEX_SHADER);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vs, vertCode);
    gl.shaderSource(fs, fragCode);

    gl.compileShader(vs);
    gl.compileShader(fs);

    gl.attachShader(shaderProgram, vs);
    gl.attachShader(shaderProgram, fs);

    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    if (ext) {
        if (gl.getProgramParameter(shaderProgram, ext.COMPLETION_STATUS_KHR)) {
            checkLinkStatusAndDraw(vs, fs);
        }
    }
    else {
        checkLinkStatusAndDraw(vs, fs);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    canvas = document.createElement("canvas");
    canvas.classList.add("bgcanv");
    canvas.width = window.innerWidth;
    canvas.height = document.documentElement.scrollHeight;
    document.body.appendChild(canvas);
    startWebGL();
});

function renderInit() {
    // Create a new buffer object
    const vertex_buffer = gl.createBuffer();
    const index_buffer = gl.createBuffer();

    // Bind an empty array buffer to it
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

    // Pass the vertices data to the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Unbind the buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const uniformResolution = gl.getUniformLocation(shaderProgram, "iResolution");
    gl.uniform2f(uniformResolution, window.innerWidth, document.documentElement.scrollHeight);

    uniformTime = gl.getUniformLocation(shaderProgram, "iTime");
    gl.uniform1f(uniformTime, 0);

    uniformMouse = gl.getUniformLocation(shaderProgram, "iMouse");
    gl.uniform2f(uniformMouse, 0.0, 0.0);

    uniformHSL = gl.getUniformLocation(shaderProgram, "colour");
    const [r, g, b] = getAccentRGB();
    gl.uniform3f(uniformHSL, r, g, b);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    //Get the attribute location
    const attribCoord = gl.getAttribLocation(shaderProgram, "coordinates");
    gl.vertexAttribPointer(attribCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribCoord);

    gl.clearColor(0.5, 0.5, 0.5, 0.9);

    document.onmousemove = event => {
        gl.uniform2f(uniformMouse,
            event.clientX,
            document.documentElement.scrollHeight - event.clientY
        );
    };

    window.onresize = () => {
        canvas.width = window.innerWidth;
        canvas.height = document.documentElement.scrollHeight;
        gl.uniform2f(uniformResolution, canvas.width, canvas.height);
    };

    render();
}

// TODO: touch support (events: touchstart, touchmove)
function render() {
    const t = performance.now() / 1000.;
    gl.uniform1f(uniformTime, t);

    setAccent((Date.now() / 150) % 360);
    const [r, g, b] = getAccentRGB();
    gl.uniform3f(uniformHSL, r, g, b);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    window.requestAnimationFrame(render);
}

function hueToRGB(m1, m2, h) {
    if (h < 0.) {
        h++;
    }
    else if (h > 1.) {
        h--;
    }

    let result = m1;

    if (h * 6. < 1.) {
        result = m1 + (m2 - m1) * h * 6.;
    }
    else if (h * 2. < 1.) {
        result = m2;
    }
    else if (h * 3. < 2.) {
        result = m1 + (m2 - m1) * (2. / 3. - h) * 6.;
    }

    return result;
}

function hslToRGB(h, s, l) {
    let m1, m2;

    if (l <= 0.5) {
        m2 = l * (s + 1.);
    }
    else {
        m2 = l + s - l * s;
    }

    m1 = l * 2. - m2;

    const r = hueToRGB(m1, m2, h + 1. / 3.);
    const g = hueToRGB(m1, m2, h);
    const b = hueToRGB(m1, m2, h - 1. / 3.);

    return [r, g, b];
}

function getAccentRGB() {
    const style = getComputedStyle(root);
    const hue = style.getPropertyValue("--accent-hue");
    const sat = parseInt(style.getPropertyValue("--accent-sat"));

    return hslToRGB(hue / 360., sat / 100., 0.5);
}

function setAccent(hue) {
    root.style.setProperty("--accent-hue", hue.toString());
}