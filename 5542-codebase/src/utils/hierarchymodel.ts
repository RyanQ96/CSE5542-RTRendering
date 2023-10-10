import { getIdentifyMatrix, getTransiationMatrix, getRotateMatrix, getScaleMatrix, matmul } from "@/utils/matrix"

export class HObj {
    public children: HObj[] = []
    public parent: HObj | null = null
    public rotationMat: Float32Array = getIdentifyMatrix()
    public rotateTotal: number = 0
    public translationMat: Float32Array = getIdentifyMatrix()
    public scaleMat: Float32Array = getIdentifyMatrix()
    public scaleTotal: number = 1
    public combinedMat: Float32Array = getIdentifyMatrix()
    public data: number[] = []
    public centerPoint: number[]
    public objectType: string = "HObj"
    public selectedColor = [1, 0, 0, 1]
    public radius = 40
    private _dirty = true
    constructor(centerPoint: number[] = [0, 0], parent: HObj | null = null) {
        this.parent = parent
        if (this.parent) {
            this.parent.children.push(this)
        }
        this.centerPoint = centerPoint
    }

    translate(centerPoint: number[]) {
        this.translationMat = getTransiationMatrix(centerPoint[0] - this.centerPoint[0], centerPoint[1] - this.centerPoint[1])
        this._dirty = true
        globalInstance.setObjectOfInterest(this)
    }

    rotate(theta: number) {
        this.rotateTotal += theta
        // this.rotationMat = matmul(this.rotationMat, getRotateMatrix(theta))
        this.rotationMat = getRotateMatrix(this.rotateTotal)
        this._dirty = true
        globalInstance.setObjectOfInterest(this)
    }

    scale(x: number, y: number) {
        this.scaleMat = matmul(this.scaleMat, getScaleMatrix(x, y))
        this.scaleTotal *= x    
        this._dirty = true
        globalInstance.setObjectOfInterest(this)
    }

    getMatrix(): Float32Array {
        if (this._dirty) {
            // recalculate matrix
            if (this.objectType === "Global") {
                this.combinedMat = matmul(this.translationMat, this.rotationMat, this.scaleMat)
            } else {
                this.combinedMat = matmul(this.translationMat, this.rotationMat, this.scaleMat)
            }
            
            this._dirty = false
        }
        return this.parent ? matmul(this.parent.getMatrix(), this.combinedMat) : this.combinedMat
    }

    render(dataContainer: number[], drawingCommands: any[]) {

    }

    renderObjectOfInterestBox(dataContainer: number[], drawingCommands: any[]) {
        const color = [0.0, 1.0, 0.0, 1]
        let jsArrayData = []
        const newCenterPoint = [this.centerPoint[0], this.centerPoint[1]]
        const bottomRightPoint = [newCenterPoint[0] + this.radius / 1.5, newCenterPoint[1] - this.radius / 1.5]
        const bottomLeftPoint = [newCenterPoint[0] - this.radius / 1.5, newCenterPoint[1] - this.radius / 1.5]
        const topRightPoint = [newCenterPoint[0] + this.radius / 1.5, newCenterPoint[1] + this.radius / 1.5]
        const topLeftPoint = [newCenterPoint[0] - this.radius / 1.5, newCenterPoint[1] + this.radius / 1.5]
        jsArrayData.push(...bottomRightPoint, 0.0, ...color)
        jsArrayData.push(...topRightPoint, 0.0, ...color)
        jsArrayData.push(...topRightPoint, 0.0, ...color)
        jsArrayData.push(...topLeftPoint, 0.0, ...color)
        jsArrayData.push(...topLeftPoint, 0.0, ...color)
        jsArrayData.push(...bottomLeftPoint, 0.0, ...color)
        jsArrayData.push(...bottomLeftPoint, 0.0, ...color)
        jsArrayData.push(...bottomRightPoint, 0.0, ...color)
        const offset = dataContainer.length / 7
        dataContainer.push(...jsArrayData)
        drawingCommands.push({
            shape: "vertical-line",
            offset: offset,
            count: jsArrayData.length / 7,
            matrix: this.getMatrix()
        })
    }

