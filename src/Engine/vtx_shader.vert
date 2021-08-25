#version 300 es

precision mediump float;

in vec2  aVertexPosition;
in vec2  aUv;
in vec4  aColour;
in vec4  aMiscA;
in vec4  aMiscB;
in vec4  aMiscC;

uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;

out vec2  vUv;
out vec4  vColour;
out float vIndex;
out vec3  vMiscA;
out vec4  vMiscB;
out vec4  vMiscC;

void main() {
    vUv = aUv;
    vColour = aColour;
    vIndex = aMiscA[0];
    vMiscA = aMiscA.yzw;
    vMiscB = aMiscB;
    vMiscC = aMiscC;
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
}