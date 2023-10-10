import { ref } from "vue";
import { addShape, clearCanvas, rotateShape, setShapeObjectsFromGlobal, detectCandidateObjectOfInterest, confirmObjectOfInterest, scaleUpObjectOfInterest, scaleDownObjectOfInterest, rotateGlobal, enterGlobalMode, exitGlobalMode, changeObjectOfInterestColor } from "./drawwebgl-new";
import { globalInstance } from "@/utils/hierarchymodel";


export type TAllowedShape = "point" | "horizontal-line" | "vertical-line" | "circle" | "square" | "triangle"
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


export function bindKeyDownEvent() {
    document.addEventListener("keydown", (event: KeyboardEvent) => {
        const { key } = event;
        switch (key) {
            case "p":
                selectedShape.value = "point";
                setShapeObjectsFromGlobal("point")
                break;
            case "h":
                selectedShape.value = "horizontal-line";
                setShapeObjectsFromGlobal("horizontal-line")
                break;
            case "v":
                selectedShape.value = "vertical-line";
                setShapeObjectsFromGlobal("vertical-line")
                break;
            case "R":
                selectedShape.value = "circle";
                setShapeObjectsFromGlobal("circle")
                break;
            case "q":
                selectedShape.value = "square";
                setShapeObjectsFromGlobal("square")
                break;
            case "t":
                selectedShape.value = "triangle";
                setShapeObjectsFromGlobal("triangle")
                break;
            case "S": 
                scaleUpObjectOfInterest() 
                break;
            case "s": 
                scaleDownObjectOfInterest()
                break;  
            case "r":
                selectedColor.value = "red";
                changeObjectOfInterestColor(selectedColor.value)
                break;
            case "g":
                selectedColor.value = "green";
                changeObjectOfInterestColor(selectedColor.value)
                break;
            case "b":
                selectedColor.value = "blue";
                changeObjectOfInterestColor(selectedColor.value)
                break;
            case "W":
                console.log("Enter global mode")
                enterGlobalMode()    
                break;
            case "w": 
                console.log("Exit global mode")
                exitGlobalMode()
                break;
            case "c":
                clearCanvas();
                break;
            default:
                break;
        }
    })
}