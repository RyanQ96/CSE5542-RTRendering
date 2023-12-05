import { getIdentifyMatrix, getTransiationMatrix, getRotateMatrix, getScaleMatrix, matmul, getRotateYMatrix, getRotateXMatrix } from "@/utils/matrix"
import { computeSurfaceNormals, computeVertexNormals, requestCORSIfNotSameOrigin } from "./objUtils"

export class HObj {
    public children: HObj[] = []
    public parent: HObj | null = null
    public rotationMat: Float32Array = getIdentifyMatrix()
    public rotateTotal: number = 0
    public rotateYTotal: number = 0
    public rotateXTotal: number = 0
    public verticesForNormal: number[];
    public parts: any;
    public normals: number[];
    public translationMat: Float32Array = getIdentifyMatrix()
    public scaleMat: Float32Array = getIdentifyMatrix()
    public scaleTotal: number = 1
    public combinedMat: Float32Array = getIdentifyMatrix()
    public data: number[] = []
    public indices: number[] = []
    public centerPoint: number[]
    public colors: number[]
    public objectType: string = "HObj"
    public selectedColor = [1, 0, 0, 1]
    public radius = 40
    private _dirty = true
    public useReflection: boolean = false
    constructor(centerPoint: number[] = [0, 0, 0], parent: HObj | null = null, useReflection: boolean = false) {
        this.parent = parent
        if (this.parent) {
            this.parent.children.push(this)
        }
        this.centerPoint = centerPoint
        this.useReflection = useReflection
    }

    translate(centerPoint: number[]) {
        this.translationMat = getTransiationMatrix(centerPoint[0] - this.centerPoint[0], centerPoint[1] - this.centerPoint[1], centerPoint[2] - this.centerPoint[2])
        this._dirty = true
        globalInstance.setObjectOfInterest(this)
    }

