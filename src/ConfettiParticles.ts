import { randomHue } from "./Colours";
import Entity from "./Engine/Entity";
import SDFContainer, { SDFCircle } from "./Engine/SDFContainer";
import GameScene from "./GameScene";

type Particle = {
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    lifeSpan: number,
    timeSpent: number,
    sdf: SDFCircle
}

class ConfettiParticles extends Entity {
    sdfGraphic: SDFContainer;
    particles: Particle[];
    deadParticles: Particle[];
    gameScene: GameScene;

    constructor(scene: GameScene) {
        super(scene);
        this.gameScene = scene;
        this.sdfGraphic = new SDFContainer(this.x, this.y);
        this.graphic = this.sdfGraphic;
        this.particles = [];
        this.deadParticles = [];
    }

    addParticle(x: number, y: number) {
        
        let rad = Math.sqrt(1 + Math.random() * 4);
        const col = randomHue(0.5, 0.7);
        const speed = 150 + 350 * Math.random();
        const dir = 2.0 * Math.PI * Math.random();

        let particle: Particle = {
            radius: rad,
            sdf: new SDFCircle(x, y, rad, col),
            x: x,
            y: y,
            vx: speed * Math.cos(dir),
            vy: speed * Math.sin(dir),
            lifeSpan: 1 + Math.random() * 1.5 ,
            timeSpent: 0
        }
        this.sdfGraphic.shapes.push(particle.sdf);
        this.particles.push(particle);
    }

    update(dt: number) {
        let wind = this.gameScene.getWindAt(0,0);

        this.particles.forEach(p => {
            p.timeSpent += dt;
            if (p.timeSpent > p.lifeSpan) {
                this.deadParticles.push(p);
                return;
            }
            
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx = 0.975 * p.vx + 0.025 * wind.x;
            p.vy = 0.975 * p.vy + 0.025 * wind.y;
            p.sdf.radius = p.radius * Math.sqrt(1.0 - (p.timeSpent / p.lifeSpan));
            p.sdf.x = p.x;
            p.sdf.y = p.y;
        });
        this.removeDeadParticles();        
    }

    removeDeadParticles() {
        this.deadParticles.forEach(dp => {
            this.particles = this.particles.filter(p => p != dp);
            this.sdfGraphic.shapes = this.sdfGraphic.shapes.filter(s => s != dp.sdf);
        });
        this.deadParticles = [];
    }
}

export default ConfettiParticles;