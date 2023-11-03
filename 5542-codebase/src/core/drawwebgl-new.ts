declare var mat4: any

import { initFragmentShader, initVertexShader } from "@/utils/shaderUtils";
import { matmul, getInverseProjectionMatrix, getPerspectiveProjectionMatrix, getInverseRotateMatrix, getInverseScaleMatrix, matv, getViewMatrix } from "@/utils/matrix"
import type { TAllowedShape, TAllowedColor } from "./setup-lab3"
import { selectedShape, globalMode, colorMapping } from "./setup-lab3"
import type { TCoordSpaceLayout } from "@/utils/matrix"
import { globalInstance, HObj, Cylinder, Cube, Sphere, Global } from "@/utils/hierarchymodel"
import { ref } from "vue";

// addShape, drawScene, init, clearCanvas

// export let angle_x = ref(0.5); // in degrees
// export let angle_y = ref(0.26); // in degrees 

// export let angle_x = ref(-0.11); // in degrees
// export let angle_y = ref(0.312); // in degrees 

export let angle_x = ref(-0.0579); // in degrees
export let angle_y = ref(0.25099); // in degrees 

let targetShapeOfMove: HObj | null = null

const cameraDistance = ref(4);

export let cameraFreeMode = ref(false)

export let yaw = ref(0)
export let pitch = ref(-5)
export let roll = ref(0)

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
    uniform mat4 viewMatrix;
    varying vec4 v4OutColor;    
    void main() {
        v4OutColor = v4InColor;
        gl_Position = ProjectMat * viewMatrix * TransformMat * vec4(v3Position, 1.0); 
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
    matrix: Float32Array,
    vertices: number[],
    indices: number[]
}

let canvas: HTMLCanvasElement;
let webgl: WebGLRenderingContext;
let fragmentShaderObject: WebGLShader;
let vertexShaderObject: WebGLShader;
let programObject: WebGLProgram;
let triangleBuffer: WebGLBuffer;
let jsArrayData: number[] = []


let ProjectMat: Float32Array;
// let drawingCommands: drawCommand[] = []

let lastObjectOfInterest: HObj | null = null


export function toggleCameraFreeMode() {
    cameraFreeMode.value = !cameraFreeMode.value
    drawScene()
}

export function zoomInOutCamera(amount: number){
    cameraDistance.value += amount
    drawScene()
}


export function changeYaw(value: number) {
    yaw.value += value
    drawScene()
}

export function changePitch(value: number) {
    pitch.value += value
    drawScene()
}

export function changeRoll(value: number) {
    roll.value += value
    drawScene()
}

export function moveTargetObjectLeft() {
    targetShapeOfMove?.translateDelta([-0.05, 0, 0])
    drawScene()
}

export function moveTargetObjectRight() {
    targetShapeOfMove?.translateDelta([0.05, 0, 0])
    drawScene()
}

export function moveTargetObjectForward() {
    targetShapeOfMove?.translateDelta([0, 0, 0.05])
    drawScene()
}

export function moveTargetObjectBack() {
    targetShapeOfMove?.translateDelta([0, 0, -0.05])
    drawScene()
}

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

export function changeCameraRedraw() {
    drawScene()
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
    webgl.enable(webgl.DEPTH_TEST);
    console.log("init!")
    ProjectMat = getPerspectiveProjectionMatrix(canvas);
}   

function resizeCanvasToMatchDisplaySize(canvas: HTMLCanvasElement) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    webgl.viewport(0, 0, canvas.width, canvas.height);
}