    translateDelta(moveDelta: number[]) {
        this.translationMat = matmul(getTransiationMatrix(moveDelta[0], moveDelta[1], moveDelta[2]), this.translationMat)
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

    rotateY(theta: number) {
        this.rotateYTotal += theta
        this.rotationMat = matmul(this.rotationMat, getRotateYMatrix(theta))
        this._dirty = true
    }
    rotateX(theta: number) {
        this.rotateXTotal += theta
        this.rotationMat = matmul(this.rotationMat, getRotateXMatrix(theta))
        this._dirty = true
    }

    scale(x: number, y: number, z: number = 1) {
        this.scaleMat = matmul(this.scaleMat, getScaleMatrix(x, y, z))
        this.scaleTotal *= x
        this._dirty = true
        globalInstance.setObjectOfInterest(this)
    }

    getMatrix(additionalRotate?: number): Float32Array {
        if (this._dirty) {
            // recalculate matrix
            if (this.objectType === "Global") {
                this.combinedMat = matmul(this.translationMat, this.rotationMat, this.scaleMat)
            } else {
                this.combinedMat = matmul(this.translationMat, this.rotationMat, this.scaleMat)

                // this.combinedMat = matmul(this.translationMat, this.rotationMat, getRotateXMatrix(additionalRotate), this.scaleMat) 
            }
            this._dirty = false
        }
        let tmpCombinedMat = this.combinedMat
        if (additionalRotate) {
            tmpCombinedMat = matmul(this.translationMat, this.rotationMat, this.scaleMat, getTransiationMatrix(0, 6.5, 0), getRotateXMatrix(additionalRotate), getTransiationMatrix(0, -6.5, 0))
        }
        return this.parent ? matmul(this.parent.getMatrix(), tmpCombinedMat) : this.combinedMat
    }

    render(dataContainer: number[], drawingCommands: any[], indicesData: any[]) {
        console.log(dataContainer, drawingCommands, indicesData)
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
        const color = [1, 1, 1, 1.0]
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

    updateNormals() {
        if (this.indices && this.verticesForNormal) {
            const surfaceNormals = computeSurfaceNormals(this.verticesForNormal, this.indices);
            const vertexNormals = computeVertexNormals(this.verticesForNormal, this.indices, surfaceNormals);
            this.normals = Array.from(vertexNormals)
        } else {
            alert("no indices or data for: " + this.objectType)
        }
    }
}


export class Global extends HObj {
    public objectType: string = "Global"
    public drawingData: number[] = []
    public drawingCommands: any[] = []
    public indicesData: any[] = []
    public objectOfInterest: HObj | null = null
    public candidateObjectOfInterest: HObj | null = null
    constructor(centerPoint: number[] = [0, 0, 0], parent: HObj | null = null) {
        super(centerPoint, parent)
    }
    render(dataContainer: number[] | null = null, commandContainer: any[] | null = null, indicesDataContainer: any[] | null = null) {
        // drawGlobal()
        this.drawingData = []
        this.indicesData = []
        this.drawingCommands = []
        if (this.children) {
            this.children.forEach((child: any) => {
                child.render(this.drawingData, this.drawingCommands, this.indicesData);
            });
        }
        if (dataContainer) {
            dataContainer.push(...this.drawingData)
        }
        if (commandContainer) {
            commandContainer.push(...this.drawingCommands)
        }
        if (indicesDataContainer) {
            indicesDataContainer.push(...this.indicesData)
        }
        return { drawingData: this.drawingData, drawingCommands: this.drawingCommands, indicesData: this.indicesData }
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




// export class Sphere extends HObj {
//     public objectType: string = "sphere"
//     constructor(radius: number, slices: number, stacks: number, color: number[], parent: HObj | null = null) {
//         super([0, 0, 0], parent || globalInstance)
//         this.initializeData(radius, slices, stacks, color,)
//     }
//     initializeData(radius: number, slices: number, stacks: number, color: number[],) {
//         let vertices = [];
//         let indices = [];
//         let colors = [] 

//         for (let latNumber = 0; latNumber <= stacks; latNumber++) {
//             let theta = latNumber * Math.PI / stacks;
//             let sinTheta = Math.sin(theta);
//             let cosTheta = Math.cos(theta);

//             for (let longNumber = 0; longNumber <= slices; longNumber++) {
//                 let phi = longNumber * 2 * Math.PI / slices;
//                 let sinPhi = Math.sin(phi);
//                 let cosPhi = Math.cos(phi);

//                 let x = cosPhi * sinTheta;
//                 let y = cosTheta;
//                 let z = sinPhi * sinTheta;

//                 vertices.push(radius * x);
//                 vertices.push(radius * y);
//                 vertices.push(radius * z);
//                 colors.push(...color)
//                 // vertices.push(...color)

//                 if (latNumber < stacks && longNumber < slices) {
//                     let first = (latNumber * (slices + 1)) + longNumber;
//                     let second = first + slices + 1;
//                     indices.push(first);
//                     indices.push(second);
//                     indices.push(first + 1);

//                     indices.push(second);
//                     indices.push(second + 1);
//                     indices.push(first + 1);
//                 }
//             }
//         }
//         this.data = vertices
//         this.indices = indices
//         this.colors = colors; 
//         // this.parts = [
//         //     {
//         //         bufferInfo: {
//         //             attribs: {
//         //                 a_position: 
//         //             }, 
//         //             numElements: this.data.length / 3,
//         //         }
//         //     }
//         // ]
//     }
//     render(dataContainer: number[], commandContainer: any[], indicesDataContainer: any[]) {
//         // const offset = dataContainer.length / 7
//         const existingIndicesLength = indicesDataContainer.length
//         this.data.forEach(e => dataContainer.push(e))
//         this.indices.forEach(e => indicesDataContainer.push(e))
//         commandContainer.push({
//             shape: this.objectType,
//             vertices: this.data,
//             indices: this.indices,
//             offset: existingIndicesLength * 2,
//             count: this.indices.length,
//             matrix: this.getMatrix(),
//             useIndices: true
//         })
//         this.children.forEach(child => child.render(dataContainer, commandContainer, indicesDataContainer))
//     }
// }

export class Sphere extends HObj {
    public objectType: string = "sphere"
    constructor(radius: number, slices: number, stacks: number, color: number[], parent: HObj | null = null, useReflection: boolean = false) {
        super([0, 0, 0], parent || globalInstance, useReflection)
        this.initializeData(radius, slices, stacks, color,)
    }
    initializeData(radius: number, slices: number, stacks: number, color: number[],) {
        let vertices = [];
        let verticesForNormal = [];
        let indices = [];
        let normals = []

        for (let latNumber = 0; latNumber <= stacks; latNumber++) {
            let theta = latNumber * Math.PI / stacks;
            let sinTheta = Math.sin(theta);
            let cosTheta = Math.cos(theta);

            for (let longNumber = 0; longNumber <= slices; longNumber++) {
                let phi = longNumber * 2 * Math.PI / slices;
                let sinPhi = Math.sin(phi);
                let cosPhi = Math.cos(phi);

                let x = cosPhi * sinTheta;
                let y = cosTheta;
                let z = sinPhi * sinTheta;

                vertices.push(radius * x);
                vertices.push(radius * y);
                vertices.push(radius * z);
                vertices.push(...color)
                verticesForNormal.push(radius * x);
                verticesForNormal.push(radius * y);
                verticesForNormal.push(radius * z);
                normals.push(...color.slice(0, 3))

                if (latNumber < stacks && longNumber < slices) {
                    let first = (latNumber * (slices + 1)) + longNumber;
                    let second = first + slices + 1;
                    indices.push(first);
                    indices.push(first + 1);
                    indices.push(second);

                    indices.push(second);
                    indices.push(first + 1);
                    indices.push(second + 1);
                }
            }
        }
        this.data = vertices
        this.verticesForNormal = verticesForNormal
        this.indices = indices
        this.normals = normals
        this.verticesForNormal = verticesForNormal
        this.updateNormals()
    }
    render(dataContainer: number[], commandContainer: any[], indicesDataContainer: any[]) {
        // const offset = dataContainer.length / 7
        const existingIndicesLength = indicesDataContainer.length
        this.data.forEach(e => dataContainer.push(e))
        this.indices.forEach(e => indicesDataContainer.push(e))
        commandContainer.push({
            shape: this.objectType,
            vertices: this.data,
            indices: this.indices,
            normals: this.normals,
            offset: existingIndicesLength * 2,
            count: this.indices.length,
            matrix: this.getMatrix(),
            useIndices: true,
            useReflection: this.useReflection
        })
        this.children.forEach(child => child.render(dataContainer, commandContainer, indicesDataContainer))
    }
}


export class Cube extends HObj {
    public objectType: string = "cube"
    public texture: any
    public texcoord: any

    public material = {
        ambient_coef: [0.4, .4, 0.4, 1],
        diffuse_coef: [1, 1, 1, 1],
        specular_coef: [1, 1, 1, 1],
        mat_shine: 10,
    }
    constructor(size: number, color: number[], parent: HObj | null = null, useReflection: boolean = false, textureURL?: string, gl?: WebGLRenderingContext) {
        super([0, 0, 0], parent || globalInstance, useReflection)
        this.initializeData(size, color)
        if (textureURL) this.initializeTexture(gl, textureURL)
    }
    initializeTexture(gl: WebGLRenderingContext, textureURL: string) {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

        // let's assume all images are not a power of 2
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        var textureInfo = {
            width: 1,   // we don't know the size until it loads
            height: 1,
            texture: tex,
        };
        var img = new Image();
        img.addEventListener('load', function () {
            textureInfo.width = img.width;
            textureInfo.height = img.height;

            gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        });
        requestCORSIfNotSameOrigin(img, textureURL);
        img.src = textureURL;
        this.texture = tex
    }



    initializeData(size: number, color: number[]) {
        const CUBE_FACE_INDICES = [
            [3, 7, 5, 1], // right
            [6, 2, 0, 4], // left
            [6, 7, 3, 2], // ??
            [0, 1, 5, 4], // ??
            [7, 6, 4, 5], // front
            [2, 3, 1, 0], // back
        ];
        function createCubeVertices(size) {
            const k = size / 2;

            const cornerVertices = [
                [-k, -k, -k, ...color],
                [+k, -k, -k, ...color],
                [-k, +k, -k, ...color],
                [+k, +k, -k, ...color],
                [-k, -k, +k, ...color],
                [+k, -k, +k, ...color],
                [-k, +k, +k, ...color],
                [+k, +k, +k, ...color],
            ];

            const faceNormals = [
                [+1, +0, +0],
                [-1, +0, +0],
                [+0, +1, +0],
                [+0, -1, +0],
                [+0, +0, +1],
                [+0, +0, -1],
            ];

            const uvCoords = [
                [1, 0],
                [0, 0],
                [0, 1],
                [1, 1],
            ];

            // const numVertices = 6 * 4;
            const positions = []
            const normals = []
            const texCoords = []
            const indices = []

            for (let f = 0; f < 6; ++f) {
                const faceIndices = CUBE_FACE_INDICES[f];
                for (let v = 0; v < 4; ++v) {
                    const position = cornerVertices[faceIndices[v]];
                    const normal = faceNormals[f];
                    const uv = uvCoords[v];

                    // Each face needs all four vertices because the normals and texture
                    // coordinates are not all the same.
                    positions.push(position);
                    normals.push(normal);
                    texCoords.push(uv);

                }
                // Two triangles make a square face.
                const offset = 4 * f;
                indices.push(offset + 0, offset + 1, offset + 2);
                indices.push(offset + 0, offset + 2, offset + 3);
            }

            return {
                position: positions.flat(),
                normal: normals.flat(),
                texcoord: texCoords.flat(),
                indices: indices.flat(),
            };
        }
        const { position, normal, indices, texcoord } = createCubeVertices(size)
        this.data = position
        this.indices = indices
        this.normals = normal
        this.texcoord = texcoord
        // this.updateNormals()
        console.log("check norms", this.normals)

    }

    render(dataContainer: number[], commandContainer: any[], indicesDataContainer: any[]) {
        // const offset = dataContainer.length / 7
        const existingIndicesLength = indicesDataContainer.length
        this.data.forEach(e => dataContainer.push(e))
        this.indices.forEach(e => indicesDataContainer.push(e))
        commandContainer.push({
            shape: this.objectType,
            vertices: this.data,
            indices: this.indices,
            offset: existingIndicesLength * 2,
            count: this.indices.length,
            normals: this.normals,
            matrix: this.getMatrix(),
            useIndices: true,
            material: this.material || {},
            useReflection: this.useReflection,
            texture: this.texture, 
            texcoord: this.texcoord
        })
        this.children.forEach(child => child.render(dataContainer, commandContainer, indicesDataContainer))
    }
}

export class Cylinder extends HObj {
    public objectType: string = "cylinder"
    constructor(baseRadius: number, topRadius: number, height: number, slices: number, stacks: number, color: number[], parent: HObj | null = null, useReflection: boolean = false) {
        super([0, 0, 0], parent || globalInstance, useReflection)
        this.initializeData(baseRadius, topRadius, height, slices, stacks, color)
    }
    public material = {
        ambient_coef: [0.4, 0.4, 0.4, 1],
        diffuse_coef: [1, 1, 1, 1],
        specular_coef: [.03, .03, .03, 1],
        mat_shine: 1,
    }

    initializeData(baseRadius: number, topRadius: number, height: number, slices: number, stacks: number, color: number[]) {
        let vertices = [];
        let indices = [];
        let normals = [];
        let verticesForNormal = [];

        const stackHeight = height / stacks;

        const topColor = [...color]
        topColor[3] -= .4
        topColor[0] += .1
        topColor[1] += .1
        topColor[2] += .1
        vertices.push(0, 0, 0, ...topColor);
        verticesForNormal.push(0, 0, 0);
        normals.push(...color.slice(0, 3));
        for (let sliceNumber = 0; sliceNumber < slices; sliceNumber++) {
            let theta = sliceNumber * 2 * Math.PI / slices;
            let sinTheta = Math.sin(theta);
            let cosTheta = Math.cos(theta);

            let x = baseRadius * cosTheta;
            let y = 0;
            let z = baseRadius * sinTheta;

            vertices.push(x, y, z, ...topColor);
            verticesForNormal.push(x, y, z);
            normals.push(...color.slice(0, 3));

            if (sliceNumber > 0) {
                indices.push(0, sliceNumber, sliceNumber + 1);
            }
        }
        indices.push(0, slices, 1);

        for (let stackNumber = 0; stackNumber <= stacks; stackNumber++) {
            let currentRadius = baseRadius + (topRadius - baseRadius) * (stackNumber / stacks);
            let currentHeight = stackHeight * stackNumber;

            for (let sliceNumber = 0; sliceNumber < slices; sliceNumber++) {
                let theta = sliceNumber * 2 * Math.PI / slices;
                let sinTheta = Math.sin(theta);
                let cosTheta = Math.cos(theta);

                let x = currentRadius * cosTheta;
                let y = currentHeight;
                let z = currentRadius * sinTheta;

                vertices.push(x, y, z, ...color);
                verticesForNormal.push(x, y, z);
                normals.push(...color.slice(0, 3));
            }
        }
        for (let stackNumber = 0; stackNumber < stacks; stackNumber++) {
            for (let sliceNumber = 0; sliceNumber < slices; sliceNumber++) {
                let first = (stackNumber * slices) + sliceNumber;
                let second = first + slices;

                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);

                if (sliceNumber === slices - 1) {  // Adjust for the last set of triangles
                    indices[indices.length - 3] = first;
                    indices[indices.length - 2] = first + 1;
                    indices[indices.length - 1] = (stackNumber * slices) + 0;
                }
            }
        }

        const topCenterIndex = vertices.length / 7;
        vertices.push(0, height, 0, ...topColor);
        verticesForNormal.push(0, height, 0)
        normals.push(...topColor.slice(0, 3));
        for (let sliceNumber = 0; sliceNumber < slices; sliceNumber++) {
            let theta = sliceNumber * 2 * Math.PI / slices;
            let sinTheta = Math.sin(theta);
            let cosTheta = Math.cos(theta);

            let x = topRadius * cosTheta;
            let y = height;
            let z = topRadius * sinTheta;

            vertices.push(x, y, z, ...topColor);
            verticesForNormal.push(x, y, z);
            normals.push(...color.slice(0, 3));

            if (sliceNumber > 0) {
                indices.push(topCenterIndex, topCenterIndex + sliceNumber + 1, topCenterIndex + sliceNumber);
            }
        }
        indices.push(topCenterIndex, topCenterIndex + 1, topCenterIndex + slices);  // Close the cap

        this.data = vertices
        this.indices = indices
        this.normals = normals
        this.verticesForNormal = verticesForNormal
        this.updateNormals()
    }

    render(dataContainer: number[], commandContainer: any[], indicesDataContainer: any[]) {
        // const offset = dataContainer.length / 7
        const existingIndicesLength = indicesDataContainer.length
        this.data.forEach(e => dataContainer.push(e))
        this.indices.forEach(e => indicesDataContainer.push(e))
        commandContainer.push({
            shape: this.objectType,
            offset: existingIndicesLength * 2,
            vertices: this.data,
            indices: this.indices,
            count: this.indices.length,
            normals: this.normals,
            matrix: this.getMatrix(),
            useIndices: true,
            material: this.material || {},
            useReflection: this.useReflection
        })
        this.children.forEach(child => child.render(dataContainer, commandContainer, indicesDataContainer))
    }
}



// export class Circle extends HObj {
//     public objectType: string = "circle"
//     constructor(initialPos: number[] = [0, 0]) {
//         super([0, 0], globalInstance)
//         this.initializeData()
//         this.translate(initialPos)
//     }

//     initializeData(color: number[] = this.selectedColor) {
//         const segments = 100;
//         let jsArrayData = []
//         jsArrayData.push(this.centerPoint[0], this.centerPoint[1], 0.0, ...color)
//         for (let i = 0; i <= segments; i++) {
//             let theta = (i / segments) * 2 * Math.PI;
//             let x = (this.radius / 2 * Math.cos(theta) + this.centerPoint[0]);
//             let y = (this.radius / 2 * Math.sin(theta) + this.centerPoint[1]);
//             jsArrayData.push(x, y, 0.0, ...color);
//         }
//         this.data = jsArrayData
//     }

//     render(dataContainer: number[], commandContainer: any[]) {
//         // drawCircle()
//         const offset = dataContainer.length / 7
//         dataContainer.push(...this.data)
//         commandContainer.push({
//             shape: this.objectType,
//             offset: offset,
//             count: this.data.length / 7,
//             matrix: this.getMatrix()
//         })
//         if (globalInstance.objectOfInterest === this) {
//             this.renderObjectOfInterestBox(dataContainer, commandContainer)
//         } else if (globalInstance.candidateObjectOfInterest === this) {
//             this.renderCandidateObjectOfInterestBox(dataContainer, commandContainer)
//         }
//     }

// }

// export class Square extends HObj {
//     public objectType: string = "square"
//     constructor(initialPos: number[] = [0, 0]) {
//         super([0, 0], globalInstance)
//         this.initializeData()
//         this.translate(initialPos)
//     }
//     initializeData(color: number[] = this.selectedColor) {
//         let jsArrayData = []
//         const newCenterPoint = [this.centerPoint[0], this.centerPoint[1]]
//         const bottomRightPoint = [newCenterPoint[0] + this.radius / 2, newCenterPoint[1] - this.radius / 2]
//         const bottomLeftPoint = [newCenterPoint[0] - this.radius / 2, newCenterPoint[1] - this.radius / 2]
//         const topRightPoint = [newCenterPoint[0] + this.radius / 2, newCenterPoint[1] + this.radius / 2]
//         const topLeftPoint = [newCenterPoint[0] - this.radius / 2, newCenterPoint[1] + this.radius / 2]
//         jsArrayData.push(...bottomRightPoint, 0.0, ...color)
//         jsArrayData.push(...topRightPoint, 0.0, ...color)
//         jsArrayData.push(...topLeftPoint, 0.0, ...color)
//         jsArrayData.push(...topLeftPoint, 0.0, ...color)
//         jsArrayData.push(...bottomLeftPoint, 0.0, ...color)
//         jsArrayData.push(...bottomRightPoint, 0.0, ...color)
//         this.data = jsArrayData
//     }
//     render(dataContainer: number[], commandContainer: any[]) {
//         // drawCircle()
//         const offset = dataContainer.length / 7
//         dataContainer.push(...this.data)
//         commandContainer.push({
//             shape: this.objectType,
//             offset: offset,
//             count: this.data.length / 7,
//             matrix: this.getMatrix()
//         })
//         if (globalInstance.objectOfInterest === this) {
//             this.renderObjectOfInterestBox(dataContainer, commandContainer)
//         } else if (globalInstance.candidateObjectOfInterest === this) {
//             this.renderCandidateObjectOfInterestBox(dataContainer, commandContainer)
//         }
//     }
// }

// export class Triangle extends HObj {
//     public objectType: string = "triangle"
//     constructor(initialPos: number[] = [0, 0]) {
//         super([0, 0], globalInstance)
//         this.initializeData()
//         this.translate(initialPos)
//     }
//     initializeData(color: number[] = this.selectedColor) {
//         let jsArrayData = []
//         const newCenterPoint = [this.centerPoint[0], this.centerPoint[1]]
//         const topPoint = [newCenterPoint[0], newCenterPoint[1] + this.radius / Math.sqrt(3)]
//         const leftPoint = [newCenterPoint[0] - this.radius / 2, newCenterPoint[1] - this.radius / (2 * Math.sqrt(3))]
//         const rightPoint = [newCenterPoint[0] + this.radius / 2, newCenterPoint[1] - this.radius / (2 * Math.sqrt(3))]
//         jsArrayData.push(...topPoint, 0.0, ...color)
//         jsArrayData.push(...leftPoint, 0.0, ...color)
//         jsArrayData.push(...rightPoint, 0.0, ...color)
//         this.data = jsArrayData
//     }
//     render(dataContainer: number[], commandContainer: any[]) {
//         const offset = dataContainer.length / 7
//         dataContainer.push(...this.data)
//         commandContainer.push({
//             shape: this.objectType,
//             offset: offset,
//             count: this.data.length / 7,
//             matrix: this.getMatrix()
//         })
//         if (globalInstance.objectOfInterest === this) {
//             this.renderObjectOfInterestBox(dataContainer, commandContainer)
//         } else if (globalInstance.candidateObjectOfInterest === this) {
//             this.renderCandidateObjectOfInterestBox(dataContainer, commandContainer)
//         }
//     }
// }

// export class Point extends HObj {
//     public objectType: string = "point"
//     constructor(initialPos: number[] = [0, 0]) {
//         super([0, 0], globalInstance)
//         this.initializeData()
//         this.translate(initialPos)
//     }

//     initializeData(color: number[] = this.selectedColor) {
//         let jsArrayData = []
//         const newCenterPoint = [this.centerPoint[0], this.centerPoint[1]]
//         jsArrayData.push(...newCenterPoint, 0.0, ...color)
//         this.data = jsArrayData
//     }
//     render(dataContainer: number[], commandContainer: any[]) {
//         const offset = dataContainer.length / 7
//         dataContainer.push(...this.data)
//         commandContainer.push({
//             shape: this.objectType,
//             offset: offset,
//             count: this.data.length / 7,
//             matrix: this.getMatrix()
//         })
//         if (globalInstance.objectOfInterest === this) {
//             this.renderObjectOfInterestBox(dataContainer, commandContainer)
//         } else if (globalInstance.candidateObjectOfInterest === this) {
//             this.renderCandidateObjectOfInterestBox(dataContainer, commandContainer)
//         }
//     }
// }

// export class HorizentalLine extends HObj {
//     public objectType: string = "horizontal-line"
//     constructor(initialPos: number[] = [0, 0]) {
//         super([0, 0], globalInstance)
//         this.initializeData()
//         this.translate(initialPos)
//     }

//     initializeData(color: number[] = this.selectedColor) {
//         let jsArrayData = []
//         const newCenterPoint = [this.centerPoint[0], this.centerPoint[1]]
//         const leftPoint = [newCenterPoint[0] - this.radius / 2, newCenterPoint[1]]
//         const rightPoint = [newCenterPoint[0] + this.radius / 2, newCenterPoint[1]]
//         jsArrayData.push(...leftPoint, 0.0, ...color)
//         jsArrayData.push(...rightPoint, 0.0, ...color)
//         this.data = jsArrayData
//     }
//     render(dataContainer: number[], commandContainer: any[]) {
//         const offset = dataContainer.length / 7
//         dataContainer.push(...this.data)
//         commandContainer.push({
//             shape: this.objectType,
//             offset: offset,
//             count: this.data.length / 7,
//             matrix: this.getMatrix()
//         })
//         if (globalInstance.objectOfInterest === this) {
//             this.renderObjectOfInterestBox(dataContainer, commandContainer)
//         } else if (globalInstance.candidateObjectOfInterest === this) {
//             this.renderCandidateObjectOfInterestBox(dataContainer, commandContainer)
//         }
//     }
// }

// export class VerticalLine extends HObj {
//     public objectType: string = "vertical-line"
//     constructor(initialPos: number[] = [0, 0]) {
//         super([0, 0], globalInstance)
//         this.initializeData()
//         this.translate(initialPos)
//     }

//     initializeData(color: number[] = this.selectedColor) {
//         let jsArrayData = []
//         const newCenterPoint = [this.centerPoint[0], this.centerPoint[1]]
//         const topPoint = [newCenterPoint[0], newCenterPoint[1] + this.radius / 2]
//         const bottomPoint = [newCenterPoint[0], newCenterPoint[1] - this.radius / 2]
//         jsArrayData.push(...bottomPoint, 0.0, ...color)
//         jsArrayData.push(...topPoint, 0.0, ...color)
//         this.data = jsArrayData
//     }

//     render(dataContainer: number[], commandContainer: any[]) {
//         const offset = dataContainer.length / 7
//         dataContainer.push(...this.data)
//         commandContainer.push({
//             shape: this.objectType,
//             offset: offset,
//             count: this.data.length / 7,
//             matrix: this.getMatrix()
//         })
//         if (globalInstance.objectOfInterest === this) {
//             this.renderObjectOfInterestBox(dataContainer, commandContainer)
//         } else if (globalInstance.candidateObjectOfInterest === this) {
//             this.renderCandidateObjectOfInterestBox(dataContainer, commandContainer)
//         }
//     }
// }

export const globalInstance = new Global()