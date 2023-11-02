import { ref } from "vue";
import { angle_x, angle_y, changeYaw, changePitch, changeRoll, changeCameraRedraw, addShape, rotateShape, moveTargetObjectLeft, moveTargetObjectBack, moveTargetObjectForward, moveTargetObjectRight, detectCandidateObjectOfInterest, confirmObjectOfInterest, rotateGlobal, } from "./drawwebgl-new";
import { globalInstance } from "@/utils/hierarchymodel";


export type TAllowedShape = "point" | "horizontal-line" | "vertical-line" | "circle" | "square" | "triangle" | "cylinder"
export type TAllowedColor = "red" | "green" | "blue"

export const mouseRelativeX = ref(0);
export const mouseRelativeY = ref(0);
export const selectedShape = ref<TAllowedShape>("point")
export const selectedColor = ref<TAllowedColor>("red")
export const lastMouseX = ref(0);
export const lastMouseY = ref(0);
export const rotationAngle = ref(0);
export const globalMode = ref(false);
export const inRotateStatus = ref(false)


export const shapeIconMapping = {
    "point": "mdi-vector-point",
    "horizontal-line": "mdi-minus",
    "vertical-line": "mdi-minus",
    "circle": "mdi-circle",
    "square": "mdi-square",
    "triangle": "mdi-triangle"
}

export const colorMapping = {
    "red": [1, 0, 0, 1],
    "green": [0, 1, 0, 1],
    "blue": [0, 0, 1, 1]
}

export function bindMouseEvent(container: HTMLCanvasElement) {
    container.addEventListener("mousemove", (event: MouseEvent) => {
        const { offsetX, offsetY } = event;
        mouseRelativeX.value = offsetX;
        mouseRelativeY.value = offsetY;
        detectCandidateObjectOfInterest([offsetX, offsetY])
    });
    container.addEventListener("click", (event: MouseEvent) => {
        // event.preventDefault();
        if (inRotateStatus.value) return
        if (globalMode.value) return
        if (!confirmObjectOfInterest()) {
            const { offsetX, offsetY } = event;
            addShape([offsetX, offsetY], selectedShape.value, colorMapping[selectedColor.value]);
        }
    });
    container.addEventListener("mousedown", (event: MouseEvent) => {
        event.preventDefault();
        rotationAngle.value = 0;
        const { offsetX, offsetY } = event;
        lastMouseX.value = offsetX;
        lastMouseY.value = offsetY;
        document.addEventListener("mousemove", mouseMoveRotationHandler)
        document.addEventListener("mouseup", mouseupRotationHandler)
    })
}


function mouseMoveRotationHandler(event: MouseEvent) {
    if (!inRotateStatus.value) {
        inRotateStatus.value = true
    }
    const { offsetX, offsetY } = event;
    var diffX = offsetX - lastMouseX.value;
    var diffY = offsetY - lastMouseY.value;
    lastMouseX.value = offsetX;
    lastMouseY.value = offsetY;
    if (globalMode.value) {
        rotationAngle.value = rotationAngle.value + diffX / 3000 + diffY / 3000;
        rotateGlobal(rotationAngle.value)
    } else if (globalInstance.objectOfInterest) {
        rotationAngle.value = rotationAngle.value + diffX / 1000 + diffY / 1000;
        rotateShape(globalInstance.objectOfInterest, rotationAngle.value)
    }
}

function mouseupRotationHandler() {
    document.removeEventListener("mousemove", mouseMoveRotationHandler)
    document.removeEventListener("mouseup", mouseupRotationHandler)
    if (inRotateStatus.value) {
        setTimeout(() => {
            inRotateStatus.value = false
        }, 50);
    }
}

