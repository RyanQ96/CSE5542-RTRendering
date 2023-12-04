
export const coreVertexShader = /* glsl */ `
    precision  lowp  float; 
    attribute vec3 a_position; 
    attribute vec4 a_color;  
    attribute vec3 a_normal;
    attribute vec3 a_tangent;
    attribute vec2 a_texcoord;

    uniform mat4 ProjectMat; 
    uniform mat4 TransformMat; 
    uniform mat4 viewMatrix;
    uniform mat4 normalMatrix; 

    uniform vec3 eye_pos; // pos of camera

    uniform vec4 light_pos; 
    uniform vec4 ambient_coef;
    uniform vec4 diffuse_coef;
    uniform vec4 specular_coef;
    uniform float mat_shininess; 

    uniform vec4 light_ambient; 
    uniform vec4 light_diffuse; 
    uniform vec4 light_specular;


    uniform bool useTexture;
    uniform bool useReflection; 

    varying vec4 v4OutColor; 
    varying vec4 vPos; 
    varying vec2 vTextureCoord;
    varying vec3 v_normal;
    varying vec3 v_tangent; 
    varying vec3 v_surfaceToView;
    varying vec4 light_pos_in_eye; 


    varying vec3 v_worldPosition; 
    varying vec3 v_worldNormal; 

    void main() {

        v4OutColor = a_color;
        vPos = viewMatrix * TransformMat * vec4(a_position, 1.0);
        light_pos_in_eye = viewMatrix * light_pos;
        v_surfaceToView = normalize(-vec3(vPos));
        v_normal = normalize(vec3(normalMatrix*vec4(a_normal,0.0)));
        if (useTexture) {
            vTextureCoord = a_texcoord;
            v_tangent = a_tangent; 
        }
        v_worldPosition = (TransformMat * vec4(a_position, 1.0)).xyz; 
        v_worldNormal = mat3(TransformMat) * a_normal;
        // if (useReflection) {
           
        //     // v_worldNormal = vec3(1,0,0);
        // }
        gl_Position = ProjectMat * viewMatrix * TransformMat * vec4(a_position, 1.0); 
        gl_PointSize = 10.0;
    }
`

export const coreFragmentShader = /* glsl */ `
    precision mediump float;
    uniform bool useTexture; 
    uniform sampler2D normalMap;
    uniform sampler2D diffuseMap;
    uniform sampler2D specularMap;
    
    uniform vec4 light_pos; 
    uniform vec4 ambient_coef;
    uniform vec4 diffuse_coef;
    uniform vec4 specular_coef;
    uniform float mat_shininess; 

    uniform vec4 light_ambient; 
    uniform vec4 light_diffuse; 
    uniform vec4 light_specular;    

    uniform vec3 eye_pos; // pos of camera

    varying vec4 v4OutColor;
    varying vec4 vPos; 
    varying vec2 vTextureCoord;
    varying vec3 v_normal;
    varying vec3 v_tangent; 
    varying vec3 v_surfaceToView;
    varying vec4 light_pos_in_eye;
    
    varying vec3 v_worldPosition; 
    varying vec3 v_worldNormal; 
    uniform samplerCube u_texture;
    uniform bool useReflection; 

    void main() {
        vec3 worldNormal = normalize(v_worldNormal);
        vec3 eyeToSurfaceDir = normalize(v_worldPosition - eye_pos);
        vec3 direction = reflect(eyeToSurfaceDir,worldNormal);
        vec4 reflectedColor = textureCube(u_texture, direction);
        if (useReflection) {
            gl_FragColor = reflectedColor;
        } else {
            if (useTexture) {
                gl_FragColor = vec4(1,0,0,1);
                vec3 normal = normalize(v_normal) * ( float( gl_FrontFacing ) * 2.0 - 1.0 );
                vec3 tangent = normalize(v_tangent) * ( float( gl_FrontFacing ) * 2.0 - 1.0 );
                vec3 bitangent = normalize(cross(normal, tangent));
                mat3 tbn = mat3(tangent, bitangent, normal);
                normal = texture2D(normalMap, vTextureCoord).rgb * 2. - 1.;
                normal = normalize(tbn * normal);
                vec3 light_vector = normalize(vec3(light_pos_in_eye - vPos));
                vec3 eye_vector = normalize(v_surfaceToView);
                vec4 ambient = ambient_coef * light_ambient * .1; 
                float ndotl = max(dot(v_normal, light_vector), 0.0);

                vec4 diffuseMapColor = texture2D(diffuseMap, vTextureCoord);
                vec4 diffuse = diffuse_coef * light_diffuse * ndotl * diffuseMapColor;

                vec3 R = normalize(2.0 * ndotl *v_normal-eye_vector);
                // vec3 R= normalize(vec3(reflect(-light_vector, v_normal))); 
                float rdotv = max(dot(R, eye_vector), 0.0);

                vec4 specular;  
                if (ndotl>0.0) {
                    vec4 specularMapColor = texture2D(specularMap, vTextureCoord);
                    specular = specular_coef * light_specular*pow(rdotv, mat_shininess) * specularMapColor; 
                    // specular = vec4(1,1,0,1);
                } else {
                    specular = vec4(0,0,0,1);
                }
                // gl_FragColor = vec4(ambient);
                gl_FragColor = (diffuse); // set all fragments to red
            } else {
                vec4 texColor = v4OutColor;
                vec3 light_vector = normalize(vec3(light_pos_in_eye - vPos));
                vec3 eye_vector = normalize(v_surfaceToView);
                vec4 ambient = ambient_coef * light_ambient * texColor; 
                float ndotl = max(dot(v_normal, light_vector), 0.0); 
                vec4 diffuse = diffuse_coef * light_diffuse* ndotl * texColor;
                vec3 R= normalize(vec3(reflect(-light_vector, v_normal))); 
                // vec3 R = normalize(2.0 * ndotl *v_normal-eye_vector);
                float rdotv = max(dot(R, eye_vector), 0.0);
                vec4 specular;  
                if (useReflection) {
                    vec3 worldNormal = normalize(v_worldNormal);
                    vec3 eyeToSurfaceDir = normalize(v_worldPosition - eye_pos);
                    vec3 direction = reflect(eyeToSurfaceDir,worldNormal);
                    gl_FragColor = textureCube(u_texture, direction);
                } else {
                    if (ndotl>0.0) {
                        specular = specular_coef * light_specular * pow(rdotv, mat_shininess); 
                        // diffuse = vec4(0,1,0,1) * ndotl; 
                    } else {
                        specular = vec4(0,0,0,1); 
                        // diffuse = vec4(1,0,0,1);
                    }
                    gl_FragColor = diffuse; // set all fragments to red
                }          
            }
        } 
    }
`