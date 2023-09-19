import { ref } from "vue";
import { addShape, clearCanvas } from "./drawwebgl";

export type TAllowedShape = "point" | "horizontal-line" | "vertical-line" | "circle" | "square" | "triangle"
export type TAllowedColor =  "red" | "green" | "blue"

export const mouseRelativeX = ref(0); 
export const mouseRelativeY = ref(0);
export const selectedShape = ref<TAllowedShape>("point")
export const selectedColor = ref<TAllowedColor>("red")

export const shapeIconMapping = {
    "point": "mdi-vector-point", 
    "horizontal-line": "mdi-minus",
    "vertical-line": "mdi-minus",   
    "circle": "mdi-circle",
    "square": "mdi-square",
    "triangle": "mdi-triangle"
}

const colorMapping = {
    "red": [1, 0, 0, 1],
    "green": [0, 1, 0, 1],
    "blue": [0, 0, 1, 1]
}

export function bindMouseEvent(container: HTMLCanvasElement) {
    container.addEventListener("mousemove", (event: MouseEvent) => {
        const { offsetX, offsetY } = event;
        mouseRelativeX.value = offsetX;
        mouseRelativeY.value = offsetY;
    });
    container.addEventListener("mousedown", (event: MouseEvent) => {
        const { offsetX, offsetY } = event;
        addShape([offsetX, offsetY], selectedShape.value, colorMapping[selectedColor.value]);
    });
}

export function bindKeyDownEvent() {
    document.addEventListener("keydown", (event: KeyboardEvent) => {
        const { key } = event;
        switch (key) {
            case "p":
                selectedShape.value = "point";
                break;
            case "h":
                selectedShape.value = "horizontal-line";
                break;
            case "v":
                selectedShape.value = "vertical-line";
                break;
            case "R":
                selectedShape.value = "circle";
                break;
            case "q":
                selectedShape.value = "square";
                break;
            case "t":
                selectedShape.value = "triangle";
                break;
            case "r":
                selectedColor.value = "red";
                break;
            case "g":
                selectedColor.value = "green";
                break;
            case "b":
                selectedColor.value = "blue";
                break;
            case "c":
                clearCanvas();
                break;
            default:
                break;
        }
    })
}


