import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export class HandInput {
    constructor(videoElement, onResults) {
        this.videoElement = videoElement;
        this.onResults = onResults;

        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 0,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults(this.handleResults.bind(this));

        this.camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.hands.send({ image: this.videoElement });
            },
            width: 640,
            height: 480
        });
    }

    start() {
        this.camera.start();
    }

    handleResults(results) {
        // Process hand state here
        // Returns: Array of { state: 'OPEN' | 'CLOSING' | 'CLOSED', center: {x,y}, scale: float }
        const handsData = [];

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (const landmarks of results.multiHandLandmarks) {
                // Calculate center (Palm center approx as landmark 9)
                // Mirror effect: Flip X (1.0 - x)
                const center = { x: 1.0 - landmarks[9].x, y: landmarks[9].y };

                // Calculate rough scale (Wrist to Middle Finger MCP dist)
                const wx = landmarks[0].x;
                const wy = landmarks[0].y;
                const mx = landmarks[9].x;
                const my = landmarks[9].y;
                const dist = Math.sqrt((mx - wx) ** 2 + (my - wy) ** 2);

                // Scale factor ~0.15 normalized at arm length -> 0.3 vol
                const scale = dist * 4.0;

                // Detect Gesture
                const fingersOpen = this.getFingersOpen(landmarks);
                const openCount = fingersOpen.filter(f => f).length;

                let handState = 'CLOSING';
                if (openCount >= 4) {
                    handState = 'OPEN';
                } else if (openCount <= 1) {
                    handState = 'CLOSED'; // Fist
                }

                handsData.push({ state: handState, center, scale });
            }
        }

        if (this.onResults) {
            this.onResults(handsData);
        }
    }

    getFingersOpen(landmarks) {
        const fingers = [];
        // Thumb (approx)
        fingers.push(landmarks[4].x < landmarks[3].x); // Assumes right hand or simple check, improve later if needed

        // 4 Fingers (Tip < PIP for open) - Note: y coordinates invert in canvas usually? 
        // MediaPipe Y: 0 is top, 1 is bottom. Open finger tip y < pip y.
        const fingerIndices = [8, 12, 16, 20];
        const pipIndices = [6, 10, 14, 18];

        for (let i = 0; i < 4; i++) {
            fingers.push(landmarks[fingerIndices[i]].y < landmarks[pipIndices[i]].y);
        }

        return fingers;
    }
}
