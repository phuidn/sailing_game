import * as PIXI from "pixi.js"
import { Point } from "pixi.js";

export class SDFVertex {
    aVertexPosition: Point;
    aColour: number;
    aIndex: number;
    aUV: [number, number] = [0,0];
    aMiscA: [number, number, number] = [0,0,0];
    aMiscB: [number, number, number, number] = [0,0,0,0];
    aMiscC: [number, number, number, number] = [0,0,0,0];

    constructor(position: Point, colour: number, index: number,
        fields? : {
            aUV?: [number, number], 
            aMiscA?: [number, number, number],
            aMiscB?: [number, number, number, number],
            aMiscC?: [number, number, number, number]
        }) {
        this.aVertexPosition = position;
        this.aColour = colour;
        this.aIndex = index;
        if (fields)
            Object.assign(this, fields);
    }
}

export interface SDFShapeGeo {
    vertices: SDFVertex[],
    indices: number[]
}

export class SDFGeometry extends PIXI.Geometry {

    _buffer: PIXI.Buffer;
    _indexBuffer: PIXI.Buffer;

    constructor() {
        super();

        this._buffer = new PIXI.Buffer(undefined, false, false);
        this._indexBuffer = new PIXI.Buffer(undefined, false, true);

        this.addAttribute("aVertexPosition", this._buffer, 2, false, PIXI.TYPES.FLOAT,56, 0)
        this.addAttribute("aUv", this._buffer, 2, false, PIXI.TYPES.FLOAT, 56, 8);
        this.addAttribute("aMiscA", this._buffer, 4, false, PIXI.TYPES.UNSIGNED_BYTE, 56, 16);
        this.addAttribute("aColour", this._buffer, 4, true, PIXI.TYPES.UNSIGNED_BYTE, 56, 20);
        this.addAttribute("aMiscB", this._buffer, 4, false, PIXI.TYPES.FLOAT, 56, 24);
        this.addAttribute("aMiscC", this._buffer, 4, false, PIXI.TYPES.FLOAT, 56, 40);
        this.addIndex(this._indexBuffer);
    }

    setBuffers(vertices: SDFVertex[], indices: number[]) {
        const nVerts = vertices.length;
        let arrayBuffer = new ArrayBuffer(nVerts * 14 * 4); // 14 = number of floats per vertex (aColour = 1 float)
        let floatBuffer = new Float32Array(arrayBuffer);
        let int8Buffer  = new Int8Array(arrayBuffer);

        let p = 0;
        vertices.forEach((vertex) => {
            floatBuffer[p++] = vertex.aVertexPosition.x;
            floatBuffer[p++] = vertex.aVertexPosition.y;
            floatBuffer[p++] = vertex.aUV[0]; 
            floatBuffer[p++] = vertex.aUV[1];

            int8Buffer[4 * p] = vertex.aIndex;
            int8Buffer[(4 * p) + 1] = vertex.aMiscA[0];
            int8Buffer[(4 * p) + 2] = vertex.aMiscA[1];
            int8Buffer[(4 * p) + 3] = vertex.aMiscA[2];
            p++;

            int8Buffer[4 * p] = vertex.aColour >> 24;
            int8Buffer[(4 * p) + 1] = vertex.aColour >> 16;
            int8Buffer[(4 * p) + 2] = vertex.aColour >> 8;
            int8Buffer[(4 * p) + 3] = vertex.aColour;
            p++;

            floatBuffer[p++] = vertex.aMiscB[0];
            floatBuffer[p++] = vertex.aMiscB[1];
            floatBuffer[p++] = vertex.aMiscB[2];
            floatBuffer[p++] = vertex.aMiscB[3];

            floatBuffer[p++] = vertex.aMiscC[0];
            floatBuffer[p++] = vertex.aMiscC[1];
            floatBuffer[p++] = vertex.aMiscC[2];
            floatBuffer[p++] = vertex.aMiscC[3];
        });

        this._buffer.update(floatBuffer);

        const ixArray = new Uint16Array(indices);
        this.indexBuffer.update(ixArray);
    }

}