import { Tween } from "@tweenjs/tween.js";
import { Circle } from "collisions";
import { ObservablePoint, Point } from "pixi.js";
import Entity from "./Engine/Entity"
import KeyListener from "./Engine/KeyListener";
import { Scene } from "./Engine/Scene"
import SDFContainer, { GenericSDFGeo, SDFBoat } from "./Engine/SDFContainer";
import GameScene from "./GameScene";

function wrapAngle(angle: number, wrapPoint: number = 0) {
    angle += wrapPoint;
    while(angle < 0)
        angle += 2.0 * Math.PI;
    return angle % (2.0 * Math.PI) - wrapPoint;
}

function rotatePoint(p: Point, theta: number) {
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    return new Point (
        p.x * cosTheta - p.y * sinTheta,
        p.x * sinTheta + p.y * cosTheta
    );
}

class PlayerBoat extends Entity {
    sdfGraphic: SDFContainer;
    boatShape: SDFBoat;
    sailAngle: number;
    sailGraphic: SDFContainer;
    sailShape: GenericSDFGeo;
    gameScene: GameScene;
    speed: number;
    rudderAngle: number;
    leftButton: KeyListener;
    rightButton: KeyListener;
    jybing: Boolean;

    constructor(scene: Scene, x: number, y: number) {
        super(scene);
        
        this.gameScene = scene as GameScene;
        this.x = x;
        this.y = y;
        this.boatShape = new SDFBoat(0, 0, 64, 32, 0xf5e99dFF);
        this.sdfGraphic = new SDFContainer(x, y);
        this.sdfGraphic.shapes.push(this.boatShape);
        this.graphic = this.sdfGraphic;

        this.sailGraphic = new SDFContainer(16, 0);
        this.sailGraphic.pivot = new ObservablePoint(()=>null, null, 24, 0);

        this.sailGraphic.shapes.push(new GenericSDFGeo(5, 0, 0, 52, 16, 0x000000FF, {
            aMiscB: [-20, 0, 20, 0],
            aMiscC: [1.5, 0, 0, 0]
        }));
        this.sailShape = new GenericSDFGeo(7, 0, 0, 52, 16, 0xFFFFFFFF);
        this.updateSailShape(0);
        this.sailGraphic.shapes.push(this.sailShape);

        this.graphic.addChild(this.sailGraphic);
        this.collider = new Circle(x, y, 16);
        this.sailAngle = 0;
        this.speed = 0;
        this.rudderAngle = 0;
        this.jybing = false;
        this.leftButton = new KeyListener("ArrowLeft");
        this.rightButton = new KeyListener("ArrowRight");
    }

