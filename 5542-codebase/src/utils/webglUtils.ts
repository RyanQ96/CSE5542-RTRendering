function getBindPointForSamplerType(gl: WebGLRenderingContext, type: number) {
    if (type === gl.SAMPLER_2D) return gl.TEXTURE_2D;        // eslint-disable-line
    if (type === gl.SAMPLER_CUBE) return gl.TEXTURE_CUBE_MAP;  // eslint-disable-line
    return undefined;
}


export function drawBufferInfo(gl, bufferInfo, primitiveType: number | null = null, count: number | null = null, offset: number | null = null) {
    console.log(bufferInfo)
    const indices = bufferInfo.indices;
    primitiveType = primitiveType == undefined ? gl.TRIANGLES : primitiveType;
    const numElements = count == undefined ? bufferInfo.numElements : count;
    offset = offset == undefined ? 0 : offset;
    if (indices) {
        gl.drawElements(primitiveType, numElements, gl.UNSIGNED_SHORT, offset);
    } else {
        console.log(numElements)
        gl.drawArrays(primitiveType, offset, numElements);
    }
}


export function createUniformSetters(gl: WebGLRenderingContext, program: WebGLProgram) {
    let textureUnit = 0;

    /**
     * Creates a setter for a uniform of the given program with it's
     * location embedded in the setter.
     * @param {WebGLProgram} program
     * @param {WebGLUniformInfo} uniformInfo
     * @returns {function} the created setter.
     */
    function createUniformSetter(program, uniformInfo) {
        const location = gl.getUniformLocation(program, uniformInfo.name);
        const type = uniformInfo.type;
        // Check if this uniform is an array
        const isArray = (uniformInfo.size > 1 && uniformInfo.name.substr(-3) === '[0]');
        if (type === gl.FLOAT && isArray) {
            return function (v) {
                gl.uniform1fv(location, v);
            };
        }
        if (type === gl.FLOAT) {
            return function (v) {
                gl.uniform1f(location, v);
            };
        }
        if (type === gl.FLOAT_VEC2) {
            return function (v) {
                gl.uniform2fv(location, v);
            };
        }
        if (type === gl.FLOAT_VEC3) {
            return function (v) {
                gl.uniform3fv(location, v);
            };
        }
        if (type === gl.FLOAT_VEC4) {
            return function (v) {
                gl.uniform4fv(location, v);
            };
        }
        if (type === gl.INT && isArray) {
            return function (v) {
                gl.uniform1iv(location, v);
            };
        }
        if (type === gl.INT) {
            return function (v) {
                gl.uniform1i(location, v);
            };
        }
        if (type === gl.INT_VEC2) {
            return function (v) {
                gl.uniform2iv(location, v);
            };
        }
        if (type === gl.INT_VEC3) {
            return function (v) {
                gl.uniform3iv(location, v);
            };
        }
        if (type === gl.INT_VEC4) {
            return function (v) {
                gl.uniform4iv(location, v);
            };
        }
        if (type === gl.BOOL) {
            return function (v) {
                gl.uniform1i(location, v);
            };
        }
        if (type === gl.BOOL_VEC2) {
            return function (v) {
                gl.uniform2iv(location, v);
            };
        }
        if (type === gl.BOOL_VEC3) {
            return function (v) {
                gl.uniform3iv(location, v);
            };
        }
        if (type === gl.BOOL_VEC4) {
            return function (v) {
                gl.uniform4iv(location, v);
            };
        }
        if (type === gl.FLOAT_MAT2) {
            return function (v) {
                gl.uniformMatrix2fv(location, false, v);
            };
        }
        if (type === gl.FLOAT_MAT3) {
            return function (v) {
                gl.uniformMatrix3fv(location, false, v);
            };
        }
        if (type === gl.FLOAT_MAT4) {
            return function (v) {
                gl.uniformMatrix4fv(location, false, v);
            };
        }
        if ((type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) && isArray) {
            const units = [];
            for (let ii = 0; ii < uniformInfo.size; ++ii) {
                units.push(textureUnit++);
            }
            return function (bindPoint, units) {
                return function (textures) {
                    gl.uniform1iv(location, units);
                    textures.forEach(function (texture, index) {
                        gl.activeTexture(gl.TEXTURE0 + units[index]);
                        gl.bindTexture(bindPoint, texture);
                    });
                };
            }(getBindPointForSamplerType(gl, type), units);
        }
        if (type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) {
            return function (bindPoint, unit) {
                return function (texture) {
                    gl.uniform1i(location, unit);
                    gl.activeTexture(gl.TEXTURE0 + unit);
                    gl.bindTexture(bindPoint, texture);
                };
            }(getBindPointForSamplerType(gl, type), textureUnit++);
        }
        throw ('unknown type: 0x' + type.toString(16)); // we should never get here.
    }

    const uniformSetters = {};
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

    for (let ii = 0; ii < numUniforms; ++ii) {
        const uniformInfo = gl.getActiveUniform(program, ii);
        if (!uniformInfo) {
            break;
        }
        let name = uniformInfo.name;
        // remove the array suffix.
        if (name.substr(-3) === '[0]') {
            name = name.substr(0, name.length - 3);
        }
        const setter = createUniformSetter(program, uniformInfo);
        uniformSetters[name] = setter;
    }
    return uniformSetters;
}


