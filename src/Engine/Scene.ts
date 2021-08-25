import { AbstractRenderer, Container, Graphics, InteractionEvent, Rectangle, Renderer } from "pixi.js";
import { Entity } from "./Entity";
import { Collisions, Body, Result } from "collisions";
import Game from "./Game";

export interface EntityBody extends Body {
    parent: Entity;
}

export class Scene {
    entities: Entity[];
    container: Container;
    entityLayer: Container;
    collisions: Collisions;
    _updating: boolean;
    _renderer: Renderer|AbstractRenderer;
    _game: Game;

    constructor(game: Game) {
        this.entities = [];
        this._game = game;
        this._renderer = game._app.renderer;
        this.container = new Graphics();
        this.entityLayer = this.container;
        this._setupMouseEvents();

        this.collisions = new Collisions();
        this._updating = false;
        
    }

    _setupMouseEvents() {
        this.container.interactive = true;
        this.container.hitArea = new Rectangle(0, 0, this._renderer.width, this._renderer.height);
        this.container.on("mousemove", this.mouseMove.bind(this));
        this.container.on("mouseover", this.mouseOver.bind(this));
        this.container.on("mouseout", this.mouseOut.bind(this));
        this.container.on("mousedown", this.mouseDown.bind(this));
        this.container.on("mouseup", this.mouseUp.bind(this));
        this.container.on("click", this.mouseClick.bind(this));
        this.container.on("rightdown", this.mouseRightDown.bind(this));
        this.container.on("rightup", this.mouseRightUp.bind(this));
        this.container.on("rightclick", this.mouseRightClick.bind(this));
    }

    update(delta: number) {
        this._updating = true;
        this.entities.forEach(e => {
            e.update(delta)
        });
        this._updating = false;

        this.collisions.update();

        this.entities.forEach(e => {
            e.postUpdate()
        });
    }

    addEntity(e: Entity) {
        if (this.entities.includes(e)) {
            return;
        }
        this.entities.push(e);

        this.entityLayer.addChild(e.graphic);
    }

    removeEntity(e: Entity) {
        this.entityLayer.removeChild(e.graphic);
        if (e.collider)
            this.collisions.remove(e.collider);
        this.entities = this.entities.filter((entity) => entity !== e)       
    }

    addCollider(e: Entity, b: Body) {
        let eb = b as EntityBody;
        eb.parent = e;
        this.collisions.insert(eb);
    }

    removeCollider(b: Body) {
        this.collisions.remove(b);
    }

    detectCollisionsWithType(entity: Entity, type: string) {
        if (!entity.collider)
            return [];
        let bodies = this.detectCollisions(entity.collider, (b) => (b.parent.type === type));
        return bodies.map((b) => b.parent);
    }

    detectCollisions(body: Body, filter?: (b: EntityBody)=>boolean) {
        if (this._updating)
            this.collisions.update();
        let potentials = body.potentials() as EntityBody[];
        
        if (filter)
            potentials = potentials.filter(filter);

        return potentials.filter(b => body.collides(b));
    }

    getCollisionResult(entity1: Entity, entity2: Entity) {
        if (!entity1.collider || !entity2.collider)
            throw("Entity does not have a collider")
        let result = new Result();
        entity1.collider.collides(entity2.collider, result);
        return result;
    }

    getTime() {
        return this._game._engine.elapsedTime;
    }

    mouseMove(event: InteractionEvent) {

    }

    mouseOver(event: InteractionEvent) {

    }

    mouseOut(event: InteractionEvent) {

    }

    mouseClick(event: InteractionEvent) {

    }

    mouseDown(event: InteractionEvent) {

    }

    mouseUp(event: InteractionEvent) { 

    }

    mouseRightClick(event: InteractionEvent){

    }

    mouseRightDown(event: InteractionEvent) {

    }

    mouseRightUp(event: InteractionEvent) {

    }
}
