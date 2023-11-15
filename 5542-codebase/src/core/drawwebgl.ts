// import { initFragmentShader, initVertexShader } from "@/utils/shaderUtils";
// import { getInverseProjectionMatrix, getProjectionMatrix} from "@/utils/matrix"
// import type { TAllowedShape } from "./setup-lab3"
// import type { TCoordSpaceLayout } from "@/utils/matrix"

// // addShape, drawScene, init, clearCanvas

// const canvasSpaceLayout: TCoordSpaceLayout = {
//     xMin: -700,
//     xMax: 700,
//     yMin: -350,
//     yMax: 350
// }

// const vertexShader = /* glsl */ `
//     precision  lowp  float; 
//     attribute vec3 a_position; 
//     attribute vec4 a_color;  
//     uniform mat4 ProjectMat; 
//     varying vec4 v_color;    
//     void main() {
//         v_color = a_color;
//         gl_Position = ProjectMat * vec4(a_position, 1.0); 
//         gl_PointSize = 10.0;
//     }
// `

// const fragmentShader = /* glsl */ `
//     precision mediump float; 
//     varying vec4 v_color;
//     void main() {
//         gl_FragColor = v_color; // set all fragments to red
//     }
// `

// interface drawCommand {
//     shape: TAllowedShape,
//     offset: number,
//     count: number
// }




// let canvas: HTMLCanvasElement;
// let webgl: WebGLRenderingContext;
// let fragmentShaderObject: WebGLShader;
// let vertexShaderObject: WebGLShader;
// let programObject: WebGLProgram;
// let triangleBuffer: WebGLBuffer;
// let jsArrayData: number[] = []
// let numberOfPoints = 0

// let programObj: programObj; 

// export function addShape(centerPoint: number[], shape: TAllowedShape, color: number[]) {
//     console.log("logging: addShape", centerPoint, shape, color)
//     const mappedCenterPoint = htmlCoordToWebglCoord(centerPoint, [canvas.width, canvas.height], canvasSpaceLayout)
//     switch (shape) {
//         case "point":
//             addPoint(mappedCenterPoint, color,)
//             break;
//         case "triangle":
//             addTriangle(mappedCenterPoint, color, 40)
//             break
//         case "square":
//             addSquare(mappedCenterPoint, color, 40)
//             break
//         case "vertical-line":
//             addVerticalLine(mappedCenterPoint, color, 40)
//             break
//         case "horizontal-line":
//             addHorizontalLine(mappedCenterPoint, color, 40)
//             break
//         case "circle":
//             addCircle(mappedCenterPoint, color, 40)
//             break
//         default:
//             break;
//     }

//     updateDataBuffers()
//     drawScene()
// }

// export function init(canvasEl: HTMLCanvasElement) {
//     canvas = canvasEl
//     initWebGL()
//     initShader()
//     initProgram()
//     initBuffers()
//     drawScene()
// }

// export function clearCanvas() {
//     console.log("clearCanvas")
//     webgl.clearColor(0.0, 0.0, 0.0, 1.0);
//     webgl.clear(webgl.COLOR_BUFFER_BIT);
//     jsArrayData.length = 0
//     drawingCommands.length = 0
//     numberOfPoints = 0
// }


// function initWebGL() {
//     webgl = canvas.getContext('webgl') as WebGLRenderingContext;
//     if (!webgl) {
//         alert("Webgl is not available in your browser")
//         return
//     }
//     resizeCanvasToMatchDisplaySize(canvas);
//     webgl.viewport(0, 0, canvas.width, canvas.height);
//     webgl.clearColor(0.0, 0.0, 0.0, 1.0);
//     webgl.clear(webgl.COLOR_BUFFER_BIT);
//     console.log("init!")
// }

// function resizeCanvasToMatchDisplaySize(canvas: HTMLCanvasElement) {
//     canvas.width = canvas.clientWidth;
//     canvas.height = canvas.clientHeight;
//     webgl.viewport(0, 0, canvas.width, canvas.height);
// }

// function initShader() {
//     vertexShaderObject = initVertexShader(vertexShader, webgl)!
//     fragmentShaderObject = initFragmentShader(fragmentShader, webgl)!
// }

// function initProgram() {
//     programObject = webgl.createProgram()
//     webgl.attachShader(programObject, vertexShaderObject)
//     webgl.attachShader(programObject, fragmentShaderObject)
//     webgl.linkProgram(programObject)
//     webgl.useProgram(programObject)
// }

// function initBuffers() {
//     triangleBuffer = webgl.createBuffer()!
//     webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer)
//     webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(jsArrayData), webgl.STATIC_DRAW)
// }

// function updateDataBuffers() {
//     webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer)
//     webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(jsArrayData), webgl.STATIC_DRAW)
// }

// function getWebglShape(shape: TAllowedShape, webgl: WebGLRenderingContext) {
//     switch (shape) {
//         case "point":
//             return webgl.POINTS
//         case "triangle":
//             return webgl.TRIANGLES
//         case "square":
//             return webgl.TRIANGLE_FAN
//         case "vertical-line":
//             return webgl.LINES
//         case "horizontal-line":
//             return webgl.LINES
//         case "circle":
//             return webgl.TRIANGLE_FAN
//         default:
//             return webgl.POINTS
//     }
// }

// export function drawScene() {
//     const a_position = webgl.getAttribLocation(programObject, "a_position")
//     const v4InColorIndex = webgl.getAttribLocation(programObject, 'a_color')

//     const uProjectMat = webgl.getUniformLocation(programObject, "ProjectMat");
//     const ProjectMat = getProjectionMatrix(canvasSpaceLayout)
//     webgl.uniformMatrix4fv(uProjectMat, false, ProjectMat);

