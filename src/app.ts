import * as shader from 'shaders/shader-loader';
import * as defaultShader from 'shaders/default-shader';
import { initializeCamera } from 'camera';
import { Model } from 'gltf/parsedMesh';
import { loadModel } from 'gltf/gltf';
import { update } from 'gltf/animator';
import { bind } from 'gltf/renderer';

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;

const setSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

if (!gl) {
    console.error("WebGL 2 not available");
}

const render = (program: WebGLProgram, model: Model) => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    const camera = initializeCamera(canvas.width, canvas.height);
    const uniforms = defaultShader.getUniformLocations(gl, program);

    bind(gl, model, model.rootNode, model.nodes[model.rootNode].localBindTransform, uniforms);
    update(gl, model, uniforms);

    gl.uniformMatrix4fv(uniforms.pMatrixLoc, false, camera.pMatrix);
    gl.uniformMatrix4fv(uniforms.mvMatrixLoc, false, camera.mvMatrix);
    gl.drawElements(gl.TRIANGLES, model.meshes[0].elements, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(() => {
        render(program, model);
    });
};

const startup = async () => {
    gl.clearColor(0.3, 0.3, 0.3, 1);
    gl.enable(gl.DEPTH_TEST);

    window.onresize = () => { setSize(); };
    setSize();

    const program = shader.createProgram(gl);
    gl.attachShader(program, await shader.loadShader(gl, 'default.vert', gl.VERTEX_SHADER));
    gl.attachShader(program, await shader.loadShader(gl, 'default.frag', gl.FRAGMENT_SHADER));
    shader.linkProgram(gl, program);

    const model = await loadModel(gl, 'suzanne');
    console.log(model);

    render(program, model);
};

startup();