export function createAttributeSetters(gl: WebGLRenderingContext, program: WebGLProgram) {
    const attribSetters = {
    };

    function createAttribSetter(index: number) {
        return function (b: any) {
            if (b.value) {
                gl.disableVertexAttribArray(index);
                switch (b.value.length) {
                    case 4:
                        gl.vertexAttrib4fv(index, b.value);
                        break;
                    case 3:
                        gl.vertexAttrib3fv(index, b.value);
                        break;
                    case 2:
                        gl.vertexAttrib2fv(index, b.value);
                        break;
                    case 1:
                        gl.vertexAttrib1fv(index, b.value);
                        break;
                    default:
                        throw new Error('the length of a float constant value must be between 1 and 4!');
                }
            } else {
                gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
                gl.enableVertexAttribArray(index);
                gl.vertexAttribPointer(
                    index, b.numComponents || b.size, b.type || gl.FLOAT, b.normalize || false, b.stride || 0, b.offset || 0);
            }
        };
    }

    const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let ii = 0; ii < numAttribs; ++ii) {
        const attribInfo = gl.getActiveAttrib(program, ii);
        if (!attribInfo) {
            break;
        }
        const index = gl.getAttribLocation(program, attribInfo.name);
        attribSetters[attribInfo.name] = createAttribSetter(index);
    }

    return attribSetters;
}


export function initVertexShader(shaderSource: string, webgl: WebGLRenderingContext) {
    const vertexShaderObject = webgl.createShader(webgl.VERTEX_SHADER)!
    webgl.shaderSource(vertexShaderObject, shaderSource)
    webgl.compileShader(vertexShaderObject)
    if (!webgl.getShaderParameter(vertexShaderObject, webgl.COMPILE_STATUS)) {
        alert(webgl.getShaderInfoLog(vertexShaderObject))
        return
    }
    return vertexShaderObject
}

export function initFragmentShader(shaderSource: string, webgl: WebGLRenderingContext) {
    const fragmentShaderObject = webgl.createShader(webgl.FRAGMENT_SHADER)!
    webgl.shaderSource(fragmentShaderObject, shaderSource)
    webgl.compileShader(fragmentShaderObject)
    if (!webgl.getShaderParameter(fragmentShaderObject, webgl.COMPILE_STATUS)) {
        alert(webgl.getShaderInfoLog(fragmentShaderObject))
        return
    }
    return fragmentShaderObject
}


export function createBufferInfoFromArrays(gl: WebGLRenderingContext, arrays: any, opt_mapping: any = null) {
    const bufferInfo: any = {
        attribs: createAttribsFromArrays(gl, arrays, opt_mapping),
    };
    let indices = arrays.indices;
    if (indices) {
        indices = makeTypedArray(indices, 'indices');
        bufferInfo.indices = createBufferFromTypedArray(gl, indices, gl.ELEMENT_ARRAY_BUFFER);
        bufferInfo.numElements = indices.length;
    } else {
        bufferInfo.numElements = getNumElementsFromNonIndexedArrays(arrays);
    }
    return bufferInfo
}

function getArray(array) {
    return array.length ? array : array.data;
}


function getNumComponents(array, arrayName) {
    return array.numComponents || array.size || guessNumComponentsFromName(arrayName, getArray(array).length);
}

const positionKeys = ['position', 'positions', 'a_position'];
function getNumElementsFromNonIndexedArrays(arrays) {
    let key;
    for (const k of positionKeys) {
        if (k in arrays) {
            key = k;
            break;
        }
    }
    key = key || Object.keys(arrays)[0];
    const array = arrays[key];
    const length = getArray(array).length;
    const numComponents = getNumComponents(array, key);
    const numElements = length / numComponents;
    if (length % numComponents > 0) {
        throw new Error(`numComponents ${numComponents} not correct for length ${length}`);
    }
    return numElements;
}

