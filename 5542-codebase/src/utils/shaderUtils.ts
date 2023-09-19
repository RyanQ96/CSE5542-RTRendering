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

export function initFragmentShader(shaderSource:string, webgl: WebGLRenderingContext) {
    const fragmentShaderObject = webgl.createShader(webgl.FRAGMENT_SHADER)!
    webgl.shaderSource(fragmentShaderObject, shaderSource) 
    webgl.compileShader(fragmentShaderObject)
    if (!webgl.getShaderParameter(fragmentShaderObject, webgl.COMPILE_STATUS)) {
        alert(webgl.getShaderInfoLog(fragmentShaderObject))
        return 
    }
    return fragmentShaderObject 
}