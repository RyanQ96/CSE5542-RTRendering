declare var mat4: any

import { initFragmentShader, initVertexShader, createAttributeSetters, createUniformSetters } from "@/utils/webglUtils";
import { matmul, getInverseProjectionMatrix, getPerspectiveProjectionMatrix, getInverseRotateMatrix, getInverseScaleMatrix, matv, getViewMatrix } from "@/utils/matrix"
import type { TAllowedShape, TAllowedColor } from "./setup-lab3"
import { selectedShape, globalMode, colorMapping } from "./setup-lab3"
import type { TCoordSpaceLayout } from "@/utils/matrix"
import { globalInstance, HObj, Cylinder, Cube, Sphere, Global } from "@/utils/hierarchymodel"
import { createOBJ } from "@/utils/obj";
import { ref, watch } from "vue";
import { setUniforms } from "@/utils/objUtils"

// addShape, drawScene, init, clearCanvas

// export let angle_x = ref(0.5); // in degrees
// export let angle_y = ref(0.26); // in degrees 

// export let angle_x = ref(-0.11); // in degrees
// export let angle_y = ref(0.312); // in degrees 

export let angle_x = ref(-0.0579); // in degrees
export let angle_y = ref(0.25099); // in degrees 

let targetShapeOfMove: HObj | null = null

const cameraDistance = ref(4);

export let cameraFreeMode = ref(true)

export let yaw = ref(0)
export let pitch = ref(-5)
export let roll = ref(0)

export let lightPosX = ref(0)
export let lightPosY = ref(1)
export let lightPosZ = ref(3)


export let towerRotateAngle = ref(1)


let numOfTexturesRegistered = ref(0);


export function registerTexture() {
    numOfTexturesRegistered.value += 1
}

export function finishTexture() {
    numOfTexturesRegistered.value -= 1
}

const canvasSpaceLayout: TCoordSpaceLayout = {
    xMin: -700,
    xMax: 700,
    yMin: -350,
    yMax: 350
}

const vertexShader = /* glsl */ `
    precision  lowp  float; 
    attribute vec3 a_position; 
    attribute vec4 a_color;  
    attribute vec3 a_normal;
    attribute vec3 a_tangent;
    attribute vec2 a_texcoord;

    uniform mat4 ProjectMat; 
    uniform mat4 TransformMat; 
    uniform mat4 viewMatrix;
    uniform mat4 normalMatrix; 

    uniform vec3 eye_pos; // pos of camera

    uniform vec4 light_pos; 
    uniform vec4 ambient_coef;
    uniform vec4 diffuse_coef;
    uniform vec4 specular_coef;
    uniform float mat_shininess; 

    uniform vec4 light_ambient; 
    uniform vec4 light_diffuse; 
    uniform vec4 light_specular;


    uniform bool useTexture;
    

    varying vec4 v4OutColor; 
    varying vec4 vPos; 
    varying vec2 vTextureCoord;
    varying vec3 v_normal;
    varying vec3 v_tangent; 
    varying vec3 v_surfaceToView;
    varying vec4 light_pos_in_eye; 

    void main() {

        v4OutColor = a_color;
        vPos = viewMatrix * TransformMat * vec4(a_position, 1.0);
        light_pos_in_eye = viewMatrix * light_pos;
        v_surfaceToView = normalize(-vec3(vPos));
        v_normal = normalize(vec3(normalMatrix*vec4(a_normal,0.0)));
        if (useTexture) {
            vTextureCoord = a_texcoord;
            v_tangent = a_tangent; 
        }
        gl_Position = ProjectMat * viewMatrix * TransformMat * vec4(a_position, 1.0); 
        gl_PointSize = 10.0;
    }
`

