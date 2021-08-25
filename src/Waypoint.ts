import { Circle } from "collisions";
import { randomHue } from "./Colours";
import Entity from "./Engine/Entity";
import SDFContainer, { SDFCircle } from "./Engine/SDFContainer";
import GameScene from "./GameScene";

class Waypoint extends Entity {
    gameScene: GameScene;
    sdfGraphic: SDFContainer;
    sdfCircle: SDFCircle;
    radius: number;

    constructor (x: number, y: number, scene: GameScene) {
        super (scene);
        this.x = x;
        this.y = y;

        this.gameScene = scene;
        this.sdfGraphic = new SDFContainer(x, y);
        this.graphic = this.sdfGraphic;
        this.radius = 32;
        const col = randomHue(0.5, 0.7);
        this.sdfCircle = new SDFCircle(0, 0, this.radius, col);
        this.sdfGraphic.shapes.push(this.sdfCircle);
        this.collider = new Circle(x, y, this.radius);
        this.type = "waypoint";
    }

    update(dt: number) {
        this.sdfCircle.radius = this.radius + 4.0 * Math.sin(this.gameScene.getTime() * 2 * Math.PI);
    }
}

export default Waypoint;