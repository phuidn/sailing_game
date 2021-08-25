import Game from "./Engine/Game";
import KeyListener from "./Engine/KeyListener";
import GameScene from "./GameScene";

class SailingGame extends Game {
    constructor() {
        super(800, 600);
        this._app.renderer.backgroundColor = 0xFF0f8799;
        let gameScene = new GameScene(this)
        this.scene = gameScene;
        let spaceKey = new KeyListener(" ", 
        () => {
            if (!this.paused) {
                this.pause();
            }
            else
                this.resume();
        }
        );
    }
}

export default SailingGame;