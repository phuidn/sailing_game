import { Easing, Tween } from "@tweenjs/tween.js";
import { Container, Point, Text } from "pixi.js";
import ConfettiParticles from "./ConfettiParticles";
import Game from "./Engine/Game";
import KeyListener from "./Engine/KeyListener";
import { Scene } from "./Engine/Scene";
import SDFContainer, { GenericSDFGeo } from "./Engine/SDFContainer";
import PlayerBoat from "./PlayerBoat";
import Pointer from "./Pointer";
import WakeParticles from "./WakeParticle";
import Waypoint from "./Waypoint";
import WindParticle from "./WindParticle";

function vortexWindSpeed(peak: number, peakRadius: number, radius: number) {
    const scaledRadius = radius / peakRadius;
    return 2.0 * peak * scaledRadius / (1 + scaledRadius * scaledRadius);
}

const waypoints = [{x:1000, y:0}, {x:3000, y:0}, {x:1500, y:-1500}, {x:0, y:0}, {x:3000, y:0}, {x:0, y:0}, {x:2000, y:0}];

class GameScene extends Scene {
    
    player: PlayerBoat;
    gameTime: number;
    windSpeed: number;
    sceneWidth = 1600;
    sceneHeight = 1600;
    seaShape: GenericSDFGeo;
    boatWake: WakeParticles;
    confetti: ConfettiParticles;
    camera: Container;
    cameraSpeed: Point;
    pointer: Pointer;
    currentWaypoint?: Waypoint;
    waypointNum: number;
    waypointRadius: number;
    timer: number;
    timerCounting: boolean;
    timerText: Text;
    introText: Text;
    startText: Text;
    buoyText: Text;
    gameStarted: boolean;
    startGameListener: KeyListener;

    constructor(game: Game) {
        super(game);

        this.gameTime = 0;
        this.windSpeed = 0;
        
        let background = new SDFContainer(0,0);

        this.seaShape = new GenericSDFGeo(4, 0, 0, 1600, 1200, 0xFFFFFFFF, {aMiscB: [0,0,0,0]});
        background.shapes.push(this.seaShape);
        this.container.addChild(background);

        this.camera = new Container();
        this.container.addChild(this.camera);
        this.entityLayer = this.camera;

        this.boatWake = new WakeParticles(this);
        this.addEntity(this.boatWake);

        this.player = new PlayerBoat(this, 800, 400);
        this.player.rotation = 1.5 * Math.PI;
        this.addEntity(this.player);

        this.confetti = new ConfettiParticles(this);
        this.addEntity(this.confetti);

        this.camera.pivot.x = this.player.x - 400;
        this.camera.pivot.y = this.player.y - 300;
        this.cameraSpeed = new Point(0, 0);

        this.pointer = new Pointer(this, this.player);
        this.addEntity(this.pointer);

        this.waypointNum = 0;
        this.addNewWaypoint();

        this.gameStarted = false;
        this.timer = 0;
        this.timerCounting = false;
        this.timerText = new Text("", {fontFamily : '\"Lucida Console\", Monaco, monospace', fontSize: 20, fill : 0xffffff, align : 'left'});
        this.timerText.position.x = 20;
        this.timerText.position.y = 20;

        this.startText = new Text("Space to start",
            {fontFamily : '\"Lucida Console\", Monaco, monospace', fontSize: 30, fill : 0xffffff, align : 'center'}
        );
        this.startText.position.x = 400;
        this.startText.position.y = 400;
        this.startText.pivot.x = Math.floor(this.startText.width * 0.5);
        this.startText.pivot.y = Math.floor(this.startText.height * 0.5);
        this.container.addChild(this.startText);
        this.startGameListener = new KeyListener(" ", this.startWind.bind(this));

        this.introText = new Text("Left/Right to turn the boat.\nCollect all the buoys!",
            {fontFamily : '\"Lucida Console\", Monaco, monospace', fontSize: 20, fill : 0xffffff, align : 'center'});
        this.introText.position.x = 400;
        this.introText.position.y = 550;
        this.introText.pivot.x = Math.floor(this.introText.width * 0.5);

        this.buoyText = new Text("   ", {fontFamily : '\"Lucida Console\", Monaco, monospace', fontSize: 20, fill : 0xffffff, align : 'right'});
        this.buoyText.position.x = 800 - 20 - this.buoyText.width;
        this.buoyText.position.y = 20;
        this.updateBuoyText();

        this.container.addChild(this.timerText);
        this.container.addChild(this.introText);
        this.container.addChild(this.buoyText);
    }

