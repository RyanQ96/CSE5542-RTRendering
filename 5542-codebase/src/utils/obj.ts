import { HObj, globalInstance } from "./hierarchymodel"
// import { matmul, getRotateXMatrix } from "@/utils/matrix"
import { parseOBJ, parseMTL, createTexture, create1PixelTexture, generateTangents, setBuffersAndAttributes, setUniforms, computeSurfaceNormals, computeVertexNormals, requestCORSIfNotSameOrigin } from "./objUtils"
import { createBufferInfoFromArrays, drawBufferInfo } from "./webglUtils"
// import { subtractVector, scaleVector, addVector } from "./matrix";
import type { programContext } from "@/core/drawwebgl-new"
import { createXYQuadVertices } from "./envUtils"
let time = 0
export class OBJGeneral extends HObj {
    public objectType: string = "obj-general";
    constructor(parts: any, parent: HObj | null = null) {
        super([0, 0, 0], parent || globalInstance)
        this.parts = parts
    }

    render(dataContainer: number[], commandContainer: any[], indicesDataContainer: any[]) {
        dataContainer.length;
        indicesDataContainer.length;

        const dataParts = this.parts
        commandContainer.push({
            shape: this.objectType,
            matrix: this.getMatrix(),
            useIndices: false,
            commandFunc: (gl: WebGLRenderingContext, programContext: programContext, sharedMatrix: any) => {
                // const uUseTexture = gl.getUniformLocation(programContext.program, "useTexture");
                // gl.uniform1i(uUseTexture, 1);
                gl.useProgram(programContext.program);
                for (const { bufferInfo, material } of dataParts) {
                    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
                    setBuffersAndAttributes(gl, programContext, bufferInfo);
                    // calls gl.uniform
                    setUniforms(programContext, {
                        useReflection: this.useReflection || (bufferInfo.numElements < 2000) ? 1 : 0,
                        TransformMat: (bufferInfo.numElements < 2000) ? this.getMatrix(time) : this.getMatrix(),
                        useTexture: 1,
                        ...sharedMatrix,
                    }, material);
                    drawBufferInfo(gl, bufferInfo);
                }
                time += .05;
            }
        })
    }
}

export class EnvObj extends HObj {
    public objectType: string = "environment";
    public skybox: any
    public programContext: programContext
    constructor(programContext: programContext, data: any, skybox: any) {
        super([0, 0, 0], globalInstance)
        this.data = data
        this.skybox = skybox
        this.programContext = programContext
    }

    render(dataContainer: number[], commandContainer: any[], indicesDataContainer: any[]) {
        dataContainer.length;
        indicesDataContainer.length;

        // const dataParts = this.parts
        commandContainer.push({
            shape: this.objectType,
            matrix: this.getMatrix(),
            useIndices: false,
            commandFunc: (gl: WebGLRenderingContext, programContext: programContext, sharedMatrix: any) => {
                // const uUseTexture = gl.getUniformLocation(programContext.program, "useTexture");
                // gl.uniform1i(uUseTexture, 1);
                // gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.skybox);
                // gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.depthFunc(gl.LEQUAL);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.useProgram(programContext.program || this.programContext.program);
                setBuffersAndAttributes(gl, programContext, this.data);
                setUniforms(programContext, {
                    u_skybox: this.skybox,
                    useReflection: this.useReflection ? 1 : 0,
                    ...sharedMatrix
                })
                drawBufferInfo(gl, this.data);
                // for (const { bufferInfo, material } of dataParts) {

                //     // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
                //     setBuffersAndAttributes(gl, programContext, bufferInfo);
                //     // calls gl.uniform
                //     setUniforms(programContext, {
                //         TransformMat: this.getMatrix(),
                //         useTexture: 1,
                //         ...sharedMatrix,
                //     }, material);
                //     drawBufferInfo(gl, bufferInfo);
                // }
            }
        })
    }
}


interface TFaceInfo {
    target: number,
    url: string,
}

