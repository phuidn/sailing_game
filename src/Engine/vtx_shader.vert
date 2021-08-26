precision mediump float;

attribute vec2  aVertexPosition;
attribute vec2  aUv;
attribute vec4  aColour;
attribute vec4  aMiscA;
attribute vec4  aMiscB;
attribute vec4  aMiscC;

uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;

varying vec2  vUv;
varying vec4  vColour;
varying float vIndex;
varying vec3  vMiscA;
varying vec4  vMiscB;
varying vec4  vMiscC;

void main() {
    vUv = aUv;
    vColour = aColour;
    vIndex = aMiscA[0];
    vMiscA = aMiscA.yzw;
    vMiscB = aMiscB;
    vMiscC = aMiscC;
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
}