const fragmentShader = /* glsl */ `
    precision mediump float;
    uniform bool useTexture; 
    uniform sampler2D normalMap;
    uniform sampler2D diffuseMap;
    uniform sampler2D specularMap;
    
    uniform vec4 light_pos; 
    uniform vec4 ambient_coef;
    uniform vec4 diffuse_coef;
    uniform vec4 specular_coef;
    uniform float mat_shininess; 

    uniform vec4 light_ambient; 
    uniform vec4 light_diffuse; 
    uniform vec4 light_specular;    

    uniform vec3 eye_pos; // pos of camera

    varying vec4 v4OutColor;
    varying vec4 vPos; 
    varying vec2 vTextureCoord;
    varying vec3 v_normal;
    varying vec3 v_tangent; 
    varying vec3 v_surfaceToView;
    varying vec4 light_pos_in_eye;

    void main() {
        if (useTexture) {
            vec3 normal = normalize(v_normal) * ( float( gl_FrontFacing ) * 2.0 - 1.0 );
            vec3 tangent = normalize(v_tangent) * ( float( gl_FrontFacing ) * 2.0 - 1.0 );
            vec3 bitangent = normalize(cross(normal, tangent));
            mat3 tbn = mat3(tangent, bitangent, normal);
            normal = texture2D(normalMap, vTextureCoord).rgb * 2. - 1.;
            normal = normalize(tbn * normal);
            vec3 light_vector = normalize(vec3(light_pos_in_eye - vPos));
            vec3 eye_vector = normalize(v_surfaceToView);
            vec4 ambient = ambient_coef * light_ambient * .1; 
            float ndotl = max(dot(v_normal, light_vector), 0.0);

            vec4 diffuseMapColor = texture2D(diffuseMap, vTextureCoord);
            vec4 diffuse = diffuse_coef * light_diffuse * ndotl * diffuseMapColor;

            vec3 R = normalize(2.0 * ndotl *v_normal-eye_vector);
            // vec3 R= normalize(vec3(reflect(-light_vector, v_normal))); 
            float rdotv = max(dot(R, eye_vector), 0.0);

            vec4 specular;  
            if (ndotl>0.0) {
                vec4 specularMapColor = texture2D(specularMap, vTextureCoord);
                specular = specular_coef * light_specular*pow(rdotv, mat_shininess) * specularMapColor; 
                // specular = vec4(1,1,0,1);
            } else {
                specular = vec4(0,0,0,1);
            }
            // gl_FragColor = vec4(ambient);
            gl_FragColor = (specular + ambient + diffuse); // set all fragments to red
        } else {
            vec4 texColor = v4OutColor;
            vec3 light_vector = normalize(vec3(light_pos_in_eye - vPos));
            vec3 eye_vector = normalize(v_surfaceToView);
            vec4 ambient = ambient_coef * light_ambient * texColor; 
            float ndotl = max(dot(v_normal, light_vector), 0.0); 
            vec4 diffuse = diffuse_coef * light_diffuse* ndotl * texColor;
            vec3 R= normalize(vec3(reflect(-light_vector, v_normal))); 
            // vec3 R = normalize(2.0 * ndotl *v_normal-eye_vector);
            float rdotv = max(dot(R, eye_vector), 0.0);
            vec4 specular;  
            if (ndotl>0.0) {
                specular = specular_coef * light_specular * pow(rdotv, mat_shininess); 
                // diffuse = vec4(0,1,0,1) * ndotl; 
            } else {
                specular = vec4(0,0,0,1); 
                // diffuse = vec4(1,0,0,1);
            }
            gl_FragColor = specular + ambient + diffuse; // set all fragments to red
        }
    }
`

interface drawCommand {
    shape: TAllowedShape,
    offset: number,
    count: number,
    matrix: Float32Array,
    vertices: number[],
    indices: number[],
    commandFunc?: CallableFunction,
    normals?: number[]
}

interface TSetter {
    [a: string]: CallableFunction
}

export interface programContext {
    program: WebGLProgram,
    attribSetters: TSetter,
    uniformSetters: TSetter
}


let canvas: HTMLCanvasElement;
let webgl: WebGLRenderingContext;
let fragmentShaderObject: WebGLShader;
let vertexShaderObject: WebGLShader;
let programObject: WebGLProgram;
let triangleBuffer: WebGLBuffer;
let jsArrayData: number[] = []
let programContext: programContext;

let light_ambient = [1, 1, 1, 1];
let light_diffuse = [1, 1, 1, 1];
let light_specular = [1, 1, 1, 1];
// let light_pos = [0, 1, 3, 0];   // eye space position 

let mat_ambient = [0.15, 0.15, 0.15, 1];
let mat_diffuse = [1.5, 1.5, 1.5, 1];
let mat_specular = [1, 1, 1, 1];
let mat_shine = [10];