export async function createEnvironObj(gl: WebGLRenderingContext, programContext: programContext, faceInfos: TFaceInfo[]) {
    const quadBufferInfo = createBufferInfoFromArrays(gl, createXYQuadVertices());
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    console.log("check quadBufferInfo", quadBufferInfo)
    faceInfos.forEach((faceInfo) => {
        const { target, url } = faceInfo;

        // Upload the canvas to the cubemap face.
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 512;
        const height = 512;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;

        // setup each face so it's immediately renderable
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

        // Asynchronously load an image
        const image = new Image();
        requestCORSIfNotSameOrigin(image, url)
        image.src = url;
        image.addEventListener('load', function () {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(target, level, internalFormat, format, type, image);
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        });
    });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    return new EnvObj(programContext, quadBufferInfo, texture)
}


export async function createOBJ(gl: WebGLRenderingContext, objHref: string = 'https://webglfundamentals.org/webgl/resources/models/windmill/windmill.obj', parent: HObj | null = null, registerTexture: CallableFunction | null = null, finishTexture: CallableFunction | null = null) {
    const response = await fetch(objHref);
    const text = await response.text();
    const obj = parseOBJ(text);
    const baseHref = new URL(objHref, window.location.href);
    const matTexts = await Promise.all(obj.materialLibs.map(async filename => {
        const matHref = new URL(filename, baseHref).href;
        const response = await fetch(matHref);
        return await response.text();
    }));
    const materials = parseMTL(matTexts.join('\n'));

    const textures = {
        defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]),
        defaultNormal: create1PixelTexture(gl, [127, 127, 255, 0]),
    };
    for (const material of Object.values(materials)) {
        Object.entries(material)
            .filter(([key]) => key.endsWith('Map'))
            .forEach(([key, filename]) => {
                let texture = textures[filename];
                if (!texture) {
                    const textureHref = new URL(filename, baseHref).href;
                    registerTexture()
                    texture = createTexture(gl, textureHref, finishTexture);
                    textures[filename] = texture;
                }
                material[key] = texture;
            });
    }
    Object.values(materials).forEach((m: any) => {
        m.shininess = 25;
        m.specular = [3, 2, 1];
    });

    const defaultMaterial = {
        diffuse: [1, 1, 1],
        diffuseMap: textures.defaultWhite,
        normalMap: textures.defaultNormal,
        ambient: [0, 0, 0],
        specular: [1, 1, 1],
        specularMap: textures.defaultWhite,
        shininess: 400,
        opacity: 1,
    };

    const parts = obj.geometries.map(({ material, data }) => {

        if (data.color) {
            if (data.position.length === data.color.length) {
                // it's 3. The our helper library assumes 4 so we need
                // to tell it there are only 3.
                data.color = { numComponents: 3, data: data.color };
            }
        } else {
            // there are no vertex colors so just use constant white
            data.color = { value: [1, 1, 1, 1] };
        }

        // generate tangents if we have the data to do so.
        if (data.texcoord && data.normal) {
            data.tangent = generateTangents(data.position, data.texcoord);
        } else {
            // There are no tangents
            data.tangent = { value: [1, 0, 0] };
        }

        if (!data.texcoord) {
            data.texcoord = { value: [0, 0] };
        }

        if (!data.normal) {
            // we probably want to generate normals if there are none
            data.normal = { value: [0, 0, 1] };
        }

        let faces = []
        if (!data.indices) {
            for (let i = 0; i < data.position.length / 3; i++) {
                faces.push(i)
            }
        } else {
            faces = data.indices
        }
        var surfaceNormals = computeSurfaceNormals(data.position, faces);
        var vertexNormals = computeVertexNormals(data.position, faces, surfaceNormals);
        data.normal = Array.from(vertexNormals)


        // create a buffer for each array by calling
        // gl.createBuffer, gl.bindBuffer, gl.bufferData
        const bufferInfo = createBufferInfoFromArrays(gl, data);
        return {
            material: {
                ...defaultMaterial,
                ...materials[material],
            },
            bufferInfo,
        };
    });

    // const extents = getGeometriesExtents(obj.geometries);
    // const range = subtractVector(extents.max, extents.min);
    // const objOffset = scaleVector(addVector(extents.min, scaleVector(range, 0.5)), -1);

    const objGeneral = new OBJGeneral(parts, parent)
    // objGeneral.translate(Array.from(objOffset))
    return objGeneral
}




