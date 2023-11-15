declare var mat4: any


export type TCoordSpaceLayout = {
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number
}


export function getIdentifyMatrix(): Float32Array {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

export function getProjectionMatrix(layout: TCoordSpaceLayout) {
    const { xMin, xMax, yMin, yMax } = layout
    return new Float32Array([
        2.0 / (xMax - xMin), 0, 0, 0,
        0, 2.0 / (yMax - yMin), 0, 0,
        0, 0, 1, 0,
        -(xMax + xMin) / (xMax - xMin), -(yMax + yMin) / (yMax - yMin), 0, 1
    ])
}

export function getPerspectiveProjectionMatrix(canvas: HTMLCanvasElement) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const aspect = width / height;

    return mat4.perspective(mat4.create(), Math.PI / 3, aspect, 0.1, 100.0)
}

export function getFrustumProjectionMatrix(layout: TCoordSpaceLayout) {
    const { xMin, xMax, yMin, yMax } = layout
    return mat4.frustum(mat4.create(), xMin, xMax, yMin, yMax, .1, 100.0)
}


export function getRotateMatrix(theta: number) {
    return new Float32Array([
        Math.cos(theta), Math.sin(theta), 0.0, 0.0,
        -Math.sin(theta), Math.cos(theta), 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0]);
}

export function getRotateYMatrix(theta: number) {
    return new Float32Array([
        Math.cos(theta), 0.0, Math.sin(theta), 0.0,
        0.0, 1.0, 0.0, 0.0,
        -Math.sin(theta), 0, Math.cos(theta), 0.0,
        0.0, 0.0, 0.0, 1.0]);
}

export function getRotateXMatrix(theta: number) {
    return new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0, Math.cos(theta), -Math.sin(theta), 0.0,
        0, Math.sin(theta), Math.cos(theta), 0.0,
        0.0, 0.0, 0.0, 1.0]);
}

export function getInverseRotateMatrix(theta: number) {
    return new Float32Array([
        Math.cos(theta), -Math.sin(theta), 0.0, 0.0,
        Math.sin(theta), Math.cos(theta), 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0, 0, 0, 1.0]);
}

export function getInverseScaleMatrix(x: number, y: number, z: number = 1) {
    return new Float32Array([
        1 / x, 0, 0, 0,
        0, 1 / y, 0, 0,
        0, 0, 1 / z, 0,
        0, 0, 0, 1])
}

export function getScaleMatrix(x: number, y: number, z: number = 1) {
    return new Float32Array([
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1])
}

export function getTransiationMatrix(x: number, y: number, z: number = 0) {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1])
}

export function getInverseProjectionMatrix(layout: TCoordSpaceLayout) {
    const { xMin, xMax, yMin, yMax } = layout
    return new Float32Array([
        (xMax - xMin) / 2.0, 0, 0, 0,
        0, (yMax - yMin) / 2.0, 0, 0,
        0, 0, 1, 0,
        (xMax + xMin) / 2.0, (yMax + yMin) / 2.0, 0, 1
    ])
}

export function matmul(A: Float32Array, B: Float32Array, ...args: Float32Array[]): Float32Array {
    let C = new Float32Array(16);
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            var dot = 0;
            for (var k = 0; k < 4; k++)
                dot += A[i + k * 4] * B[k + j * 4]; // dot += A[i][k] * B[k][j];
            C[i + j * 4] = dot; // C[i][j] = dot;
        }
    }
    if (args.length > 1) {
        return matmul(C, matmul(args[0], args[1], ...args.slice(2)))
    } else if (args.length === 1) {
        return matmul(C, args[0])
    } else {
        return C
    }
}

export function matv(matrix: Float32Array, x: Float32Array) {
    // multiply matrix with vector
    let C = new Float32Array(4);
    for (var i = 0; i < 4; i++) {
        var dot = 0;
        for (var k = 0; k < 4; k++)
            dot += matrix[i + k * 4] * x[k]; // dot += A[i][k] * B[k][j];
        C[i] = dot; // C[i][j] = dot;
    }
    return C
}


