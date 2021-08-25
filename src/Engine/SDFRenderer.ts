import { DRAW_MODES } from "@pixi/constants";
import { ObjectRenderer, Program, Renderer, Shader, State, ViewableBuffer } from "@pixi/core";
import { Loader } from "@pixi/loaders";
import { Matrix } from "@pixi/math";
import { settings } from "@pixi/settings";
import { nextPow2 } from "@pixi/utils";
import SDFContainer from "./SDFContainer";
import { SDFGeometry } from "./SDFGeometry";

class SDFRenderer extends ObjectRenderer {

    size: number;
    vertexSize: number;
    _shader: Shader;
    _flushId: number;
    _packedGeometries: SDFGeometry[];
    _packedGeometryPoolSize: number;
    _vertexCount: number;
    _indexCount: number;
    _bufferSize: number;
    _bufferedElements: SDFContainer[];
    _aBuffers: ViewableBuffer[];
    _iBuffers: Uint16Array[];
    _dcIndex: number;
    _aIndex: number;
    _iIndex: number;
    _attributeBuffer: ViewableBuffer;
    _indexBuffer: Uint16Array;

    public readonly state: State;


    constructor(renderer: Renderer) {
        super(renderer);

        // maximum number of elements in buffers before flush
        this.size = settings.SPRITE_BATCH_SIZE * 4;
        // floats per vertex in SDFGeometry, better to get dynamically if possible
        this.vertexSize = 14;
        
        this._shader = Shader.from(
            Loader.shared.resources.vtx_shader.data, 
            Loader.shared.resources.frag_shader.data,
            {
                "translationMatrix": new Matrix().toArray(true),
                "aa_width": 1,
                "time": 0
            }
        );
    
        this.state = State.for2d();
        this._flushId = 0;

        this._packedGeometries = [];
        this._packedGeometryPoolSize = 1; // 2?

        this._vertexCount = 0;
        this._indexCount = 0;
        this._bufferSize = 0;
        this._bufferedElements = [];

        this._aBuffers = [];
        this._iBuffers = [];
        this._aIndex = 0;
        this._iIndex = 0;
        this._dcIndex = 0;

        this._attributeBuffer = this.getAttributeBuffer(this._vertexCount);
        this._indexBuffer = this.getIndexBuffer(this._indexCount);

        renderer.runners.prerender.add(this);
        renderer.runners.contextChange.add(this);
    }

    prerender(): void
    {
        this._flushId = 0;
    }

    contextChange() : void
    {
        for (let i = 0; i < this._packedGeometryPoolSize; ++i) {
            this._packedGeometries[i] = new SDFGeometry();
        }
    }

    flush(): void
    {
        // flush!
        if (this._vertexCount === 0)
        {
            return;
        }

        this._attributeBuffer = this.getAttributeBuffer(this._vertexCount);
        this._indexBuffer = this.getIndexBuffer(this._indexCount);
        this._aIndex = 0;
        this._iIndex = 0;
        this._dcIndex = 0;

        //this.buildTexturesAndDrawCalls();
        this.packGeometry();
        this.updateBuffers();
        this.drawBatches();

        // reset elements buffer for the next flush
        this._bufferSize = 0;
        this._vertexCount = 0;
        this._indexCount = 0;
    }

    packGeometry() {
        const { float32View } = this._attributeBuffer;
        const indexBuffer = this._indexBuffer;

        let aOffset = 0;
        let iOffset = 0;
        let packedVerts = 0;

        this._bufferedElements.forEach((element) => {
            const iBuffer = element.geometry.indexBuffer;
            for (let i = 0; i < iBuffer.data.length; ++i) {
                indexBuffer[iOffset++] = iBuffer.data[i] + packedVerts;
            }

            const aBuffer = element.geometry.buffers[0];
            float32View.set(aBuffer.data, aOffset);
            aOffset += aBuffer.data.length;
            packedVerts += aBuffer.data.length / this.vertexSize;
        });
        this._bufferedElements = [];
    }

    updateBuffers(): void {
        const {
            _packedGeometries: packedGeometries,
            _attributeBuffer: attributeBuffer,
            _indexBuffer: indexBuffer,
        } = this;

        if (!settings.CAN_UPLOAD_SAME_BUFFER)
        { /* Usually on iOS devices, where the browser doesn't
            like uploads to the same buffer in a single frame. */
            if (this._packedGeometryPoolSize <= this._flushId)
            {
                this._packedGeometryPoolSize++;
                packedGeometries[this._flushId] = new SDFGeometry();
            }

            packedGeometries[this._flushId]._buffer.update(attributeBuffer.rawBinaryData);
            packedGeometries[this._flushId]._indexBuffer.update(indexBuffer);

            this.renderer.geometry.bind(packedGeometries[this._flushId]);
            this.renderer.geometry.updateBuffers();
            this._flushId++;
        }
        else
        {
            // lets use the faster option, always use buffer number 0
            packedGeometries[0]._buffer.update(attributeBuffer.rawBinaryData);
            packedGeometries[0]._indexBuffer.update(indexBuffer);

            this.renderer.geometry.updateBuffers();
        }
    }

    drawBatches() {
        const { gl, state: systemState } = this.renderer;

        systemState.set(this.state);
        gl.drawElements(DRAW_MODES.TRIANGLES, this._indexCount, gl.UNSIGNED_SHORT, 0)

    }

    // size = number of vertices
    getAttributeBuffer(size: number): ViewableBuffer {
        const roundedP2 = nextPow2(Math.ceil(size * this.vertexSize / 8));
        const index = Math.log2(roundedP2);
        const sizeP2 = roundedP2 * 8;

        let buffer = this._aBuffers[index];
        if (!buffer) {
            buffer = this._aBuffers[index] = new ViewableBuffer(sizeP2 * 4);
        }

        return buffer;
    }

    // size = number of indices
    getIndexBuffer(size: number): Uint16Array {
        const roundedP2 = nextPow2(Math.ceil(size / 8));
        const index = Math.log2(roundedP2);
        const sizeP2 = roundedP2 * 8;

        let buffer = this._iBuffers[index];
        if (!buffer) {
            buffer = this._iBuffers[index] = new Uint16Array(sizeP2);
        }

        return buffer;
    }

    destroy(): void
    {
        for (let i = 0; i < this._packedGeometryPoolSize; i++)
        {
            if (this._packedGeometries[i])
            {
                this._packedGeometries[i].destroy();
            }
        }

        this._aBuffers = [];
        this._iBuffers = [];
        this._packedGeometries = [];
        this._attributeBuffer.destroy();
        this._indexBuffer = new Uint16Array();

        if (this._shader)
            this._shader.destroy();
        
        super.destroy();
    }

    start(): void
    {
        this.renderer.state.set(this.state);

        this.renderer.shader.bind(this._shader);

        if (settings.CAN_UPLOAD_SAME_BUFFER)
        {
            // bind buffer #0, we don't need others
            this.renderer.geometry.bind(this._packedGeometries[0]);
        }

    }

    stop(): void
    {
        this.flush();
    }

    render(element: SDFContainer): void
    {
        // 4 * because 4 bytes per float
        const att = Object.keys(element.geometry.attributes)[0];
        const nVerts = 4 * element.geometry.buffers[0].data.length / (element.geometry.attributes[att].stride);
        if (this._vertexCount + nVerts > this.size)
        {
            this.flush();
            console.log("flushing");
        }

        this._vertexCount += nVerts;
        this._indexCount += element.geometry.indexBuffer.data.length;
        this._bufferedElements[this._bufferSize++] = element;
    }
     
}

export default SDFRenderer;