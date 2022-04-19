export class MotionDetector {
    currentWindowPosition = {
        x: window.screenX, y:window.screenY
    };

    constructor() {
        // window.addEventListener('windowMotion', (e) => { this.handleWindowMotion(e) });
        this.pollWindowPosition();
        this.dispatchHandlers = [];
    }

    on(eventName, callback) {
        switch (eventName) {
            case "windowMotion":
                this.dispatchHandlers.push(callback);
        }
    }

    dispatch(detail) {
        this.dispatchHandlers.forEach(handler => {
            handler({detail});
        });

        const windowMotion = new Event('windowMotion', {
            bubbles: true
        });
        windowMotion.detail = detail;
        window.dispatchEvent(windowMotion);
    }

    handleWindowMotion(e) {
        console.log('New position: ', e.detail);
    }

    pollWindowPosition() {
        setInterval(() => {
            const newWindowPosition = {
                x: window.screenX, y:window.screenY
            };
            const detail = {
                newWindowPosition: {
                    ...newWindowPosition
                },
                oldWindowPosition: {
                    ...this.currentWindowPosition
                },
                windowVelocity: {
                    x: newWindowPosition.x - this.currentWindowPosition.x,
                    y: newWindowPosition.y - this.currentWindowPosition.y 
                }
            };
            this.dispatch(detail);
            this.currentWindowPosition = {...newWindowPosition};
        }, 10);
    }
}