    renderCandidateObjectOfInterestBox(dataContainer: number[], drawingCommands: any[]) {
        const color = [0, 0, 0, 1.0]
        let jsArrayData = []
        const newCenterPoint = [this.centerPoint[0], this.centerPoint[1]]
        const bottomRightPoint = [newCenterPoint[0] + this.radius / 1.5, newCenterPoint[1] - this.radius / 1.5]
        const bottomLeftPoint = [newCenterPoint[0] - this.radius / 1.5, newCenterPoint[1] - this.radius / 1.5]
        const topRightPoint = [newCenterPoint[0] + this.radius / 1.5, newCenterPoint[1] + this.radius / 1.5]
        const topLeftPoint = [newCenterPoint[0] - this.radius / 1.5, newCenterPoint[1] + this.radius / 1.5]
        jsArrayData.push(...bottomRightPoint, 0.0, ...color)
        jsArrayData.push(...topRightPoint, 0.0, ...color)
        jsArrayData.push(...topRightPoint, 0.0, ...color)
        jsArrayData.push(...topLeftPoint, 0.0, ...color)
        jsArrayData.push(...topLeftPoint, 0.0, ...color)
        jsArrayData.push(...bottomLeftPoint, 0.0, ...color)
        jsArrayData.push(...bottomLeftPoint, 0.0, ...color)
        jsArrayData.push(...bottomRightPoint, 0.0, ...color)
        const offset = dataContainer.length / 7
        dataContainer.push(...jsArrayData)
        drawingCommands.push({
            shape: "vertical-line",
            offset: offset,
            count: jsArrayData.length / 7,
            matrix: this.getMatrix()
        })
    }

    detectMouseOver(currentMousePos: number[]) {
        // get translated center point from this.centerPoint
        const translatedCenterPoint = [
            this.translationMat[12] + this.centerPoint[0],
            this.translationMat[13] + this.centerPoint[1]
        ]
        const scaledRadius = [
            this.scaleMat[0] * this.radius,
            this.scaleMat[5] * this.radius
        ]
        // check for within circle of mouse pos
        const distance = Math.sqrt(Math.pow(currentMousePos[0] - translatedCenterPoint[0], 2) + Math.pow(currentMousePos[1] - translatedCenterPoint[1], 2))
        if (distance < scaledRadius[0] / 2 && distance < scaledRadius[1] / 2) {
            return true
        } else {
            return false
        }
    }
}


export class Global extends HObj {
    public objectType: string = "Global"
    public drawingData: number[] = []
    public drawingCommands: any[] = []
    public objectOfInterest: HObj | null = null
    public candidateObjectOfInterest: HObj | null = null
    constructor() {
        super()
    }
    render() {
        // drawGlobal()
        this.drawingData = []
        this.drawingCommands = []
        if (this.children) {
            this.children.forEach((child: any) => {
                child.render(this.drawingData, this.drawingCommands);
            });
        }
        return {drawingData: this.drawingData, drawingCommands: this.drawingCommands}
    }
    setObjectOfInterest(objectOfInterest: HObj | null) {
        this.objectOfInterest = objectOfInterest
    }
    detectCandidateObjectOfInterest(mouseCenterPoint: number[]) {
        this.candidateObjectOfInterest = null
        this.children.forEach((child: any) => {
            if (child.detectMouseOver(mouseCenterPoint) && this.objectOfInterest !== child) {
                this.candidateObjectOfInterest = child
            }
        })
    }
}


export class Circle extends HObj {
    public objectType: string = "circle"
    constructor(initialPos: number[] = [0, 0]) {
        super([0, 0], globalInstance)
        this.initializeData()
        this.translate(initialPos)
    }

    initializeData(color: number[] = this.selectedColor) {
        const segments = 100;
        let jsArrayData = []
        jsArrayData.push(this.centerPoint[0], this.centerPoint[1], 0.0, ...color)
        for (let i = 0; i <= segments; i++) {
            let theta = (i / segments) * 2 * Math.PI;
            let x = (this.radius / 2 * Math.cos(theta) + this.centerPoint[0]);
            let y = (this.radius / 2 * Math.sin(theta) + this.centerPoint[1]);
            jsArrayData.push(x, y, 0.0, ...color);
        }
        this.data = jsArrayData
    }