    startWind() {
        this.gameStarted = true;
        let textTween = new Tween(this.startText)
            .to({alpha: 0.0}, 1.0)
            .start(this.getTime());
        let windTween = new Tween(this)
            .to({windSpeed: 256}, 4.0)
            .start(this.getTime());
        this.startGameListener.unsubscribe();
    }

    getWindAt(x: number, y: number) {
        const angle = Math.PI;
        return new Point(this.windSpeed * Math.cos(angle), this.windSpeed * Math.sin(angle));
    }

    setCameraPosition(x: number, y: number, follow: number = 1.0) {
        
    }

    update(dt: number) {
        super.update(dt);
        this.gameTime += dt * 0.001;

        let pivot = this.camera.pivot;
        let follow = 0.05;
        let targetX = this.player.x + this.player.speed * Math.cos(this.player.rotation) - 400;
        let targetY = this.player.y + this.player.speed * Math.sin(this.player.rotation) - 300;
        this.cameraSpeed.x = follow * (targetX - pivot.x) / dt;
        this.cameraSpeed.y = follow * (targetY - pivot.y) / dt;
        this.camera.pivot.x += this.cameraSpeed.x * dt;
        this.camera.pivot.y += this.cameraSpeed.y * dt;

        if (this.gameStarted) {
            let x = this.camera.pivot.x - 200 + Math.random() * 1200;
            let y = this.camera.pivot.y - 200 + Math.random() * 1000;
            this.addEntity(new WindParticle(this, x, y));
        }

        let wind = this.getWindAt(this.player.x, this.player.y);
        this.seaShape.props.aMiscB = [wind.x, wind.y, this.camera.pivot.x, this.camera.pivot.y];

        if (this.timerCounting) {
            this.timer += dt;
            this.windSpeed = 256 + 64 * (1 - Math.cos(this.timer * 2 * Math.PI / 60)) + 32 * Math.sin(this.timer * 2 * Math.PI / 10);

        }
        this.timerText.text = (Math.round(this.timer * 100) / 100).toFixed(2) + "s";
    }

    resolveWaypontCollected() {
        if (this.waypointNum === 0) {
            this.timerCounting = true;
            let tween = new Tween(this.introText)
                .to({alpha: 0.0}, 1.0)
                .start(this.getTime());
        }
        if (this.waypointNum === waypoints.length - 1) {
            this.timerCounting = false;
            let tween = new Tween(this.timerText.style)
                .to({fontSize: 150.0}, 1.0)
                .easing(Easing.Bounce.Out)
                .start(this.getTime());
        }
        ++this.waypointNum;
        this.updateBuoyText();
        this.addNewWaypoint();
    }

    addNewWaypoint() {
        // const angle = this.waypointNum * 0.8 * Math.PI;

        // let x = this.waypointRadius * Math.sin(angle);
        // let y = -this.waypointRadius * Math.cos(angle);
        if (this.waypointNum >= waypoints.length) {
            this.currentWaypoint = null;
            this.pointer.target = null;
            return;
        }

        let x = waypoints[this.waypointNum].x;
        let y = waypoints[this.waypointNum].y

        this.currentWaypoint = new Waypoint(x, y, this);
        this.addEntity(this.currentWaypoint);
        this.pointer.target = this.currentWaypoint;
    }

    updateBuoyText() {
        this.buoyText.text = this.waypointNum.toString() + "/" + waypoints.length.toString();
    }
}

export default GameScene;