export function createSurface(parent:HObj, programContext: programContext, textureURL?: string, gl?: WebGLRenderingContext) {
    const surfaceConfig = {
        slices: 80,
        loops: 40,
        inner_rad: 0.5,
        outerRad: 2,
    }
    const color = [1, 0, 0, 1]
    function makeVerts() {
        let vertices = [];
        let indices = [];
        let normals = [];
        let texCoords = [];

        for (let slice = 0; slice <= surfaceConfig.slices; ++slice) {
            const v = slice / surfaceConfig.slices;
            const slice_angle = v * 2 * Math.PI;
            const cos_slices = Math.cos(slice_angle);
            const sin_slices = Math.sin(slice_angle);
            const slice_rad = surfaceConfig.outerRad + surfaceConfig.inner_rad * cos_slices;

            for (let loop = 0; loop <= surfaceConfig.loops; ++loop) {
                //   x=(R+r·cos(v))cos(w)
                //   y=(R+r·cos(v))sin(w)
                //             z=r.sin(v)
                const u = loop / surfaceConfig.loops;
                const loop_angle = u * 2 * Math.PI;
                const cos_loops = Math.cos(loop_angle);
                const sin_loops = Math.sin(loop_angle);

                const x = slice_rad * cos_loops;
                const y = slice_rad * sin_loops;
                const z = surfaceConfig.inner_rad * sin_slices;

                vertices.push(x, y, z, ...color);
                normals.push(
                    cos_loops * sin_slices,
                    sin_loops * sin_slices,
                    cos_slices);

                texCoords.push(u);
                texCoords.push(v);
            }
        }


        // 0  1  2  3  4  5
        // 6  7  8  9  10 11
        // 12 13 14 15 16 17

        const vertsPerSlice = surfaceConfig.loops + 1;
        for (let i = 0; i < surfaceConfig.slices; ++i) {
            let v1 = i * vertsPerSlice;
            let v2 = v1 + vertsPerSlice;

            for (let j = 0; j < surfaceConfig.loops; ++j) {

                indices.push(v1);
                indices.push(v1 + 1);
                indices.push(v2);

                indices.push(v2);
                indices.push(v1 + 1);
                indices.push(v2 + 1);

                v1 += 1;
                v2 += 1;
            }
        }
        //this.indices = undefined;
        return {
            position: vertices,
            indices: indices,
            normal: normals,
            texcoord: texCoords,
        }
    }
    const { position, indices, normal, texcoord } = makeVerts()
    return new Surface(position, indices, normal, texcoord, programContext, parent, textureURL, gl)
}

export class Surface extends HObj {
    public objectType: string = "surface";
    public programContext: programContext
    public texcoord: any
    public texture: any
    public showLineOnly: boolean = false
    public showReflection: boolean = false 

    constructor(data, indices, normal, texcoord, programContext: programContext, parent: HObj | null = null, textureURL?: string, gl?: WebGLRenderingContext) {
        super([0, 0, 0], parent || globalInstance)
        this.programContext = programContext
        this.data = data
        this.indices = indices
        this.normals = normal
        this.texcoord = texcoord
        if (textureURL) this.initializeTexture(gl, textureURL)
    }

    toggleShowLineOnly() {
        this.showLineOnly = !this.showLineOnly
    }

    toggleShowReflection() {
        this.showReflection = !this.showReflection
        if (this.showReflection) {
            this.showLineOnly = false
        }
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

    render(dataContainer: number[], commandContainer: any[], indicesDataContainer: any[]) {
        dataContainer.length;
        indicesDataContainer.length;
        const existingIndicesLength = indicesDataContainer.length
        this.data.forEach(e => dataContainer.push(e))
        this.indices.forEach(e => indicesDataContainer.push(e))
        commandContainer.push({
            shape: this.objectType,
            matrix: this.getMatrix(),
            useIndices: true,
            vertices: this.data, 
            indices: this.indices,
            texcoord: this.texcoord,
            count: this.indices.length,
            normals: this.normals,
            useReflection: this.showReflection, 
            offset: existingIndicesLength * 2,
            texture: !this.showReflection?this.texture:undefined, 
            showLineOnly: this.showLineOnly,
        })
        this.children.forEach(child => child.render(dataContainer, commandContainer, indicesDataContainer))
    }
}