    render(dataContainer: number[], commandContainer: any[]) {
        // drawCircle()
        const offset = dataContainer.length / 7
        dataContainer.push(...this.data)
        commandContainer.push({
            shape: this.objectType,
            offset: offset,
            count: this.data.length / 7,
            matrix: this.getMatrix()
        })
        if (globalInstance.objectOfInterest === this) {
            this.renderObjectOfInterestBox(dataContainer, commandContainer)
        } else if (globalInstance.candidateObjectOfInterest === this) {
            this.renderCandidateObjectOfInterestBox(dataContainer, commandContainer)
        }
    }
    
}

export class Square extends HObj {
    public objectType: string = "square"
    constructor(initialPos: number[] = [0, 0]) {
        super([0, 0], globalInstance)
        this.initializeData()
        this.translate(initialPos)
    }
    initializeData(color: number[] = this.selectedColor) {
        let jsArrayData = []
        const newCenterPoint = [this.centerPoint[0], this.centerPoint[1]]
        const bottomRightPoint = [newCenterPoint[0] + this.radius / 2, newCenterPoint[1] - this.radius / 2]
        const bottomLeftPoint = [newCenterPoint[0] - this.radius / 2, newCenterPoint[1] - this.radius / 2]
        const topRightPoint = [newCenterPoint[0] + this.radius / 2, newCenterPoint[1] + this.radius / 2]
        const topLeftPoint = [newCenterPoint[0] - this.radius / 2, newCenterPoint[1] + this.radius / 2]
        jsArrayData.push(...bottomRightPoint, 0.0, ...color)
        jsArrayData.push(...topRightPoint, 0.0, ...color)
        jsArrayData.push(...topLeftPoint, 0.0, ...color)
        jsArrayData.push(...topLeftPoint, 0.0, ...color)
        jsArrayData.push(...bottomLeftPoint, 0.0, ...color)
        jsArrayData.push(...bottomRightPoint, 0.0, ...color)
        this.data = jsArrayData
    }
    render(dataContainer: number[], commandContainer: any[]) {
        // drawCircle()
        const offset = dataContainer.length / 7
        dataContainer.push(...this.data)
        commandContainer.push({
            shape: this.objectType,
            offset: offset,
            count: this.data.length / 7,
            matrix: this.getMatrix()
        })
        if (globalInstance.objectOfInterest === this) {
            this.renderObjectOfInterestBox(dataContainer, commandContainer)
        } else if (globalInstance.candidateObjectOfInterest === this) {
            this.renderCandidateObjectOfInterestBox(dataContainer, commandContainer)
        }
    }
}

export class Triangle extends HObj {
    public objectType: string = "triangle"
    constructor(initialPos: number[] = [0, 0]) {
        super([0, 0], globalInstance)
        this.initializeData()
        this.translate(initialPos)
    }
    initializeData(color: number[] = this.selectedColor) {
        let jsArrayData = []
        const newCenterPoint = [this.centerPoint[0], this.centerPoint[1]]
        const topPoint = [newCenterPoint[0], newCenterPoint[1] + this.radius / Math.sqrt(3)]
        const leftPoint = [newCenterPoint[0] - this.radius / 2, newCenterPoint[1] - this.radius / (2 * Math.sqrt(3))]
        const rightPoint = [newCenterPoint[0] + this.radius / 2, newCenterPoint[1] - this.radius / (2 * Math.sqrt(3))]
        jsArrayData.push(...topPoint, 0.0, ...color)
        jsArrayData.push(...leftPoint, 0.0, ...color)
        jsArrayData.push(...rightPoint, 0.0, ...color)
        this.data = jsArrayData
    }
    render(dataContainer: number[], commandContainer: any[]) {
        const offset = dataContainer.length / 7
        dataContainer.push(...this.data)
        commandContainer.push({
            shape: this.objectType,
            offset: offset,
            count: this.data.length / 7,
            matrix: this.getMatrix()
        })
        if (globalInstance.objectOfInterest === this) {
            this.renderObjectOfInterestBox(dataContainer, commandContainer)
        } else if (globalInstance.candidateObjectOfInterest === this) {
            this.renderCandidateObjectOfInterestBox(dataContainer, commandContainer)
        }
    }
}