//     webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer)
//     webgl.enableVertexAttribArray(a_position)
//     webgl.vertexAttribPointer(a_position, 3, webgl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 0)
//     webgl.enableVertexAttribArray(v4InColorIndex)
//     webgl.vertexAttribPointer(v4InColorIndex, 4, webgl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT)
//     webgl.clearColor(0.0, 0.0, 0.0, 1.0);
//     webgl.clear(webgl.COLOR_BUFFER_BIT);
//     drawingCommands.forEach((command) => {
//         webgl.drawArrays(getWebglShape(command.shape, webgl), command.offset, command.count);
//     })
// }

// function htmlCoordToWebglCoord(htmlCoord: number[], containerSize: number[], canvasSpaceLayout: TCoordSpaceLayout) {
//     const mappedX = htmlCoord[0] / containerSize[0] * 2 - 1
//     const mappedY = 1 - htmlCoord[1] / containerSize[1] * 2
//     const inverseProjectMat = getInverseProjectionMatrix(canvasSpaceLayout)
//     return [inverseProjectMat[0] * mappedX + inverseProjectMat[12], inverseProjectMat[5] * mappedY + inverseProjectMat[13]]
// }

// function addPoint(centerPoint: number[], color: number[]) {
//     const newCenterPoint = [centerPoint[0], centerPoint[1]]
//     jsArrayData.push(...newCenterPoint, 0.0, ...color)
//     drawingCommands.push({
//         shape: "point",
//         offset: numberOfPoints,
//         count: 1
//     })
//     numberOfPoints++
// }

// function addTriangle(centerPoint: number[], color: number[], radius: number = 0.3) {
//     const newCenterPoint = [centerPoint[0], centerPoint[1]]
//     const topPoint = [newCenterPoint[0], newCenterPoint[1] + radius / Math.sqrt(3)]
//     const leftPoint = [newCenterPoint[0] - radius / 2, newCenterPoint[1] - radius / (2 * Math.sqrt(3))]
//     const rightPoint = [newCenterPoint[0] + radius / 2, newCenterPoint[1] - radius / (2 * Math.sqrt(3))]
//     jsArrayData.push(...topPoint, 0.0, ...color)
//     jsArrayData.push(...leftPoint, 0.0, ...color)
//     jsArrayData.push(...rightPoint, 0.0, ...color)
//     drawingCommands.push({
//         shape: "triangle",
//         offset: numberOfPoints,
//         count: 3
//     })
//     numberOfPoints += 3
// }

// function addSquare(centerPoint: number[], color: number[], radius: number = 0.3) {
//     const newCenterPoint = [centerPoint[0], centerPoint[1]]
//     const bottomRightPoint = [newCenterPoint[0] + radius / 2, newCenterPoint[1] - radius / 2]
//     const bottomLeftPoint = [newCenterPoint[0] - radius / 2, newCenterPoint[1] - radius / 2]
//     const topRightPoint = [newCenterPoint[0] + radius / 2, newCenterPoint[1] + radius / 2]
//     const topLeftPoint = [newCenterPoint[0] - radius / 2, newCenterPoint[1] + radius / 2]
//     jsArrayData.push(...bottomRightPoint, 0.0, ...color)
//     jsArrayData.push(...topRightPoint, 0.0, ...color)
//     jsArrayData.push(...topLeftPoint, 0.0, ...color)
//     jsArrayData.push(...topLeftPoint, 0.0, ...color)
//     jsArrayData.push(...bottomLeftPoint, 0.0, ...color)
//     jsArrayData.push(...bottomRightPoint, 0.0, ...color)
//     drawingCommands.push({
//         shape: "square",
//         offset: numberOfPoints,
//         count: 6
//     })
//     numberOfPoints += 6
// }

// function addVerticalLine(centerPoint: number[], color: number[], radius: number = 0.3) {
//     const newCenterPoint = [centerPoint[0], centerPoint[1]]
//     const topPoint = [newCenterPoint[0], newCenterPoint[1] + radius / 2]
//     const bottomPoint = [newCenterPoint[0], newCenterPoint[1] - radius / 2]
//     jsArrayData.push(...bottomPoint, 0.0, ...color)
//     jsArrayData.push(...topPoint, 0.0, ...color)
//     drawingCommands.push({
//         shape: "vertical-line",
//         offset: numberOfPoints,
//         count: 2
//     })
//     numberOfPoints += 2
// }


// function addHorizontalLine(centerPoint: number[], color: number[], radius: number = 0.3) {
//     const newCenterPoint = [centerPoint[0], centerPoint[1]]
//     const leftPoint = [newCenterPoint[0] - radius / 2, newCenterPoint[1]]
//     const rightPoint = [newCenterPoint[0] + radius / 2, newCenterPoint[1]]
//     jsArrayData.push(...leftPoint, 0.0, ...color)
//     jsArrayData.push(...rightPoint, 0.0, ...color)
//     drawingCommands.push({
//         shape: "horizontal-line",
//         offset: numberOfPoints,
//         count: 2
//     })
//     numberOfPoints += 2
// }

// function addCircle(centerPoint: number[], color: number[], radius: number = 0.3) {
//     const segments = 100;
//     // Starting with the center point
//     jsArrayData.push(centerPoint[0], centerPoint[1], 0.0, ...color)
//     for (let i = 0; i <= segments; i++) {
//         let theta = (i / segments) * 2 * Math.PI;
//         let x = (radius / 2 * Math.cos(theta) + centerPoint[0]);
//         let y = (radius / 2 * Math.sin(theta) + centerPoint[1]);
//         jsArrayData.push(x, y, 0.0, ...color);
//     }
//     drawingCommands.push({
//         shape: "circle",
//         offset: numberOfPoints,
//         count: segments + 2
//     })
//     numberOfPoints += (segments + 2)
// }