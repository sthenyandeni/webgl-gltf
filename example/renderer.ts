import { mat4 } from 'gl-matrix';
import { Model, GLBuffer } from 'webgl-gltf';
import { DefaultShader } from './shaders/default-shader';

enum VaryingPosition {
    Positions = 0,
    Normal = 1,
    Tangent = 2,
    TexCoord = 3,
    Joints = 4,
    Weights = 5,
};

const bindBuffer = (gl: WebGL2RenderingContext, position: VaryingPosition, buffer: GLBuffer | null) => {
    if (buffer === null) return;

    gl.enableVertexAttribArray(position);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
    gl.vertexAttribPointer(position, buffer.size, buffer.type, false, 0, 0);

    return buffer;
};

const applyTexture = (gl: WebGL2RenderingContext, texture: WebGLTexture | null, textureTarget: number, textureUniform: WebGLUniformLocation, enabledUniform?: WebGLUniformLocation) => {
    if (texture) {
        gl.activeTexture(gl.TEXTURE0 + textureTarget);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(textureUniform, textureTarget);
    }

    if (enabledUniform !== undefined) gl.uniform1i(enabledUniform, texture ? 1 : 0);
}

const renderModel = (gl: WebGL2RenderingContext, model: Model, node: number, transform: mat4, shader: DefaultShader) => {
    const t = mat4.create();
    mat4.multiply(t, transform, model.nodes[node].localBindTransform);

    if (model.nodes[node].mesh !== undefined) {
        const mesh = model.meshes[model.nodes[node].mesh!];
        const material = model.materials[mesh.material];

        if (material) {
            applyTexture(gl, material.baseColorTexture, 1, shader.baseColorTexture, shader.hasBaseColorTexture);
            applyTexture(gl, material.metallicRoughnessTexture, 2, shader.metallicRoughnessTexture, shader.hasMetallicRoughnessTexture);
            applyTexture(gl, material.emissiveTexture, 3, shader.emissiveTexture, shader.hasEmissiveTexture);
            applyTexture(gl, material.normalTexture, 4, shader.normalTexture, shader.hasNormalTexture);
            applyTexture(gl, material.occlusionTexture, 5, shader.occlusionTexture, shader.hasOcclusionTexture);

            gl.uniform4f(shader.baseColorFactor, material.baseColorFactor[0], material.baseColorFactor[1], material.baseColorFactor[2], material.baseColorFactor[3]);
            gl.uniform1f(shader.metallicFactor, material.metallicFactor);
            gl.uniform1f(shader.roughnessFactor, material.roughnessFactor);
            gl.uniform3f(shader.emissiveFactor, material.emissiveFactor[0], material.emissiveFactor[1], material.emissiveFactor[2]);
        }

        bindBuffer(gl, VaryingPosition.Positions, mesh.positions);
        bindBuffer(gl, VaryingPosition.Normal, mesh.normals);
        bindBuffer(gl, VaryingPosition.Tangent, mesh.tangents);
        bindBuffer(gl, VaryingPosition.TexCoord, mesh.texCoord);
        bindBuffer(gl, VaryingPosition.Joints, mesh.joints);
        bindBuffer(gl, VaryingPosition.Weights, mesh.weights);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
        gl.uniformMatrix4fv(shader.mMatrix, false, transform);

        gl.drawElements(gl.TRIANGLES, model.meshes[0].elements, gl.UNSIGNED_SHORT, 0);
    }

    model.nodes[node].children.forEach(c => {
        renderModel(gl, model, c, transform, shader);
    });
};

export {
    renderModel,
};
