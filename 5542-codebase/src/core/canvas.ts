import { initFragmentShader, initVertexShader } from "@/utils/shaderUtils";
// addShape, drawScene, init, clearCanvas

const vertexShader = /* glsl */ `
    precision  lowp  float; 
    attribute vec3 v3Position; 
    attribute vec4 v4InColor; 
    varying vec4 v4OutColor; 
    
    void main() {
        v4OutColor = v4InColor;
        gl_Position = vec4(v3Position.x, v3Position.y, v3Position.z, 1.0); 
        gl_PointSize = 10.0;
    }
`

const fragmentShader = /* glsl */ `
    precision mediump float; 
    varying vec4 v4OutColor;
    void main() {
        gl_FragColor = v4OutColor; // set all fragments to red
    }
`

let canvas: HTMLCanvasElement;
let webgl: WebGLRenderingContext;
let fragmentShaderObject: WebGLShader;
let vertexShaderObject: WebGLShader;
let programObject: WebGLProgram;
let triangleBuffer: WebGLBuffer;
let jsArrayData: number[] = [
    -0.5, 0.5, 0, 1, 0, 0, 1,
    -0.5, -0.5, 0, 0, 1, 0, 1,
    0.5, -0.5, 0, 0, 0, 1, 1,
    -0.5, 0.5, 0, 1, 0, 0, 1,
    0.5, -0.5, 0, 0, 0, 1, 1, 
    0.5, 0.5, 0, 1, 0, 0, 1
]   


export function init(canvasEl: HTMLCanvasElement) {
    canvas = canvasEl
    initWebGL()
    initShader()
    initProgram()
    initBuffers()
    drawScene()
}

export function clearCanvas() {
    console.log("clearCanvas")
    webgl.clearColor(0.0, 0.0, 0.0, 1.0);
    webgl.clear(webgl.COLOR_BUFFER_BIT);
    jsArrayData.length = 0
}


function initWebGL() {
    webgl = canvas.getContext('webgl') as WebGLRenderingContext;
    if (!webgl) {
        alert("Webgl is not available in your browser")
        return
    }
    resizeCanvasToMatchDisplaySize(canvas);
    webgl.clearColor(0.0, 0.0, 0.0, 1.0);
    webgl.clear(webgl.COLOR_BUFFER_BIT);
    console.log("init!")
}

function resizeCanvasToMatchDisplaySize(canvas: HTMLCanvasElement) {
    // canvas.width = canvas.clientWidth;
    // canvas.height = canvas.clientHeight;
    // webgl.viewport(0, 0, canvas.width, canvas.height);
    canvas.width = 1400;
    canvas.height = 700;
    webgl.viewport(0, 0, 1400, 700);
}

function initShader() {
    vertexShaderObject = initVertexShader(vertexShader, webgl)!
    fragmentShaderObject = initFragmentShader(fragmentShader, webgl)!
}

function initProgram() {
    programObject = webgl.createProgram()!
    webgl.attachShader(programObject, vertexShaderObject)
    webgl.attachShader(programObject, fragmentShaderObject)
    webgl.linkProgram(programObject)
    webgl.useProgram(programObject)
}

function initBuffers() {
    triangleBuffer = webgl.createBuffer()!
    webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer)
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(jsArrayData), webgl.STATIC_DRAW)
}


export function drawScene() {
    const v3Position = webgl.getAttribLocation(programObject, "v3Position")
    const v4InColorIndex = webgl.getAttribLocation(programObject, 'v4InColor')
    webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer)
    webgl.enableVertexAttribArray(v3Position)
    webgl.vertexAttribPointer(v3Position, 3, webgl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 0)
    webgl.enableVertexAttribArray(v4InColorIndex)
    webgl.vertexAttribPointer(v4InColorIndex, 4, webgl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT)
    webgl.clearColor(0.0, 0.0, 0.0, 1.0);
    webgl.clear(webgl.COLOR_BUFFER_BIT);
    webgl.drawArrays(webgl.TRIANGLES, 0, 6)
}