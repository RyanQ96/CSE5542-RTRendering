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


export function getRotateMatrix(theta: number) {
    return new Float32Array([
        Math.cos(theta), Math.sin(theta), 0.0, 0.0,
        -Math.sin(theta), Math.cos(theta), 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0]);
}

export function getInverseRotateMatrix(theta: number) {
    return new Float32Array([
        Math.cos(theta), -Math.sin(theta), 0.0, 0.0,
        Math.sin(theta), Math.cos(theta), 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0, 0, 0, 1.0]);
}

export function getInverseScaleMatrix(x: number, y: number) {
    return new Float32Array([
        1 / x, 0, 0, 0,
        0, 1 / y, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1])
}

export function getScaleMatrix(x: number, y: number) {
    return new Float32Array([
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1])
}

export function getTransiationMatrix(x: number, y: number) {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, 0, 1
    ])
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