export function createAttribsFromArrays(gl: WebGLRenderingContext, arrays: any, opt_mapping: any) {
    console.log(arrays)
    const mapping = opt_mapping || createMapping(arrays);
    const attribs = {};
    Object.keys(mapping).forEach(function (attribName) {
        const bufferName = mapping[attribName];
        const origArray = arrays[bufferName];
        if (origArray.value) {
            attribs[attribName] = {
                value: origArray.value,
            };
        } else {
            const array = makeTypedArray(origArray, bufferName);
            // console.log(attribName, array)
            attribs[attribName] = {
                buffer: createBufferFromTypedArray(gl, array),
                numComponents: origArray.numComponents || array.numComponents,
                type: getGLTypeForTypedArray(gl, array),
                normalize: getNormalizationForTypedArray(array),
            };
        }
    });
    return attribs;
}

function getNormalizationForTypedArray(typedArray) {
    if (typedArray instanceof Int8Array) { return true; }  // eslint-disable-line
    if (typedArray instanceof Uint8Array) { return true; }  // eslint-disable-line
    return false;
}

function getGLTypeForTypedArray(gl, typedArray) {
    if (typedArray instanceof Int8Array) { return gl.BYTE; }            // eslint-disable-line
    if (typedArray instanceof Uint8Array) { return gl.UNSIGNED_BYTE; }   // eslint-disable-line
    if (typedArray instanceof Int16Array) { return gl.SHORT; }           // eslint-disable-line
    if (typedArray instanceof Uint16Array) { return gl.UNSIGNED_SHORT; }  // eslint-disable-line
    if (typedArray instanceof Int32Array) { return gl.INT; }             // eslint-disable-line
    if (typedArray instanceof Uint32Array) { return gl.UNSIGNED_INT; }    // eslint-disable-line
    if (typedArray instanceof Float32Array) { return gl.FLOAT; }           // eslint-disable-line
    throw 'unsupported typed array type';
}

function makeTypedArray(array, name) {
    if (isArrayBuffer(array)) {
        return array;
    }

    if (array.data && isArrayBuffer(array.data)) {
        return array.data;
    }

    if (Array.isArray(array)) {
        array = {
            data: array,
        };
    }

    if (!array.numComponents) {
        // console.error("need implementation of guessNumComponentsFromName")
        array.numComponents = guessNumComponentsFromName(name, array.length);
    }

    let type = array.type;
    if (!type) {
        if (name === 'indices') {
            type = Uint16Array;
        }
    }
    const typedArray = createAugmentedTypedArray(array.numComponents, array.data.length / array.numComponents | 0, type);
    typedArray.push(array.data);
    return typedArray;
}


function guessNumComponentsFromName(name: string, length: number | null) {
    let numComponents: number;
    if (name.indexOf('coord') >= 0) {
        numComponents = 2;
    } else if (name.indexOf('color') >= 0) {
        numComponents = 4;
    } else {
        numComponents = 3;  // position, normals, indices ...
    }

    if (length % numComponents > 0) {
        throw 'can not guess numComponents. You should specify it.';
    }

    return numComponents;
}

function createAugmentedTypedArray(numComponents, numElements, opt_type) {
    const Type = opt_type || Float32Array;
    return augmentTypedArray(new Type(numComponents * numElements), numComponents);
}

function augmentTypedArray(typedArray, numComponents) {
    let cursor = 0;
    typedArray.push = function () {
        for (let ii = 0; ii < arguments.length; ++ii) {
            const value = arguments[ii];
            if (value instanceof Array || (value.buffer && value.buffer instanceof ArrayBuffer)) {
                for (let jj = 0; jj < value.length; ++jj) {
                    typedArray[cursor++] = value[jj];
                }
            } else {
                typedArray[cursor++] = value;
            }
        }
    };
    typedArray.reset = function (opt_index) {
        cursor = opt_index || 0;
    };
    typedArray.numComponents = numComponents;
    Object.defineProperty(typedArray, 'numElements', {
        get: function () {
            return this.length / this.numComponents | 0;
        },
    });
    return typedArray;
}

function isArrayBuffer(a) {
    return a.buffer && a.buffer instanceof ArrayBuffer;
}


function createMapping(obj: Object) {
    const mapping = {};
    Object.keys(obj).filter(allButIndices).forEach(function (key) {
        mapping['a_' + key] = key;
    });
    return mapping;
}

function allButIndices(name: string) {
    return name !== 'indices';
}

function createBufferFromTypedArray(gl: WebGLRenderingContext, array: Float32Array, type: number | null = null, drawType: number | null = null) {
    type = type || gl.ARRAY_BUFFER;
    const buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, array, drawType || gl.STATIC_DRAW);
    return buffer;
}