let ProjectMat: Float32Array;
// let drawingCommands: drawCommand[] = []

let lastObjectOfInterest: HObj | null = null


let lightBulbObj: HObj | null = null
export function changeLightPosX(value: number) {
    lightPosX.value += value
    lightBulbObj.translate([lightPosX.value, lightPosY.value, lightPosZ.value])
    drawScene()
}

export function changeLightPosY(value: number) {
    lightPosY.value += value
    lightBulbObj.translate([lightPosX.value, lightPosY.value, lightPosZ.value])
    drawScene()
}

export function changeLightPosZ(value: number) {
    lightPosZ.value += value
    lightBulbObj.translate([lightPosX.value, lightPosY.value, lightPosZ.value])
    drawScene()
}

export function toggleCameraFreeMode() {
    cameraFreeMode.value = !cameraFreeMode.value
    drawScene()
}

export function zoomInOutCamera(amount: number) {
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

export function rotateTargetShapeY(value: number) {
    targetShapeOfMove?.rotateY(value)
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


export async function init(canvasEl: HTMLCanvasElement, reInit = true) {
    canvas = canvasEl
    initWebGL()
    if (reInit) await initShape()
    initShader()
    initProgram()
    initBuffers()
    watch(numOfTexturesRegistered, (newVal) => {
        if (newVal === 0) {
            drawScene()
        }
    })
    // setInterval(() => {
    //     const rotateAmount = .05
    //     towerRotateAngle.value += rotateAmount; 
    //     rotateTargetShapeY(rotateAmount)
    // }, 30)
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
    // ProjectMat = getPerspectiveProjectionMatrix(canvas);
}

function resizeCanvasToMatchDisplaySize(canvas: HTMLCanvasElement) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    console.log(canvas.clientWidth, canvas.clientHeight)
    webgl.viewport(0, 0, canvas.width, canvas.height);
}

async function initShape() {

    const lightBulb = new Sphere(0.02, 30, 30, [1, 0.6, 0.2, 1]);
    lightBulb.translate([lightPosX.value, lightPosY.value, lightPosZ.value])
    lightBulbObj = lightBulb

    const bot = new Cylinder(0.4, 0.4, 0.05, 60, 100, [0.89, 0.6941, 0.5725, 1]);
    bot.translateDelta([0, -0.95, 0])

    const feet = new Cylinder(0.1, 0.1, 1.2, 60, 100, [0.89, 0.6941, 0.5725, 1], bot);
    feet.translateDelta([0, 0.05, 0])

    const tableSurface = new Cylinder(1.5, 1.5, 0.07, 60, 100, [0.89, 0.6941, 0.5725, 1], feet);
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


    const virtualAlbum = new Global([0, 0, 0], tableSurface);
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

    const towerHref = "https://webglfundamentals.org/webgl/resources/models/windmill/windmill.obj"
    const obj = await createOBJ(webgl, towerHref, tableSurface, registerTexture, finishTexture)
    // const obj = await createOBJ(webgl, towerHref)
    obj.scale(0.1, 0.1, 0.1)
    obj.translateDelta([-0.8, 0.07, 0.7])
    obj.rotateY(1)

    // targetShapeOfMove = obj

}

function initShader() {
    vertexShaderObject = initVertexShader(vertexShader, webgl)
    fragmentShaderObject = initFragmentShader(fragmentShader, webgl)
}

function initProgram() {
    programObject = webgl.createProgram()!
    webgl.attachShader(programObject, vertexShaderObject)
    webgl.attachShader(programObject, fragmentShaderObject)
    webgl.linkProgram(programObject)
    webgl.useProgram(programObject)

    const attriSetters = createAttributeSetters(webgl, programObject)
    const uniformSetters = createUniformSetters(webgl, programObject)

    programContext = {
        program: programObject,
        attribSetters: attriSetters,
        uniformSetters: uniformSetters
    }

    console.log("programContext: ", programContext)
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

    const { drawingCommands} = globalInstance.render()
    console.log(drawingCommands)
    // updateDataBuffers(drawingData)


    const uProjectMat = webgl.getUniformLocation(programObject, "ProjectMat");
    // const ProjectMat = getFrustumProjectionMatrix(canvasSpaceLayout);
    ProjectMat = getPerspectiveProjectionMatrix(canvas);
    // console.log(ProjectMat)
    webgl.uniformMatrix4fv(uProjectMat, false, ProjectMat);
    // console.log(ProjectMat)

    let eye = [0, 1, 4];  // Adjust this as needed
    const center = [0, 0, 0];
    const up = [0, 1, 0];

    let viewMatrix: Float32Array | null = null;
    if (cameraFreeMode.value) {
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

    webgl.clearColor(0.9, 0.9, 0.9, 1);
    webgl.clear(webgl.COLOR_BUFFER_BIT);
    // let light_ambient = [1, 1, 1, 1];
    // let light_diffuse = [1, 1, 1, 1];
    // let light_specular = [1, 1, 1, 1];
    // let light_pos = [0, 0, 0, 1];   // eye space position 

    // let mat_ambient = [.5, .5, .5, 1];
    // let mat_diffuse = [0.8, 0.8, 0.8, 1];
    // let mat_specular = [1, 1, 1, 1];
    // let mat_shine = [50];
    drawingCommands.forEach((command: drawCommand) => {
        let normalMatrix = mat4.create();
        mat4.identity(normalMatrix);
        mat4.multiply(normalMatrix, normalMatrix, viewMatrix);
        mat4.multiply(normalMatrix, normalMatrix, command.matrix);
        normalMatrix = mat4.inverse(normalMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        if (command.shape === "obj-general") {
            command.commandFunc(webgl, programContext, {
                ProjectMat,
                viewMatrix,
                normalMatrix,
                eye_pos: eye,
                light_ambient,
                light_diffuse,
                light_specular,
                light_pos: [lightPosX.value, lightPosY.value, lightPosZ.value, 0],
                ambient_coef: mat_ambient,
                diffuse_coef: mat_diffuse,
                specular_coef: mat_specular,
                mat_shininess: mat_shine[0],
            })
        } else {
            updateDataBuffers(command.vertices)

            const a_normal = webgl.getAttribLocation(programObject, "a_normal")
            const normalBuffer = webgl.createBuffer();
            webgl.bindBuffer(webgl.ARRAY_BUFFER, normalBuffer);
            webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(command.normals), webgl.STATIC_DRAW);

            webgl.bindBuffer(webgl.ARRAY_BUFFER, normalBuffer);
            webgl.enableVertexAttribArray(a_normal);
            webgl.vertexAttribPointer(a_normal, 3, webgl.FLOAT, false, 0, 0);

            const a_position = webgl.getAttribLocation(programObject, "a_position")
            const a_colorIndex = webgl.getAttribLocation(programObject, 'a_color')
            webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer)
            webgl.enableVertexAttribArray(a_position)
            webgl.vertexAttribPointer(a_position, 3, webgl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 0)
            webgl.enableVertexAttribArray(a_colorIndex)
            webgl.vertexAttribPointer(a_colorIndex, 4, webgl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT)
            // webgl.enableVertexAttribArray(a_normal);
            // webgl.vertexAttribPointer(a_normal, 3, webgl.FLOAT, false, 10 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT); 


            const indexBuffer = webgl.createBuffer();
            webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, new Uint16Array(command.indices), webgl.STATIC_DRAW);
            webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, indexBuffer)
            const uNormalMatrix = webgl.getUniformLocation(programObject, "normalMatrix");
            webgl.uniformMatrix4fv(uNormalMatrix, false, normalMatrix);
            const uUseTexture = webgl.getUniformLocation(programObject, "useTexture");
            webgl.uniform1i(uUseTexture, 0);
            const uProjectMat = webgl.getUniformLocation(programObject, "TransformMat");

            setUniforms(programContext, {
                eye_pos: eye,
                light_ambient,
                light_diffuse,
                light_specular,
                light_pos: [lightPosX.value, lightPosY.value, lightPosZ.value, 0],
                ambient_coef: mat_ambient,
                diffuse_coef: mat_diffuse,
                specular_coef: mat_specular,
                mat_shininess: mat_shine[0],
            })

            webgl.uniformMatrix4fv(uProjectMat, false, command.matrix);
            webgl.drawElements(webgl.TRIANGLES, command.count, webgl.UNSIGNED_SHORT, 0)
        }
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