function initShape() {

    const bot = new Cylinder(0.4, 0.4, 0.05, 300, 100, [0.89, 0.6941, 0.5725, 1]);
    bot.translateDelta([0, -0.55, 0])


    const feet = new Cylinder(0.1, 0.1, 1.2, 300, 100, [0.89, 0.6941, 0.5725, 1], bot);
    feet.translateDelta([0, 0.05, 0])

    const tableSurface = new Cylinder(1.5, 1.5, 0.07, 300, 100, [0.89, 0.6941, 0.5725, 1], feet);
    tableSurface.translateDelta([0, 1.2, 0])

    const sphere = new Sphere(0.2, 30, 30, [1, 0, 0, 1], tableSurface);
    sphere.translateDelta([0.8, 0.07 + 0.2, 0])

    const cube = new Cube(0.5, [0.3, 0.2, .8, .2], tableSurface);
    cube.translateDelta([-0, 0.07 + 0.25, -0])


    const cubeA = new Cube(0.3, [0.1, 0.4, .2, .2], cube);
    cubeA.translateDelta([-0.46, -0.05, 0])
    cubeA.rotate(4)

    const sphereS = new Sphere(0.05, 30, 30, [1, 0, 0, 1], cube);
    sphereS.translateDelta([-0.59, -0.25 + 0.05, 0])

    
    const cube2 = new Cube(0.3, [0.4, 0.4, .2, .2], cube);
    cube2.translateDelta([0, 0.25 + 0.15, 0])

    const sphere2 = new Sphere(0.1, 30, 30, [0.6, 0.24, 0.44, 0.6], cube2);
    sphere2.translateDelta([0, 0.15 + 0.1, 0])

    targetShapeOfMove = cube

    const virtualAlbum = new Global([0,0,0], tableSurface);    
    virtualAlbum.translateDelta([0.2, 0, 0])
    virtualAlbum.rotateY(.01)


    const ablumfeet = new Cube(0.3, [0.23, 0.1686, .18, .2], virtualAlbum);
    ablumfeet.translateDelta([0, 0.07 + 0.2, 1])
    ablumfeet.scale(.15, 1.7, .15)
    ablumfeet.rotateX(.5)

    
    const ablumfeet2 = new Cube(0.3, [0.23, 0.1686, .18, .2], virtualAlbum);
    ablumfeet2.translateDelta([0.4, 0.07 + 0.2, 1])
    ablumfeet2.scale(.15, 1.7, .15)
    ablumfeet2.rotateX(.5)


    const ablumfeet3 = new Cube(0.3, [0.23, 0.1686, .18, .2], virtualAlbum);
    ablumfeet3.translateDelta([0.2, 0.08, 1.1])
    ablumfeet3.scale(1.2, .15, .15)


    const ablumfeet4 = new Cube(0.3, [0.23, 0.1686, .18, .2], virtualAlbum);
    ablumfeet4.translateDelta([0.2, 0.467, 0.895])
    ablumfeet4.scale(1.2, .15, .15)


    const ablumBackground = new Cube(0.3, [1, 1, 1, .2], virtualAlbum);
    ablumBackground.translateDelta([0.2, 0.28, 1.0])
    ablumBackground.scale(1.2, 1.5, .02)
    ablumBackground.rotateX(.5)


    const ablumbackfeet = new Cube(0.3, [0.23, 0.1686, .18, .2], virtualAlbum);
    ablumbackfeet.translateDelta([0.2, 0.15, 0.92])
    ablumbackfeet.scale(0.3, 0.98, .08)
    ablumbackfeet.rotateX(-.3)
   
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




export function setShapeObjectsFromGlobal(shape: TAllowedShape) {
    const candidates = globalInstance.children.filter(d => d.objectType === shape)
    globalInstance.setObjectOfInterest(candidates[0])
    drawScene()
}


export function drawScene() {

    const { drawingCommands, indicesData } = globalInstance.render()
    // updateDataBuffers(drawingData)
    console.log(indicesData)
    const v3Position = webgl.getAttribLocation(programObject, "v3Position")
    const v4InColorIndex = webgl.getAttribLocation(programObject, 'v4InColor')

    const uProjectMat = webgl.getUniformLocation(programObject, "ProjectMat");
    // const ProjectMat = getFrustumProjectionMatrix(canvasSpaceLayout);

    // console.log(ProjectMat)
    webgl.uniformMatrix4fv(uProjectMat, false, ProjectMat);
    // console.log(ProjectMat)

    let eye = [0, 1, 4];  // Adjust this as needed
    const center = [0, 0, 0];
    const up = [0, 1, 0];

    let viewMatrix: Float32Array | null = null; 
    if (cameraFreeMode.value) {
        console.log(angle_x.value, angle_y.value)
        let ex = Math.sin(angle_x.value) * cameraDistance.value;
        let ez = Math.cos(angle_x.value * 2) * cameraDistance.value;
        let ey = Math.sin(angle_y.value) * cameraDistance.value;
        let dist = Math.sqrt(ex * ex + ey * ey + ez * ez);
        ex = (ex / dist) * cameraDistance.value;
        ey = (ey / dist) * cameraDistance.value;
        ez = (ez / dist) * cameraDistance.value;

        eye = [ex, ey, ez];
        viewMatrix = mat4.lookAt(mat4.create(), eye, center, up);
    } else {
        viewMatrix = getViewMatrix(yaw.value, pitch.value, roll.value, eye);
    }


    const uViewMat = webgl.getUniformLocation(programObject, "viewMatrix");
    webgl.uniformMatrix4fv(uViewMat, false, viewMatrix as any);


    webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer)
    webgl.enableVertexAttribArray(v3Position)
    webgl.vertexAttribPointer(v3Position, 3, webgl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 0)
    webgl.enableVertexAttribArray(v4InColorIndex)
    webgl.vertexAttribPointer(v4InColorIndex, 4, webgl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT)

    
    webgl.clearColor(0.9, 0.9, 0.9, 1);
    webgl.clear(webgl.COLOR_BUFFER_BIT);

    drawingCommands.forEach((command: drawCommand) => {
        updateDataBuffers(command.vertices)
        const indexBuffer = webgl.createBuffer();
        webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, new Uint16Array(command.indices), webgl.STATIC_DRAW);
        webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, indexBuffer)
        console.log(command)
        const uProjectMat = webgl.getUniformLocation(programObject, "TransformMat");
        webgl.uniformMatrix4fv(uProjectMat, false, command.matrix);
        webgl.drawElements(webgl.TRIANGLES, command.count, webgl.UNSIGNED_SHORT, 0)
    })
}

function htmlCoordToWebglCoord(htmlCoord: number[], containerSize: number[], canvasSpaceLayout: TCoordSpaceLayout) {
    const mappedX = htmlCoord[0] / containerSize[0] * 2 - 1
    const mappedY = 1 - htmlCoord[1] / containerSize[1] * 2
    const inverseProjectMat = getInverseProjectionMatrix(canvasSpaceLayout)
    const inverseScaleMatrix = getInverseScaleMatrix(globalInstance.scaleTotal, globalInstance.scaleTotal)
    const inverseRotateMatrix = getInverseRotateMatrix(globalInstance.rotateTotal)
    const inverseTransformMat = matmul(inverseScaleMatrix, inverseRotateMatrix, inverseProjectMat)
    return Array.from(matv(inverseTransformMat, new Float32Array([mappedX, mappedY, 0, 1]))).slice(0, 2)
}