    update(dt: number) {
        super.update(dt);

        const wind = this.gameScene.getWindAt(this.x, this.y);
        const relativeWind = new Point(wind.x - this.speed * Math.cos(this.rotation),
                                       wind.y - this.speed * Math.sin(this.rotation));
        const relWindSpeed = Math.sqrt(relativeWind.x * relativeWind.x + relativeWind.y * relativeWind.y);
        const relWindAngle = Math.atan2(relativeWind.y, relativeWind.x);
        const angleToWind = wrapAngle(this.rotation - relWindAngle);

        if (!this.jybing && Math.abs(this.sailAngle - 0.5*(Math.PI - angleToWind)) > 0.5 * Math.PI) {
            this.jybing = true;
            let tween = new Tween(this)
                .to({sailAngle: 0.0}, 0.5)
                .onComplete(() => {this.jybing = false})
                .start(this._scene.getTime());
        }
        const sailToWind = wrapAngle(this.sailAngle + angleToWind + Math.PI, Math.PI);

        const liftCoeff = Math.sign(sailToWind) * PlayerBoat.liftCoeff(Math.abs(sailToWind));
        const dragCoeff = Math.max(0, PlayerBoat.dragCoeff(Math.abs(sailToWind)));
        const sailForceVec = new Point(
            PlayerBoat.sailConst * relWindSpeed * relWindSpeed * dragCoeff, 
            PlayerBoat.sailConst * relWindSpeed * relWindSpeed * liftCoeff
        );
        const boatForceVec = rotatePoint(sailForceVec, angleToWind);

        if (!this.jybing) {
            const liftCoeffGrad = PlayerBoat.liftCoeffGrad(Math.abs(sailToWind));
            const dragCoeffGrad = Math.sign(sailToWind) * PlayerBoat.dragCoeffGrad(Math.abs(sailToWind));
            const sailForceGrad = new Point(
                PlayerBoat.sailConst * relWindSpeed * relWindSpeed * dragCoeffGrad, 
                PlayerBoat.sailConst * relWindSpeed * relWindSpeed * liftCoeffGrad
            );
            const boatForceGrad = rotatePoint(sailForceGrad, angleToWind);

            this.sailAngle += 0.0001 * boatForceGrad.x;

            const minSailAngle = Math.min(0, Math.sign(Math.PI - angleToWind) * 0.5 *  Math.PI);
            const maxSailAngle = Math.max(0, Math.sign(Math.PI - angleToWind) * 0.5 *  Math.PI);
            this.sailAngle = Math.max(this.sailAngle, minSailAngle);
            this.sailAngle = Math.min(this.sailAngle, maxSailAngle);
        }

        let dragForce = -PlayerBoat.hullDrag(this.speed);
        //console.log(this.speed, boatForceVec.x, dragForce);

        if (this.rightButton.isDown) {
            this.rudderAngle += Math.PI / 120.0;
            this.rudderAngle = Math.min(0.5 * Math.PI, this.rudderAngle);

        }
        else if (this.leftButton.isDown) {
            this.rudderAngle -= Math.PI / 120.0;
            this.rudderAngle = Math.max(-0.5 * Math.PI, this.rudderAngle);
        }
        else
            this.rudderAngle *= 0.95;
        dragForce -= this.speed * Math.sin(this.rudderAngle);
        this.rotation += (0.2 + this.speed * 0.005) * Math.sin(this.rudderAngle) * dt;

        this.speed += dt * 0.5 * (boatForceVec.x + dragForce);

        this.sailGraphic.rotation = this.sailAngle;
        this.x += this.speed * Math.cos(this.rotation) * dt;
        this.y += this.speed * Math.sin(this.rotation) * dt;

        // generate wake
        if (this.speed > 32) {
            const tmp = 12 + 4*Math.random();
            let c1 = new Point(-32, -tmp);
            let c2 = new Point(-32, tmp);
            c1 = rotatePoint(c1, this.rotation);
            c2 = rotatePoint(c2, this.rotation);

            const sinAng = Math.sin(0.34);
            const tanAng = Math.tan(0.34);
            let parVec = new Point(this.speed * Math.cos(this.rotation) * sinAng,
                this.speed * Math.sin(this.rotation) * sinAng);
            let perpVec = new Point(this.speed * Math.sin(this.rotation) * tanAng,
                -this.speed * Math.cos(this.rotation) * tanAng);
            
            this.gameScene.boatWake.addParticle(this.x + c1.x, this.y + c1.y, parVec.x + perpVec.x, parVec.y + perpVec.y);
            this.gameScene.boatWake.addParticle(this.x + c2.x, this.y + c2.y, parVec.x - perpVec.x, parVec.y - perpVec.y);
        }
        this.updateSailShape(sailToWind);
    }

    updateSailShape(sailToWind: number) {
        const sign = sailToWind == 0? 1 : Math.sign(sailToWind);
        const midAngle = Math.PI * (1 - sign * 0.5);// sign * 0.5 * Math.PI;
        const radius = 96 + 10.0/Math.max(Math.abs(sailToWind), 0.0001);
        const p1 = new Point(-24, 0);
        const p2 = new Point(24, 0);
        const xdist = p2.x - p1.x;
        const centre = new Point(0.5 * (p1.x + p2.x), sign * 0.5 * Math.sqrt(4 * radius * radius - xdist * xdist));
        const theta = Math.asin(xdist * 0.5 / radius);
        this.sailShape.props.aMiscB = [centre.x, -centre.y, midAngle - theta, midAngle + theta];
        this.sailShape.props.aMiscC = [radius, 3, 0, 0];
    }

    postUpdate() {
        let collides = this.collidesWithType("waypoint");
        collides.forEach(waypoint => {
            this.gameScene.removeEntity(waypoint);
            this.gameScene.resolveWaypontCollected();
        });
    }

    calculateWindForce(sailToWind: number) {

    }

    static liftCoeff(theta: number) {
        if (theta < 0.15)
            return 0;
        if (theta < 0.3)
            1.07 * (theta - 0.15) / 0.15;
        return (8 * theta - 4 * theta * theta)/(1 + 3 * theta);
    }

    static liftCoeffGrad(theta: number) {
        const denom = 1 + 3*theta
        return ((8 * (1 - theta) * denom) -  3 * (8 * theta - 4 * theta * theta)) / (denom * denom);
    }

    static dragCoeff(theta: number) {
        return 0.5 * Math.PI * theta * theta - 0.667 * theta * theta * theta;
    }

    static dragCoeffGrad(theta: number) {
        return Math.PI * theta - 2.0 * theta * theta;
    }

    static hullDrag(speed: number) {
        return speed < 32 ? 0.5 * speed : 16 + 0.016 * (speed - 32) * (speed - 32);

        //const a = 1.14;
        //const b = 0.17;
        //const c = 0.066;
        //return a*speed + Math.pow(b*speed, 2) + Math.pow(c*speed, 3);
    }

    static dragConst = 0.16;
    static sailConst = 0.004;
    static hullSpeed = 32;
}

export default PlayerBoat;