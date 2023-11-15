<h2 align="center">CSE5542-RTRendering Lab 4</h2>

![image](./assets/lab4.png)
### Content
* Quick preview (deployed version): <a href="https://ryanq96.github.io/CSE5542-RTRendering/">URL</a>
* Codebase: https://github.com/RyanQ96/CSE5542-RTRendering
* Additional Object invited from <a href="https://webglfundamentals.org/webgl/resources/models/windmill/windmill.obj"> here!</a>
* Framework References: 
  * <a href="https://vuejs.org/">VueJS</a>: the framework for the interface. 
  * <a href="https://vuetifyjs.com/">VuetifyJS</a>: UI component library.
* How to run from Github:
  1. <code>git clone https://github.com/RyanQ96/CSE5542-RTRendering.git</code>
  2. <code>npm install</code> (make sure npm is installed on your local machine)
  3. <code>cd 5542-codebase</code>
  4. <code>git checkout lab3</code>
  5. <code>npm run dev</code> 
* Run from the ZIP (might have environment configuration issue) 
  1. <code>npm run dev</code>

* Repository Walkthrough 
  * <code>5542-codebase/src/</code> 
    * <code>components</code>: vue component for the interface, including appbar and the main view (canvas) of the interface 
    * <code>utils</code>: utility methods generally used in initialize webgl program 
      * <code>shaderUtils.ts</code>: utility functions to initialize shaders
      * <a><code style="color: green">matrix.ts</code>: matrix utility functions,including creating projection, translation, rotation matrix, their inverse and also matrix and vector multiplication operations.</a>
      * <a><code style="color: green">hierarchymodel.ts</code>: hierarchical model, including <code>HObj</code>class, its children class <code>Global</code> and each one of the shapes <code>Sphere</code>, <code>Cylinder</code>, <code>Cube</code> el al.</a>
      * <a><code style="color: green">obj.ts</code>: class extends HObj, hierarchical model, including <code>OBJGeneral</code>class, its a generic class for <code>.obj</code> object and support rendering vertex shader, fragment shader and also texture.</a>
      * <a><code style="color: green">objUtils.ts</code> Utility functions for parsing OBJ files. Borrowed from https://webglfundamentals.org/webgl/webgl-load-obj-w-mtl-w-normal-maps.html.</a>
    * <code>core</code>: core code for eventhander and webgl rendering
      * <code>setup-lab4.ts</code>: setup event listener 
      * <code>drawwebgl-new.ts</code>: main rendering code, function <code>initShape</code> is the function that create all the shapes (table, cube, sphere, album and the invited new obj) and vertical node.