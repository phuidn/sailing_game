
class KeyListener {
    value: string;
    isDown: boolean = false;
    isUp: boolean = true;
    press: () => void;
    release: () => void;
    _downListener = this.downHandler.bind(this);
    _upListener   = this.upHandler.bind(this);
    
    constructor(value: string, press = ()=>{}, release = ()=>{}) {
        this.value = value;
        this.press = press;
        this.release = release;
        
        window.addEventListener(
            "keydown", this._downListener, false
        );
          window.addEventListener(
            "keyup", this._upListener, false
        );
    }

    downHandler(event: KeyboardEvent) {
        if (event.key === this.value) {
            if (this.isUp)
                this.press();
            this.isUp = false;
            this.isDown = true;
            event.preventDefault();
        }
    }

    upHandler(event: KeyboardEvent) {
        if (event.key === this.value) {
            if (this.isDown)
                this.release();
            this.isUp = true;
            this.isDown = false;
            event.preventDefault();
        }
    }

    unsubscribe() {
        window.removeEventListener("keydown", this._downListener);
        window.removeEventListener("keyup", this._upListener);        
    }
}

export default KeyListener;