const changeAmount = .3; 
export function bindKeyDownEvent() {
    document.addEventListener("keydown", (event: KeyboardEvent) => {
        const { key } = event;
        switch (key) {
            case "w":
                moveTargetObjectForward()
                break;
            case "a":
                moveTargetObjectLeft()
                break;
            case "s":
                moveTargetObjectBack()
                break;
            case "d":
                moveTargetObjectRight()
                break;
            case "P":
                changePitch(+changeAmount)
                break;
            case "p":
                changePitch(-changeAmount)
                break;  
            case "Y": 
                changeYaw(+changeAmount)
                break; 
            case "y":
                changeYaw(-changeAmount)
                break;
            case "R":
                changeRoll(changeAmount)
                break;         
            case "r": 
                changeRoll(-changeAmount)
                break;  
            
            // case "p":
            //     selectedShape.value = "point";
            //     setShapeObjectsFromGlobal("point")
            //     break;
            // case "h":
            //     selectedShape.value = "horizontal-line";
            //     setShapeObjectsFromGlobal("horizontal-line")
            //     break;
            // case "v":
            //     selectedShape.value = "vertical-line";
            //     setShapeObjectsFromGlobal("vertical-line")
            //     break;
            // case "R":
            //     selectedShape.value = "circle";
            //     setShapeObjectsFromGlobal("circle")
            //     break;
            // case "q":
            //     selectedShape.value = "square";
            //     setShapeObjectsFromGlobal("square")
            //     break;
            // case "t":
            //     selectedShape.value = "triangle";
            //     setShapeObjectsFromGlobal("triangle")
            //     break;
            // case "S":
            //     scaleUpObjectOfInterest()
            //     break;
            // case "s":
            //     scaleDownObjectOfInterest()
            //     break;
            // case "r":
            //     selectedColor.value = "red";
            //     changeObjectOfInterestColor(selectedColor.value)
            //     break;
            // case "g":
            //     selectedColor.value = "green";
            //     changeObjectOfInterestColor(selectedColor.value)
            //     break;
            // case "b":
            //     selectedColor.value = "blue";
            //     changeObjectOfInterestColor(selectedColor.value)
            //     break;
            // case "W":
            //     console.log("Enter global mode")
            //     enterGlobalMode()
            //     break;
            // case "w":
            //     console.log("Exit global mode")
            //     exitGlobalMode()
            //     break;
            // case "c":
            //     clearCanvas();
            //     break;
            default:
                break;
        }
    })
}


export function bindCameraMouseControlEvent() {
    document.addEventListener('mousedown', onDocumentMouseDown, false);
}

function onDocumentMouseDown(event: MouseEvent) {
    event.preventDefault();
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
    document.addEventListener('mouseout', onDocumentMouseOut, false);
    var mouseX = event.clientX;
    var mouseY = event.clientY;

    lastMouseX.value = mouseX;
    lastMouseY.value = mouseY;
}

function onDocumentMouseMove(event: MouseEvent) {
    var mouseX = event.clientX;
    var mouseY = event.clientY;

    const ratio = .004;
    var deltaX = -(mouseX - lastMouseX.value) * ratio;
    var deltaY = (mouseY - lastMouseY.value) * ratio;
    var x_limit = 180 * 0.17453292519943295;
    var y_limit = 60 * 0.17453292519943295;

    let new_x = angle_x.value + deltaX;
    let new_y = angle_y.value + deltaY;

    if (new_x >= -x_limit && new_x <= x_limit) {
        angle_x.value = new_x;
    }
    if (new_y >= -y_limit && new_y <= y_limit) {
        angle_y.value = new_y;
    }
    // Z_angle = Z_angle + diffX / 5;
    // console.log(Z_angle)
    lastMouseX.value = mouseX;
    lastMouseY.value = mouseY;

    changeCameraRedraw();
}

function onDocumentMouseUp() {
    document.removeEventListener('mousemove', onDocumentMouseMove, false);
    document.removeEventListener('mouseup', onDocumentMouseUp, false);
    document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

function onDocumentMouseOut() {
    document.removeEventListener('mousemove', onDocumentMouseMove, false);
    document.removeEventListener('mouseup', onDocumentMouseUp, false);
    document.removeEventListener('mouseout', onDocumentMouseOut, false);
}