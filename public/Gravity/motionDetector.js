export class MotionDetector {
    currentWindowPosition = {
        x: window.screenX, y:window.screenY
    };

    constructor() {
        window.addEventListener('windowMotion', (e) => { this.handleWindowMotion(e) });
        this.pollWindowPosition();
    }

    handleWindowMotion(e) {
        console.log('New position: ', e, e.detail.windowPosition);
    }

    pollWindowPosition() {
        setInterval(() => {
            const newWindowPosition = {
                x: window.screenX, y:window.screenY
            };

            if (
                newWindowPosition.x !== this.currentWindowPosition.x 
                && newWindowPosition.y !== this.currentWindowPosition.y
            ) {
                const windowMotion = new Event('windowMotion', {
                    bubbles: true
                });
                windowMotion.detail = {
                    windowPosition: {
                        ...newWindowPosition
                    }
                },
                window.dispatchEvent(windowMotion);
                this.currentWindowPosition = {...newWindowPosition};
            }
        }, 100);
    }
}
