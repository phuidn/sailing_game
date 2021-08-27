import { Easing, Tween } from "@tweenjs/tween.js";
import { Circle } from "collisions";
import { hsvColour, randomHue } from "./Colours";
import Entity from "./Engine/Entity";
import SDFContainer, { GenericSDFGeo, SDFCircle } from "./Engine/SDFContainer";
import GameScene from "./GameScene";

class Waypoint extends Entity {
    gameScene: GameScene;
    sdfGraphic: SDFContainer;
    sdfCircle: GenericSDFGeo;
    radius: number;
    hue: number;
    val: number;
    sat: number = 0.5;

    constructor (x: number, y: number, scene: GameScene) {
        super (scene);
        this.x = x;
        this.y = y;

        this.gameScene = scene;
        this.sdfGraphic = new SDFContainer(x, y);
        this.graphic = this.sdfGraphic;
        this.radius = 30;
        this.hue = Math.random() * 360;
        this.val = 0.7;
        const col = hsvColour(this.hue, this.sat, this.val);
        this.sdfCircle = new GenericSDFGeo(8, 0, 0, 64, 64, col, {aMiscB:[0,0,this.radius,0]})
        this.sdfGraphic.shapes.push(this.sdfCircle);
        this.collider = new Circle(x, y, this.radius);
        this.type = "waypoint";
    }

    update(dt: number) {
        let radius = this.radius + Math.sqrt(4.0 * (1.0 + Math.sin(this.gameScene.getTime() * 2 * Math.PI)));
        this.sdfCircle.props.aMiscB = [0,0,radius,0];

    }

    updateGraphic() {
        this.sdfCircle.props.aMiscB = [0,0,this.radius,0];
        this.sdfCircle.width = Math.floor(this.radius * 2.1);
        this.sdfCircle.height = Math.floor(this.radius * 2.1);
        let col = hsvColour(this.hue, this.sat, this.val);
        this.sdfCircle.colour = col;
    }

    pop() {
        this.type = "deadWaypoint";
        let tween = new Tween(this)
        .to({radius: this.radius * 1.25}, 0.25)
        .onUpdate(this.updateGraphic.bind(this))
        .easing(Easing.Quadratic.Out)
        .onComplete(this.destroy.bind(this))
        .start(this.gameScene.getTime());
    }

    destroy() {
        for (let i = 0; i < 200; ++i) {
            this.gameScene.confetti.addParticle(this.x, this.y);
        }
        this.gameScene.removeEntity(this);
    }
}

export default Waypoint;