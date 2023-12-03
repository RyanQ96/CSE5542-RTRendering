export const envVertexShader = /* glsl */ `
    attribute vec4 a_position; 
    varying vec4 v_position; 
    void main() {
        v_position = a_position; 
        gl_Position = vec4(a_position.xy, 1, 1);
    }
`

export const envFragmentShader = /* glsl */ `
    precision mediump float; 

    uniform samplerCube u_skybox;
    uniform mat4 u_viewDirectionProjectionInverse; 

    varying vec4 v_position; 
    void main() {
        vec4 textureSpaceEnvPosition = u_viewDirectionProjectionInverse * v_position;
        gl_FragColor = textureCube(u_skybox, normalize(textureSpaceEnvPosition.xyz / textureSpaceEnvPosition.w));
    }
`