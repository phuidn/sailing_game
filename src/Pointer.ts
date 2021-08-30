import { Tween } from "@tweenjs/tween.js";
import { Point } from "pixi.js";
import { hsvColour } from "./Colours";
import Entity from "./Engine/Entity";
import SDFContainer, { GenericSDFGeo } from "./Engine/SDFContainer";
import GameScene from "./GameScene";
import PlayerBoat from "./PlayerBoat";
import Waypoint from "./Waypoint";

class Pointer extends Entity {

    player: PlayerBoat;
    _target?: Waypoint;
    sdfGraphic: SDFContainer;
    visible: boolean;
    tweening: boolean;
    shape: GenericSDFGeo;
    gameScene: GameScene;
    _alpha: number;
    _size: number;
    
    constructor(scene: GameScene, player: PlayerBoat) {
        super(scene);
        this.gameScene = scene;
        this.player = player;
        this._target = undefined;
        this.sdfGraphic = new SDFContainer(0, 0);
        this.graphic = this.sdfGraphic;
        this._size = 16;
        this.shape = new GenericSDFGeo(6, 0, 0, 34, 34, 0xFFFFFFFF, {aMiscB: [0.5 * this._size, 0, 0.5 * this._size, 0]});
        this.sdfGraphic.shapes.push(this.shape);
        this._alpha = 1.0;
        this.visible = true;
        this.tweening = false;
    }

    set target(target: Waypoint) {
        this._target = target;
        if (target)
            this.shape.colour = hsvColour(target.hue, 0.25, 1.0);
    }

    set alpha(val: number) {
        this._alpha = val;
        this.shape.colour = 0x100 * Math.floor(this.shape.colour / 0x100) + Math.floor(0xFF * val);
    }

    get alpha() {
        return this._alpha;
    }

    update(dt: number) {
        super.update(dt);

        if (!this._target) {
            if (this.visible) {
                let tween = new Tween(this)
                .to({alpha: 0.0}, 0.25)
                .onComplete(() => {this.tweening = false; this.visible = false;})
                .start(this._scene.getTime());
            }
            return;
        }

        const player2target = new Point(this._target.x - this.player.x, this._target.y - this.player.y);
        const dist = Math.sqrt(player2target.x * player2target.x + player2target.y * player2target.y);
        
        if (dist < 200 && this.visible && !this.tweening) {
            let tween = new Tween(this)
                 .to({alpha: 0.0}, 0.25)
                 .onComplete(() => {this.tweening = false; this.visible = false;})
                 .start(this._scene.getTime());
            this.tweening = true;
        }
        if (dist > 200 && !this.visible && !this.tweening) {
            let tween = new Tween(this)
                .to({alpha: 1.0}, 0.25)
                .onComplete(() => {this.tweening = false; this.visible = true;})
                .start(this._scene.getTime());
            this.tweening = true;
        }

        this.x = (this.player.x + 0.5 * player2target.x);
        this.y = (this.player.y + 0.5 * player2target.y);

        const xMin = this.gameScene.camera.pivot.x + 50;
        const xMax = xMin + 700;
        const yMin = this.gameScene.camera.pivot.y + 50;
        const yMax = yMin + 500;

        let factor = 1.0;
        factor = Math.min(factor, (this.x > xMax) ? (xMax - this.player.x) / (this.x - this.player.x) : 1.0);
        factor = Math.min(factor, (this.y > yMax) ? (yMax - this.player.y) / (this.y - this.player.y) : 1.0);
        factor = Math.min(factor, (this.x < xMin) ? (this.player.x - xMin) / (this.player.x - this.x) : 1.0);
        factor = Math.min(factor, (this.y < yMin) ? (this.player.y - yMin) / (this.player.y - this.y) : 1.0);

        this.x = this.player.x + 0.5 * factor * player2target.x;
        this.y = this.player.y + 0.5 * factor * player2target.y;

        this.rotation = Math.atan2(player2target.y, player2target.x);

        let time = this._scene.getTime();
        let size = 0.5 * (1 + Math.sin(time * 2 * Math.PI));
        size = 0.5 * this._size * (1 + 0.08 * size * size);
        this.shape.props.aMiscB = [size, 0, -size, 0];

    }
}

export default Pointer;