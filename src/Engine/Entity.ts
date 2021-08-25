import { Container } from "@pixi/display";
import { ObservablePoint } from "@pixi/math";
import { Body, Polygon } from "collisions";
import { Scene } from "./Scene";

export class Entity
{
    // visible: boolean;
    id: number;
    graphic: Container;
    type: string | undefined;
    checkCollisions: boolean;
    private _collider: Body | undefined;
    private _position: ObservablePoint;
    private _pivot: ObservablePoint;
    private _rotation: number;
    _scene: Scene;
    
    constructor(scene: Scene, id?: number) {
        this._position = new ObservablePoint(this.updateTransform, this, 0, 0);
        this._pivot    = new ObservablePoint(this.updateTransform, this, 0, 0);
        this._rotation = 0;
        //this.visible = true;
        this.id = (id != undefined) ? id : Entity._currentID++;
        this.graphic = new Container();
        this.checkCollisions = true;
        this._scene = scene;
    }

    get x(): number {
        return this._position.x;
    }
    
    set x(v: number) {
        this._position.x = v;
    }

    get y(): number {
        return this._position.y;
    }
    
    set y(v: number) {
        this._position.y = v;
    }

    set position(v: ObservablePoint) {
        this._position.copyFrom(v);
    }

    get position(): ObservablePoint {
        return this._position;
    }

    set pivot(v: ObservablePoint) {
        this._pivot.copyFrom(v);
    }

    get pivot(): ObservablePoint {
        return this._pivot;
    } 

    set rotation(angle: number) {
        this._rotation = angle;
        this.updateTransform();
    }

    get rotation() {
        return this._rotation;
    }

    set collider(b: Body | undefined) {
        if (this._collider)
            this._scene.removeCollider(this._collider);
        if (b)
            this._scene.addCollider(this, b);
        this._collider = b;
    }

    get collider() {
        return this._collider;
    }

    update(delta : number) {

    }

    postUpdate() {

    }

    collidesWithType(type: string) {
        return this._scene.detectCollisionsWithType(this, type);
    }

    collisionResultWith(entity: Entity) {
        return this._scene.getCollisionResult(this, entity)
    }

    // collidesWithClass(klass: string) {
    //     return this._scene.detectCollisionsWithClass(this, klass);
    // }

    updateTransform () {
        this.graphic.position = this._position;
        this.graphic.pivot = this._pivot;
        this.graphic.rotation = this._rotation;
        if (this.collider) {
            this.collider.x = this._position.x + this._pivot.x;
            this.collider.y = this._position.y + this._pivot.y;
            if (this.collider instanceof Polygon) {
                this.collider.angle = this._rotation;
            }
        }
    }

    static _currentID = 0;
}

export default Entity;