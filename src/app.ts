import * as shader from 'shaders/shader-loader';
import * as defaultShader from 'shaders/default-shader';
import * as camera from 'camera';
import * as inputs from 'inputs';

import { Model } from 'gltf/parsedMesh';
import { loadModel } from 'gltf/gltf';
import { update } from 'gltf/animator';
import { renderModel } from 'gltf/renderer';
import { DefaultShader } from 'shaders/default-shader';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
window['gl'] = canvas.getContext('webgl2') as WebGL2RenderingContext;

const cam = {
    rY: 0.0,
    rX: 0.0,
    distance: 3.0,
} as camera.Camera;

const setSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

if (!gl) {
    alert('WebGL 2 not available')
}

const render = (shader: DefaultShader, models: Model[]) => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    const cameraMatrix = camera.update(cam, canvas.width, canvas.height);
    gl.uniform3f(shader.cameraPosition, cameraMatrix.position[0], cameraMatrix.position[1], cameraMatrix.position[2]);
    gl.uniformMatrix4fv(shader.pMatrix, false, cameraMatrix.pMatrix);
    gl.uniformMatrix4fv(shader.vMatrix, false, cameraMatrix.vMatrix);

    models.forEach(model => {
        update(model, shader);
        renderModel(model, model.rootNode, model.nodes[model.rootNode].localBindTransform, shader);
    });


    requestAnimationFrame(() => {
        render(shader, models);
    });
};

const startup = async () => {
    gl.clearColor(0.3, 0.3, 0.3, 1);
    gl.enable(gl.DEPTH_TEST);

    window.onresize = () => { setSize(); };
    setSize();

    const program = shader.createProgram();
    gl.attachShader(program, await shader.loadShader('default.vert', gl.VERTEX_SHADER));
    gl.attachShader(program, await shader.loadShader('default.frag', gl.FRAGMENT_SHADER));
    shader.linkProgram(program);

    const uniforms = defaultShader.getUniformLocations(program);

    const urlParams = new URLSearchParams(window.location.search);
    const modelNames = urlParams.get('model') || 'waterbottle';
    const models = await Promise.all(modelNames.split(',').map(m => loadModel(m)));
    console.log(models);

    render(uniforms, models);
};

const rotate = (delta: inputs.Position) => {
    cam.rX -= delta.x;
    cam.rY -= delta.y;
};

const zoom = (delta: number) => {
    cam.distance *= 1.0 + delta;
    if (cam.distance < 0.0) cam.distance = 0.0;
};

inputs.listen(canvas, rotate, zoom);
startup();
