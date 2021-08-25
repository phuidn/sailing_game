
class Engine
{
    paused: boolean;
    fps: number;
    updateFunction: (dt : number) => void;
    drawFunction: () => void;
    elapsedTime: number;
    _startTime : number;
    _frameDuration : number;
    _prevActualFrameTime: number;
    _currentFps: number;
    _prevFrameDurations: number[];
    _prevAnimationFrameTime: number;
    _prevAnimationFrameDurations: number[];
    _lag: number;
    _pausedTime: number;
    _pauseStartTime: number;


    constructor(fps: number, update: (dt : number) => void, draw: () => void) {
        this.paused = false;
        this.fps = fps;
        this.updateFunction = update;
        this.drawFunction = draw;
        this.elapsedTime = 0;
        this._startTime = 0;
        this._prevActualFrameTime = 0;
        this._frameDuration = 1/fps;
        this._currentFps = fps;
        this._prevFrameDurations = [];
        this._prevAnimationFrameTime = 0.0;
        this._prevAnimationFrameDurations = [];
        this._lag = 0;
        this._pausedTime = 0;
        this._pauseStartTime = 0;
    }

    pause () {
        this.paused = true;
        this._pauseStartTime = Date.now();
    }

    resume () {
        this.paused = false;
        this._pausedTime += (Date.now() - this._pauseStartTime) * 0.001;
    }

    start () {
        this.gameLoop();
        this._startTime = Date.now() * 0.001;
        this._prevActualFrameTime = this._startTime;
    }

    gameLoop () {
        requestAnimationFrame(this.gameLoop.bind(this));
        let currentTime = Date.now() * 0.001;
        
        let animationDuration = currentTime - this._prevAnimationFrameTime;
        if (animationDuration < 0.5)
            this._prevAnimationFrameDurations.push(animationDuration);
        this._prevAnimationFrameTime = currentTime;

        while (this._prevAnimationFrameDurations.length > 5)
            this._prevAnimationFrameDurations.shift();

        if (!this.paused)
        {
            this.elapsedTime = currentTime - this._startTime - this._pausedTime;

            let averageAnimFrameDuration = this._prevAnimationFrameDurations.reduce (
                (sum, val) => { return sum + val / this._prevAnimationFrameDurations.length},
                0
            );

            let timeSinceLastActualFrame = currentTime - this._prevActualFrameTime;

            if (timeSinceLastActualFrame > 5.0 * this._frameDuration){
                timeSinceLastActualFrame = this._frameDuration;
                this._prevActualFrameTime = currentTime - this._frameDuration;
            }

            if (
                Math.abs(timeSinceLastActualFrame + this._lag - this._frameDuration) 
                <
                Math.abs(timeSinceLastActualFrame + this._lag + averageAnimFrameDuration - this._frameDuration)  
            )
            {
                this._lag = timeSinceLastActualFrame + this._lag - this._frameDuration;
                this._prevActualFrameTime = currentTime;

                this._prevFrameDurations.push(timeSinceLastActualFrame);
                while(this._prevFrameDurations.length > 5)
                    this._prevFrameDurations.shift();

                this._currentFps = 1 / this._prevFrameDurations.reduce(
                    (sum, val) => { return sum + val / this._prevFrameDurations.length},
                    0.0
                );

                this.updateFunction(timeSinceLastActualFrame);
                this.drawFunction();
            }
        }

    }

}

export default Engine;