function getRotationMatrix(yaw: number, pitch: number, roll: number) {
    // Convert angles from degrees to radians
    let yawRad = yaw * Math.PI / 180.0;
    let pitchRad = pitch * Math.PI / 180.0;
    let rollRad = roll * Math.PI / 180.0;

    // Yaw rotation matrix around the Y-axis
    let yawMatrix = mat4.create();
    mat4.rotate(yawMatrix, yawMatrix, yawRad, [0, 1, 0]);

    // Pitch rotation matrix around the X-axis
    let pitchMatrix = mat4.create();
    mat4.rotate(pitchMatrix, pitchMatrix, pitchRad, [1, 0, 0]);

    // Roll rotation matrix around the Z-axis
    let rollMatrix = mat4.create();
    mat4.rotate(rollMatrix, rollMatrix, rollRad, [0, 0, 1]);

    // Combine the rotation matrices
    let rotationMatrix = mat4.create();
    mat4.multiply(rotationMatrix, yawMatrix, pitchMatrix); // Yaw * Pitch
    mat4.multiply(rotationMatrix, rotationMatrix, rollMatrix); // (Yaw * Pitch) * Roll

    return rotationMatrix;
}

export function getViewMatrix(yaw: number, pitch: number, roll: number, cameraPosition: number[]) {
    // Get the rotation matrix from yaw, pitch, and roll
    let rotationMatrix = getRotationMatrix(yaw, pitch, roll);

    // Translate the camera to its position
    let viewMatrix = mat4.create();
    mat4.translate(viewMatrix, viewMatrix, cameraPosition);

    // Apply the rotation matrix to the view matrix
    mat4.multiply(viewMatrix, viewMatrix, rotationMatrix);

    // Invert the matrix for the camera transformation
    mat4.invert(viewMatrix, viewMatrix);

    return viewMatrix;
}


export function addVector(a: number[] | Float32Array, b: number[] | Float32Array): Float32Array {
    let res = a.map((v, ndx) => v + b[ndx])
    return new Float32Array(res)
}


export function subtractVector(a: number[] | Float32Array, b: number[] | Float32Array): Float32Array {
    let res = a.map((v, ndx) => v - b[ndx])
    return new Float32Array(res)
}


export function scaleVector(v: number[] | Float32Array, s: number): Float32Array {
    return new Float32Array(v.map(v => v * s))
}


export function normalizeVector(v: number[] | Float32Array | any): Float32Array {
    let len = Math.sqrt(v.reduce((sum, v) => sum + v * v, 0))
    if (length > 0.00001) {
        return scaleVector(v, 1 / len)
    } else {
        return new Float32Array(v.length)
    }
}


export function inverse(a) {
    let b = a
    var c = a[0], d = a[1], e = a[2], g = a[3], f = a[4], h = a[5], i = a[6], j = a[7], k = a[8], l = a[9], o = a[10], m = a[11], n = a[12], p = a[13], r = a[14], s = a[15], A = c * h - d * f, B = c * i - e * f, t = c * j - g * f, u = d * i - e * h, v = d * j - g * h, w = e * j - g * i, x = k * p - l * n, y = k * r - o * n, z = k * s - m * n, C = l * r - o * p, D = l * s - m * p, E = o * s - m * r, q = 1 / (A * E - B * D + t * C + u * z - v * y + w * x);
    b[0] = (h * E - i * D + j * C) * q;
    b[1] = ( - d * E + e * D - g * C) * q;
    b[2] = (p * w - r * v + s * u) * q;
    b[3] = ( - l * w + o * v - m * u) * q;
    b[4] = ( - f * E + i * z - j * y) * q;
    b[5] = (c * E - e * z + g * y) * q;
    b[6] = ( - n * w + r * t - s * B) * q;
    b[7] = (k * w - o * t + m * B) * q;
    b[8] = (f * D - h * z + j * x) * q;
    b[9] = ( - c * D + d * z - g * x) * q;
    b[10] = (n * v - p * t + s * A) * q;
    b[11] = ( - k * v + l * t - m * A) * q;
    b[12] = ( - f * C + h * y - i * x) * q;
    b[13] = (c * C - d * y + e * x) * q;
    b[14] = ( - n * u + p * B - r * A) * q;
    b[15] = (k * u - l * B + o * A) * q;
    return b
};

mat4.inverse = inverse; 