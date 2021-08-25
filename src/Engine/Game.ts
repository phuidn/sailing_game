import * as PIXI from "pixi.js"
import Engine from "./Engine";
import { Container, Renderer } from "pixi.js";
import SDFRenderer from "./SDFRenderer";
import { Scene } from "./Scene";
import * as TWEEN from "@tweenjs/tween.js";

class Game {
    _app: PIXI.Application;
    _engine: Engine;

    _debugOverlay: Container;

    _scene: Scene|undefined;
    
    constructor (
        width: number,
        height: number,
        fps: number = 60
    )
    {
        Renderer.registerPlugin("sdf_plugin", SDFRenderer);
        this._app = new PIXI.Application({width, height});
        this._app.stop();
        document.body.appendChild(this._app.view);

        this._engine = new Engine(fps, this.update.bind(this), this.draw.bind(this));

        this._debugOverlay = new Container();
        this._app.stage.addChild(this._debugOverlay);
        
    }

    start(){
        this._engine.start();
    }

    pause(){
        this._engine.pause();
    }

    resume(){
        this._engine.resume();
    }

    update(dt: number) {
        TWEEN.update(this._engine.elapsedTime);
        this.scene?.update(dt);
    }

    draw() {
        this._app.renderer.plugins["sdf_plugin"]._shader.uniforms.time= this._engine.elapsedTime;
        this._app.render();
    }

    set scene(scene: Scene|undefined) {
        if (this._scene) {
            this._app.stage.removeChild(this._scene.container);
        }
        this._scene = scene;
        if (scene) {
            this._app.stage.addChildAt(scene.container, 0);
            
        }
    }

    get scene() {
        return this._scene;
    }


    get paused() {
        return this._engine.paused;
    }
}

export default Game;