export class MotionDetector {
    currentWindowPosition = {
        x: window.screenX,
        y: window.screenY,
    };

    constructor() {
        this.pollWindowPosition();
        this.dispatchHandlers = [];
        window.addEventListener('deviceorientation', e => {
            this.dispatchOrientation(e);
        });
    }

    on(eventName, callback) {
        switch (eventName) {
            case 'windowMotion':
                this.dispatchHandlers.push({ eventName, callback });
            case 'deviceorientation':
                this.dispatchHandlers.push({ eventName, callback });
        }
    }

    dispatchWindowMotion(detail) {
        this.dispatchHandlers.forEach(handler => {
            if (handler.eventName == 'windowMotion')
                handler.callback({ detail });
        });

        const windowMotion = new Event('windowMotion', {
            bubbles: true,
        });
        windowMotion.detail = detail;
        window.dispatchEvent(windowMotion);
    }

    handleWindowMotion(e) {
        console.log('New position: ', e.detail);
    }

    dispatchOrientation(event) {
        // console.log(orientation);
        this.dispatchHandlers.forEach(handler => {
            if (handler.eventName == 'deviceorientation')
                handler.callback(event);
        });
    }

    pollWindowPosition() {
        setInterval(() => {
            const newWindowPosition = {
                x: window.screenX,
                y: window.screenY,
            };
            const detail = {
                newWindowPosition: {
                    ...newWindowPosition,
                },
                oldWindowPosition: {
                    ...this.currentWindowPosition,
                },
                windowVelocity: {
                    x: newWindowPosition.x - this.currentWindowPosition.x,
                    y: newWindowPosition.y - this.currentWindowPosition.y,
                },
            };
            this.dispatchWindowMotion(detail);
            this.currentWindowPosition = { ...newWindowPosition };
        }, 10);
    }
}