export class Point extends HObj {
    public objectType: string = "point"
    constructor(initialPos: number[] = [0, 0]) {
        super([0, 0], globalInstance)
        this.initializeData()
        this.translate(initialPos)
    }

    initializeData(color: number[] = this.selectedColor) {
        let jsArrayData = []
        const newCenterPoint = [this.centerPoint[0], this.centerPoint[1]]
        jsArrayData.push(...newCenterPoint, 0.0, ...color)
        this.data = jsArrayData
    }
    render(dataContainer: number[], commandContainer: any[]) {
        const offset = dataContainer.length / 7
        dataContainer.push(...this.data)
        commandContainer.push({
            shape: this.objectType,
            offset: offset,
            count: this.data.length / 7,
            matrix: this.getMatrix()
        })
        if (globalInstance.objectOfInterest === this) {
            this.renderObjectOfInterestBox(dataContainer, commandContainer)
        } else if (globalInstance.candidateObjectOfInterest === this) {
            this.renderCandidateObjectOfInterestBox(dataContainer, commandContainer)
        }
    }
}

export class HorizentalLine extends HObj {
    public objectType: string = "horizontal-line"
    constructor(initialPos: number[] = [0, 0]) {
        super([0, 0], globalInstance)
        this.initializeData()
        this.translate(initialPos)
    }

    initializeData(color: number[] = this.selectedColor) {
        let jsArrayData = []
        const newCenterPoint = [this.centerPoint[0], this.centerPoint[1]]
        const leftPoint = [newCenterPoint[0] - this.radius / 2, newCenterPoint[1]]
        const rightPoint = [newCenterPoint[0] + this.radius / 2, newCenterPoint[1]]
        jsArrayData.push(...leftPoint, 0.0, ...color)
        jsArrayData.push(...rightPoint, 0.0, ...color)
        this.data = jsArrayData
    }
    render(dataContainer: number[], commandContainer: any[]) {
        const offset = dataContainer.length / 7
        dataContainer.push(...this.data)
        commandContainer.push({
            shape: this.objectType,
            offset: offset,
            count: this.data.length / 7,
            matrix: this.getMatrix()
        })
        if (globalInstance.objectOfInterest === this) {
            this.renderObjectOfInterestBox(dataContainer, commandContainer)
        } else if (globalInstance.candidateObjectOfInterest === this) {
            this.renderCandidateObjectOfInterestBox(dataContainer, commandContainer)
        }
    }
}

export class VerticalLine extends HObj {
    public objectType: string = "vertical-line"
    constructor(initialPos: number[] = [0, 0]) {
        super([0, 0], globalInstance)
        this.initializeData()
        this.translate(initialPos)
    }

    initializeData(color: number[] = this.selectedColor) {
        let jsArrayData = []
        const newCenterPoint = [this.centerPoint[0], this.centerPoint[1]]
        const topPoint = [newCenterPoint[0], newCenterPoint[1] + this.radius / 2]
        const bottomPoint = [newCenterPoint[0], newCenterPoint[1] - this.radius / 2]
        jsArrayData.push(...bottomPoint, 0.0, ...color)
        jsArrayData.push(...topPoint, 0.0, ...color)
        this.data = jsArrayData
    }

    render(dataContainer: number[], commandContainer: any[]) {
        const offset = dataContainer.length / 7
        dataContainer.push(...this.data)
        commandContainer.push({
            shape: this.objectType,
            offset: offset,
            count: this.data.length / 7,
            matrix: this.getMatrix()
        })
        if (globalInstance.objectOfInterest === this) {
            this.renderObjectOfInterestBox(dataContainer, commandContainer)
        } else if (globalInstance.candidateObjectOfInterest === this) {
            this.renderCandidateObjectOfInterestBox(dataContainer, commandContainer)
        }
    }
}

export const globalInstance = new Global()