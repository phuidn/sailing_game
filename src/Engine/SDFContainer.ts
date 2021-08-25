import { DRAW_MODES } from "@pixi/constants";
import { Renderer, Shader, State } from "@pixi/core";
import { Container } from "@pixi/display";
import { Loader } from "@pixi/loaders";
import { Matrix, Point, Transform } from "@pixi/math";
import { SDFGeometry, SDFVertex, SDFShapeGeo } from "./SDFGeometry";

export interface SDFShape {
    generateShapeGeo: (transform: Transform) => SDFShapeGeo
}

interface VtxMiscs {
    aMiscA?: [number, number, number],
    aMiscB?: [number, number, number, number],
    aMiscC?: [number, number, number, number]
}

export class SDFCircle implements SDFShape {
    x: number;
    y: number;
    radius: number;
    colour: number;

    constructor(x: number, y: number, radius: number, colour: number) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.colour = colour;
    }

    generateShapeGeo(transform: Transform) {

        const {x, y, colour, radius} = this;
        const bigRadius = radius * 1.1;
        const wt = transform.worldTransform;

        const p1 = wt.apply(new Point(x - bigRadius, y - bigRadius));
        const p2 = wt.apply(new Point(x + bigRadius, y - bigRadius));
        const p3 = wt.apply(new Point(x + bigRadius, y + bigRadius));
        const p4 = wt.apply(new Point(x - bigRadius, y + bigRadius));
        const xy = wt.apply(new Point(x,y));
        const newRadius = radius * wt.a;

        const vertices = [
            new SDFVertex(p1, colour, SDFCircle.index,
                          {aUV: [p1.x,p1.y], aMiscB: [xy.x, xy.y, newRadius,0]}),
            new SDFVertex(p2, colour, SDFCircle.index,
                          {aUV: [p2.x,p2.y], aMiscB: [xy.x, xy.y, newRadius,0]}),                         
            new SDFVertex(p3, colour, SDFCircle.index,
                          {aUV: [p3.x,p3.y], aMiscB: [xy.x, xy.y, newRadius,0]}),
            new SDFVertex(p4, colour, SDFCircle.index,
                          {aUV: [p4.x,p4.y], aMiscB: [xy.x, xy.y, newRadius,0]})
        ];
        const indices = [0,1,2,0,2,3];
        return {
            vertices: vertices,
            indices: indices
        };
    }

    static index = 0;
}

export class SDFBoat implements SDFShape {
    x: number;
    y: number;
    colour: number;
    width: number;
    height: number;
    
    constructor(x: number, y: number, width: number, height: number, colour: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.colour = colour;
    }

    generateShapeGeo(transform: Transform) {
        const {x, y, width, height, colour} = this;
        const xDist = width*0.55;
        const yDist = height*0.55;
        const wt = transform.worldTransform;

        const p1 = wt.apply(new Point(x - xDist, y - yDist));
        const p2 = wt.apply(new Point(x + xDist, y - yDist));
        const p3 = wt.apply(new Point(x + xDist, y + yDist));
        const p4 = wt.apply(new Point(x - xDist, y + yDist));

        const vertices = [
            new SDFVertex(p1, colour, SDFBoat.index,
                          {aUV: [x - xDist, y - yDist], aMiscB: [x, y, width, height]}),
            new SDFVertex(p2, colour, SDFBoat.index,
                          {aUV: [x + xDist, y - yDist], aMiscB: [x, y, width, height]}),                         
            new SDFVertex(p3, colour, SDFBoat.index,
                          {aUV: [x + xDist, y + yDist], aMiscB: [x, y, width, height]}),
            new SDFVertex(p4, colour, SDFBoat.index,
                          {aUV: [x - xDist, y + yDist], aMiscB: [x, y, width, height]})
        ];
        const indices = [0,1,2,0,2,3];

        return {
            vertices: vertices,
            indices: indices
        };

    }
    static index = 2;
}

export class GenericSDFGeo {
    x: number;
    y: number;
    colour: number;
    width: number;
    height: number;
    index: number;
    props: VtxMiscs;

    constructor(index: number, x: number, y: number, width: number, height: number, colour: number, props?: VtxMiscs ) {
        this.index = index;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.colour = colour;        
        this.props = props? props : {};
    }

    generateShapeGeo(transform: Transform) {
        const {x, y, width, height, colour} = this;
        const xDist = width*0.5;
        const yDist = height*0.5;
        const wt = transform.worldTransform;

        const p1 = wt.apply(new Point(x - xDist, y - yDist));
        const p2 = wt.apply(new Point(x + xDist, y - yDist));
        const p3 = wt.apply(new Point(x + xDist, y + yDist));
        const p4 = wt.apply(new Point(x - xDist, y + yDist));

        const vertices = [
            new SDFVertex(p1, colour, this.index,
                          {aUV: [x - xDist, y - yDist], ...this.props}),
            new SDFVertex(p2, colour, this.index,
                          {aUV: [x + xDist, y - yDist], ...this.props}),                         
            new SDFVertex(p3, colour, this.index,
                          {aUV: [x + xDist, y + yDist], ...this.props}),
            new SDFVertex(p4, colour, this.index,
                          {aUV: [x - xDist, y + yDist], ...this.props})
        ];
        const indices = [0,1,2,0,2,3];

        return {
            vertices: vertices,
            indices: indices
        };
    }
}

class SDFContainer extends Container {
    state: State;
    geometry: SDFGeometry;
    shapes: SDFShape[];
    _shader: Shader;

    constructor(x: number, y: number) {
        super();

        this.state = State.for2d();
        this.shapes = [];
        this.geometry = new SDFGeometry();
        this.x = x;
        this.y = y;
        
        this._shader = Shader.from(
            Loader.shared.resources.vtx_shader.data, 
            Loader.shared.resources.frag_shader.data,
            {
                "translationMatrix": new Matrix().toArray(true)
            }
        );
        
    }

    _render(renderer: Renderer) {
        const pluginName = SDFContainer._pluginName;
        let vertices: SDFVertex[] = [];
        let indices: number[] = [];
        let totVerts = 0;

        this.shapes.forEach((shape) => {
            let geo = shape.generateShapeGeo(this.transform);
            vertices.push(...geo.vertices);
            indices.push(...geo.indices.map((ix) => ix + totVerts));
            totVerts += geo.vertices.length;
        });

        this.geometry.setBuffers(vertices, indices);

        if (renderer.plugins[pluginName]) {
            renderer.batch.setObjectRenderer(renderer.plugins[pluginName]);
            renderer.plugins[pluginName].render(this);
            return;
        }

        // bind and sync uniforms..
        renderer.shader.bind(this._shader);

        // set state..
        renderer.state.set(this.state);

        // bind the geometry...
        renderer.geometry.bind(this.geometry, this._shader);

        // then render it
        renderer.geometry.draw(DRAW_MODES.TRIANGLES);
    }

    addCircle(x: number, y: number, radius: number, colour: number) {
        this.shapes.push(new SDFCircle(x,y, radius, colour));
    }

    static _pluginName = "sdf_plugin";
}

export default SDFContainer;