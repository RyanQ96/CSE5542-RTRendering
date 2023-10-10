import { initFragmentShader, initVertexShader } from "@/utils/shaderUtils";
import { matmul, getInverseProjectionMatrix, getProjectionMatrix, getInverseRotateMatrix, getInverseScaleMatrix, matv } from "@/utils/matrix"
import type { TAllowedShape, TAllowedColor } from "./setup-lab2"
import { selectedShape, globalMode, colorMapping } from "./setup-lab2"
import type { TCoordSpaceLayout } from "@/utils/matrix"
import { globalInstance, Circle, Triangle, HorizentalLine, VerticalLine, Square, Point, HObj } from "@/utils/hierarchymodel"

// addShape, drawScene, init, clearCanvas

const canvasSpaceLayout: TCoordSpaceLayout = {
    xMin: -700,
    xMax: 700,
    yMin: -350,
    yMax: 350
}

const vertexShader = /* glsl */ `
    precision  lowp  float; 
    attribute vec3 v3Position; 
    attribute vec4 v4InColor;  
    uniform mat4 ProjectMat; 
    uniform mat4 TransformMat; 
    varying vec4 v4OutColor;    
    void main() {
        v4OutColor = v4InColor;
        gl_Position = ProjectMat * TransformMat * vec4(v3Position, 1.0); 
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

interface drawCommand {
    shape: TAllowedShape,
    offset: number,
    count: number,
    matrix: Float32Array
}

let canvas: HTMLCanvasElement;
let webgl: WebGLRenderingContext;
let fragmentShaderObject: WebGLShader;
let vertexShaderObject: WebGLShader;
let programObject: WebGLProgram;
let triangleBuffer: WebGLBuffer;
let jsArrayData: number[] = []
// let drawingCommands: drawCommand[] = []

let lastObjectOfInterest: HObj | null = null

export function enterGlobalMode() {
    globalMode.value = true; 
    lastObjectOfInterest = globalInstance.objectOfInterest
    globalInstance.setObjectOfInterest(null)
    drawScene()
}

export function exitGlobalMode() {
    globalMode.value = false;
    globalInstance.setObjectOfInterest(lastObjectOfInterest) 
    drawScene()
}

export function detectCandidateObjectOfInterest(centerPoint: number[]) {
    const mappedCenterPoint = htmlCoordToWebglCoord(centerPoint, [canvas.width, canvas.height], canvasSpaceLayout)
    globalInstance.detectCandidateObjectOfInterest(mappedCenterPoint)
    drawScene()
}

export function scaleUpObjectOfInterest() {
    console.log(globalMode.value)
    if (globalMode.value) {
        globalInstance.scale(1.2, 1.2)
    } else {
        globalInstance.objectOfInterest?.scale(1.2, 1.2)
    }
    drawScene()
}

export function scaleDownObjectOfInterest() {
    if (globalMode.value) {
        globalInstance.scale(0.8, 0.8)
    } else {
        globalInstance.objectOfInterest?.scale(0.8, 0.8)
    }
    drawScene()
}

export function changeObjectOfInterestColor(color: TAllowedColor) {
    if (!globalMode.value && globalInstance.objectOfInterest) {
        (globalInstance.objectOfInterest as any).initializeData(colorMapping[color])
    }
    drawScene()
}

export function confirmObjectOfInterest() {
    if (globalInstance.candidateObjectOfInterest) {
        globalInstance.setObjectOfInterest(globalInstance.candidateObjectOfInterest)
        globalInstance.candidateObjectOfInterest = null
        selectedShape.value = globalInstance.objectOfInterest?.objectType as TAllowedShape
        drawScene()
        return true 
    }
    return false 
}

export function addShape(centerPoint: number[], shape: TAllowedShape, color: number[]) {
    console.log("logging: addShape", centerPoint, shape, color)
    const mappedCenterPoint = htmlCoordToWebglCoord(centerPoint, [canvas.width, canvas.height], canvasSpaceLayout)
    globalInstance.objectOfInterest?.translate(mappedCenterPoint)
    drawScene()
}

export function rotateShape(target: HObj, theta: number) {
    target.rotate(theta)
    drawScene()
}

export function rotateGlobal(theta: number) {
    globalInstance.rotate(theta)
    drawScene()
}


export function init(canvasEl: HTMLCanvasElement, reInit = true) {
    canvas = canvasEl
    if (reInit) initShape() 
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
    // drawingCommands.length = 0
}


function initWebGL() {
    webgl = canvas.getContext('webgl') as WebGLRenderingContext;
    if (!webgl) {
        alert("Webgl is not available in your browser")
        return
    }
    resizeCanvasToMatchDisplaySize(canvas);
    webgl.viewport(0, 0, canvas.width, canvas.height);
    webgl.clearColor(0.0, 0.0, 0.0, 1.0);
    webgl.clear(webgl.COLOR_BUFFER_BIT);
    console.log("init!")
}

function resizeCanvasToMatchDisplaySize(canvas: HTMLCanvasElement) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    webgl.viewport(0, 0, canvas.width, canvas.height);
}

function initShape() {
    new Circle([-650, 300])
    new Triangle([-550, 298])
    new Square([-450, 300])
    new HorizentalLine([-350, 300])
    new VerticalLine([-250, 300])
    new Point([-150, 300]) 
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
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array([]), webgl.STATIC_DRAW)
}

function updateDataBuffers(jsArrayData: number[]) {
    webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer)
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(jsArrayData), webgl.STATIC_DRAW)
}

function getWebglShape(shape: TAllowedShape, webgl: WebGLRenderingContext) {
    switch (shape) {
        case "point":
            return webgl.POINTS
        case "triangle":
            return webgl.TRIANGLES
        case "square":
            return webgl.TRIANGLE_FAN
        case "vertical-line":
            return webgl.LINES
        case "horizontal-line":
            return webgl.LINES
        case "circle":
            return webgl.TRIANGLE_FAN
        default:
            return webgl.POINTS
    }
}


export function setShapeObjectsFromGlobal(shape: TAllowedShape) {
    const candidates = globalInstance.children.filter(d => d.objectType === shape)
    globalInstance.setObjectOfInterest(candidates[0])
    drawScene()
}


export function drawScene() {
    const {drawingData, drawingCommands} = globalInstance.render() 
    updateDataBuffers(drawingData)
    const v3Position = webgl.getAttribLocation(programObject, "v3Position")
    const v4InColorIndex = webgl.getAttribLocation(programObject, 'v4InColor')

    const uProjectMat = webgl.getUniformLocation(programObject, "ProjectMat");
    const ProjectMat = getProjectionMatrix(canvasSpaceLayout)
    webgl.uniformMatrix4fv(uProjectMat, false, ProjectMat);

    webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer)
    webgl.enableVertexAttribArray(v3Position)
    webgl.vertexAttribPointer(v3Position, 3, webgl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 0)
    webgl.enableVertexAttribArray(v4InColorIndex)
    webgl.vertexAttribPointer(v4InColorIndex, 4, webgl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT)
    webgl.clearColor(0.0, 0.0, 0.0, 1.0);
    webgl.clear(webgl.COLOR_BUFFER_BIT);

    drawingCommands.forEach((command: drawCommand) => {
        const uProjectMat = webgl.getUniformLocation(programObject, "TransformMat");
        webgl.uniformMatrix4fv(uProjectMat, false, command.matrix);
        webgl.drawArrays(getWebglShape(command.shape, webgl), command.offset, command.count);
    })
}

function htmlCoordToWebglCoord(htmlCoord: number[], containerSize: number[], canvasSpaceLayout: TCoordSpaceLayout) {
    const mappedX = htmlCoord[0] / containerSize[0] * 2 - 1
    const mappedY = 1 - htmlCoord[1] / containerSize[1] * 2
    const inverseProjectMat = getInverseProjectionMatrix(canvasSpaceLayout)
    const inverseScaleMatrix = getInverseScaleMatrix(globalInstance.scaleTotal, globalInstance.scaleTotal)
    const inverseRotateMatrix = getInverseRotateMatrix(globalInstance.rotateTotal)
    const inverseTransformMat = matmul(inverseScaleMatrix, inverseRotateMatrix, inverseProjectMat)
    // return [inverseTransformMat[0] * mappedX + inverseTransformMat[12], inverseTransformMat[5] * mappedY + inverseTransformMat[13]]
    return Array.from(matv(inverseTransformMat, new Float32Array([mappedX, mappedY, 0, 1]))).slice(0, 2)
}
