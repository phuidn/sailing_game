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

class WakeParticles extends Entity {
    sdfGraphic: SDFContainer;
    particles: Particle[];
    deadParticles: Particle[];

    constructor(scene: GameScene) {
        super(scene);
        this.sdfGraphic = new SDFContainer(this.x, this.y);
        this.graphic = this.sdfGraphic;
        this.particles = [];
        this.deadParticles = [];
    }

    addParticle(x: number, y: number, xVel: number, yVel: number) {
        
        let rad = Math.sqrt((Math.random() * (xVel*xVel + yVel*yVel) * 0.002));
        let particle: Particle = {
            radius: rad,
            sdf: new SDFCircle(x, y, rad, 0xEAEAEAFF),
            x: x,
            y: y,
            vx: xVel * (0.9 + 0.2 * Math.random()),
            vy: yVel* (0.9 + 0.2 * Math.random()),
            lifeSpan: 1 + Math.random() * 1.5 ,
            timeSpent: 0
        }
        this.sdfGraphic.shapes.push(particle.sdf);
        this.particles.push(particle);
    }

    update(dt: number) {
        this.particles.forEach(p => {
            p.timeSpent += dt;
            if (p.timeSpent > p.lifeSpan) {
                this.deadParticles.push(p);
                return;
            }
            
            p.x += p.vx * dt;
            p.y += p.vy * dt;
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

export default WakeParticles;