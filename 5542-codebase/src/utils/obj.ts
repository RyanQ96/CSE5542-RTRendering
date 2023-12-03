import { HObj, globalInstance } from "./hierarchymodel"
import { parseOBJ, parseMTL, createTexture, create1PixelTexture, generateTangents, setBuffersAndAttributes, setUniforms, computeSurfaceNormals, computeVertexNormals } from "./objUtils"
import { createBufferInfoFromArrays, drawBufferInfo } from "./webglUtils"
// import { subtractVector, scaleVector, addVector } from "./matrix";
import type { programContext } from "@/core/drawwebgl-new"
import { createXYQuadVertices } from "./envUtils"

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
                        TransformMat: this.getMatrix(),
                        useTexture: 1,
                        useReflection: this.useReflection ? 1 : 0,
                        ...sharedMatrix,
                    }, material);
                    drawBufferInfo(gl, bufferInfo);
                }
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
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.depthFunc(gl.LEQUAL);
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
        // requestCORSIfNotSameOrigin(image, url)
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
