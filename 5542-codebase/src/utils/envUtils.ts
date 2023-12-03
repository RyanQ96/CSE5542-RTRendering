export function createXYQuadVertices(size?: number, xOffset?: number, yOffset?: number) {
    size = size || 2;
    xOffset = xOffset || 0;
    yOffset = yOffset || 0;
    size *= 0.5;
    return {
      position: {
        numComponents: 2,
        data: [
          xOffset + -1 * size, yOffset + -1 * size,
          xOffset +  1 * size, yOffset + -1 * size,
          xOffset + -1 * size, yOffset +  1 * size,
          xOffset +  1 * size, yOffset +  1 * size,
        ],
      },
      normal: [
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
      ],
      texcoord: [
        0, 0,
        1, 0,
        0, 1,
        1, 1,
      ],
      indices: [ 0, 1, 2, 2, 1, 3 ],
    };
  }