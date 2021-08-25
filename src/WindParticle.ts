import { Point } from "pixi.js";
import Entity from "./Engine/Entity";
import SDFContainer, { GenericSDFGeo } from "./Engine/SDFContainer";
import GameScene from "./GameScene";

class WindParticle extends Entity {
    gameScene: GameScene;
    sdfGraphic: SDFContainer;
    shape: GenericSDFGeo;
    lifespan: number;
    timeSpent: number;
    radius: number;

    constructor(scene: GameScene, x: number, y: number) {
        super(scene);
        this.x = x;
        this.y = y;
        this.gameScene = scene;
        this.sdfGraphic = new SDFContainer(x, y);
        this.graphic = this.sdfGraphic;
        this.shape = new GenericSDFGeo(5, 0, 0, 1, 1, 0xFFFFFFF00);
        this.radius = Math.sqrt(0.25 + Math.random());
        this.sdfGraphic.shapes.push(this.shape);
        this.lifespan = 1 + Math.random() * 1;
        this.timeSpent = 0;
    }

    update(dt: number) {
        const windSpeed = this.gameScene.getWindAt(this.x, this.y);
        this.timeSpent += dt;
        if (this.timeSpent > this.lifespan)
            this._scene.removeEntity(this);
        this.shape.colour = 0xFFFFFF00 + Math.floor(0xFF * Math.sin(Math.PI * this.timeSpent / this.lifespan)) + 1;
        const windDist = new Point((windSpeed.x - this.gameScene.cameraSpeed.x) * dt, (windSpeed.y - this.gameScene.cameraSpeed.y) * dt)
        
        this.shape.width = 5.1 * (Math.abs(windDist.x) + this.radius);
        this.shape.height = 5.1 * (Math.abs(windDist.y) + this.radius);
        this.shape.props = {
            aMiscB: [-windDist.x, -windDist.y, windDist.x, windDist.y],
            aMiscC: [this.radius, 1, 0, 0]
        }
        this.x += windSpeed.x * dt;
        this.y += windSpeed.y * dt;
    }
}

export default WindParticle;