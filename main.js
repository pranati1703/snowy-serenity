import { HandInput } from './src/hand_input.js';
import { ParticleSystem } from './src/particle_system.js';
import { AudioManager } from './src/audio_manager.js';
import { Snowflake } from './src/snowflake.js';

console.log("Snowy Serenity Initializing...");

const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const loadingElement = document.getElementById('loading');
const appElement = document.getElementById('app');

// Audio Setup with "Click to Start" overlay
const audioManager = new AudioManager();
const startOverlay = document.createElement('div');
startOverlay.style.cssText = `
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    background: rgba(15, 23, 42, 0.9); z-index: 20; color: white; cursor: pointer;
    font-family: 'Inter', sans-serif; text-align: center;
`;
startOverlay.innerHTML = `
    <h1 style="font-weight: 300; font-size: 3rem; margin-bottom: 2rem; text-shadow: 0 0 20px #a5f3fc;">
        Snowy Serenity
    </h1>
    <div style="display: flex; gap: 4rem; margin-bottom: 3rem; opacity: 0.9;">
        <div>
            <div style="font-size: 3rem;">🖐️</div>
            <p style="margin-top: 0.5rem; color: #a5f3fc;">Open Hand</p>
            <small>Scatters Magic</small>
        </div>
        <div>
            <div style="font-size: 3rem;">✊</div>
            <p style="margin-top: 0.5rem; color: #a5f3fc;">Fist</p>
            <small>Forms Crystal</small>
        </div>
        <div>
            <div style="font-size: 3rem;">👐</div>
            <p style="margin-top: 0.5rem; color: #a5f3fc;">Together</p>
            <small>Frost Nova</small>
        </div>
    </div>
    <div style="padding: 1rem 2rem; border: 1px solid #a5f3fc; border-radius: 2rem; 
                background: rgba(165, 243, 252, 0.1); transition: all 0.3s;"
         onmouseover="this.style.background='rgba(165, 243, 252, 0.2)'"
         onmouseout="this.style.background='rgba(165, 243, 252, 0.1)'">
        Click to Enter
    </div>
`;
appElement.appendChild(startOverlay);

startOverlay.addEventListener('click', async () => {
    await audioManager.resume();
    startOverlay.style.opacity = 0;
    setTimeout(() => startOverlay.remove(), 1000);
    appElement.appendChild(exitButton);
});

// Exit Button
const exitButton = document.createElement('div');
exitButton.innerHTML = "×";
exitButton.style.cssText = `
    position: absolute; top: 20px; right: 20px; width: 50px; height: 50px;
    background: rgba(255, 255, 255, 0.2); color: white; border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.5);
    display: flex; justify-content: center; align-items: center; font-size: 30px;
    cursor: pointer; z-index: 100; font-family: sans-serif;
    transition: all 0.3s;
    backdrop-filter: blur(5px);
`;
exitButton.onmouseover = () => {
    exitButton.style.background = 'rgba(255, 255, 255, 0.4)';
    exitButton.style.transform = 'scale(1.1)';
};
exitButton.onmouseout = () => {
    exitButton.style.background = 'rgba(255, 255, 255, 0.2)';
    exitButton.style.transform = 'scale(1.0)';
};
exitButton.onclick = () => {
    // Stop Main Render Loop but Keep Tracking/Audio
    cancelAnimationFrame(animationId);

    // Show Thank You Screen

    // Show Thank You Screen
    appElement.innerHTML = ''; // Clear everything
    appElement.classList.add('aurora-bg');
    appElement.style.display = 'flex';
    appElement.style.flexDirection = 'column';
    appElement.style.justifyContent = 'center';
    appElement.style.alignItems = 'center';
    appElement.style.color = '#a5f3fc';
    appElement.style.fontFamily = "'Inter', sans-serif";
    appElement.style.position = 'relative';

    // Add Canvas for Ending Snowflakes
    const endCanvas = document.createElement('canvas');
    endCanvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;';
    appElement.appendChild(endCanvas);
    const endCtx = endCanvas.getContext('2d');

    const resizeEnd = () => {
        endCanvas.width = window.innerWidth;
        endCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeEnd);
    resizeEnd();

    const endSnowflakes = [];
    for (let i = 0; i < 80; i++) {
        endSnowflakes.push(new Snowflake(endCanvas.width, endCanvas.height));
    }

    const animateEnd = () => {
        endCtx.clearRect(0, 0, endCanvas.width, endCanvas.height);

        // Use real hand tracking data
        const interactionData = currentHandsData.length > 0 ? currentHandsData : [];

        // 1. Draw Global Trails (from ParticleSystem)
        particles.trails = particles.trails.filter(t => {
            t.x += t.vx;
            t.y += t.vy;
            t.alpha *= 0.94;
            t.size *= 0.96;
            if (t.alpha > 0.05) {
                endCtx.save();
                endCtx.globalAlpha = t.alpha;
                endCtx.fillStyle = "#fff";
                endCtx.beginPath();
                endCtx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                endCtx.fill();
                endCtx.restore();
                return true;
            }
            return false;
        });

        // 2. Draw Falling Snowflakes (Specific to ending screen)
        endSnowflakes.forEach(s => {
            s.update(interactionData);
            s.draw(endCtx);
        });

        // 3. Draw Nova Particles/Background Flakes (from ParticleSystem)
        // These are triggered by the "Together" gesture which still runs in the handInput callback
        particles.particles.forEach(p => {
            p.update(interactionData);
            p.draw(endCtx);
        });

        requestAnimationFrame(animateEnd);
    };
    animateEnd();

    // Thank you text (Z-index 2 to be above canvas)
    const content = document.createElement('div');
    content.style.cssText = 'text-align: center; z-index: 2; position: relative; pointer-events: none;';
    content.innerHTML = `
        <h1 style="font-size: 3rem; margin-bottom: 1rem; font-weight: 400; text-shadow: 0 0 20px rgba(165, 243, 252, 0.4);">Thank You for Visiting</h1>
        <p style="font-size: 1.2rem; opacity: 0.8; margin-bottom: 2.5rem; font-weight: 300; letter-spacing: 0.5px;">
            We hope you enjoyed your time in Snowy Serenity.<br>Come back and experience the magic again anytime.
        </p>
        <button onclick="location.reload()" style="padding: 0.8rem 2rem; pointer-events: auto;
            background: rgba(165, 243, 252, 0.1); border: 1px solid rgba(165, 243, 252, 0.4); color: #a5f3fc; 
            border-radius: 2rem; cursor: pointer; transition: all 0.3s ease; font-size: 1rem;
            letter-spacing: 0.5px; backdrop-filter: blur(5px);"
            onmouseover="this.style.background='rgba(165, 243, 252, 0.2)'; this.style.borderColor='#a5f3fc'"
            onmouseout="this.style.background='rgba(165, 243, 252, 0.1)'; this.style.borderColor='rgba(165, 243, 252, 0.4)'">
            Restart Experience
        </button>
    `;
    appElement.appendChild(content);
};
// Initialize Systems
const canvasElementFg = document.getElementById('foreground_canvas');
const particles = new ParticleSystem(canvasElement, canvasElementFg);

let currentHandsData = [];
let lastAnyClosed = false;
let lastHandsNear = false;
let lastHandCenters = []; // Track up to 2 hands: [{x, y}, {x, y}]
let animationId;

const handInput = new HandInput(videoElement, (handsData) => {
    // handsData is Array of {state, center, scale}
    let anyClosed = false;
    let anyOpen = false;
    let maxVolume = 0.0;

    // Track "Together" state
    let handsNear = false;
    if (handsData && handsData.length === 2) {
        const dx = handsData[0].center.x - handsData[1].center.x;
        const dy = handsData[0].center.y - handsData[1].center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.15) handsNear = true;
    }

    if (handsData && handsData.length > 0) {
        handsData.forEach((hand, index) => {
            if (hand.state === 'CLOSED') anyClosed = true;
            if (hand.state === 'OPEN') anyOpen = true;

            // Velocity-based effects (Trails & Wind)
            const currentCenter = hand.center;
            if (lastHandCenters[index]) {
                const lastCenter = lastHandCenters[index];
                const dx = currentCenter.x - lastCenter.x;
                const dy = currentCenter.y - lastCenter.y;
                const speed = Math.sqrt(dx * dx + dy * dy);

                // Spawn Trail Particles
                if (speed > 0.001) {
                    particles.addTrailParticle(currentCenter.x * canvasElement.width, currentCenter.y * canvasElement.height);
                }
            }
            lastHandCenters[index] = { ...currentCenter };

            // Volume from scale
            let vol = Math.max(0.1, Math.min(hand.scale * 0.5, 0.8));
            if (vol > maxVolume) maxVolume = vol;
        });
    } else {
        lastHandCenters = []; // Clear if no hands tracked
    }

    // Frost Nova Burst
    if (handsNear && !lastHandsNear) {
        const cx = (handsData[0].center.x + handsData[1].center.x) / 2;
        const cy = (handsData[0].center.y + handsData[1].center.y) / 2;
        particles.triggerFrostNova(cx * canvasElement.width, cy * canvasElement.height);
        audioManager.playExplosion(0.8);
    }
    lastHandsNear = handsNear;

    // Audio Triggers based on State Changes
    // We trace 'anyClosed' transition. 
    // Ideally track per-hand, but global trigger is okay for now.
    // We need a persistent state. Let's use 'wasAnyClosed'.
    /* NOTE: We need to store state outside callback. Assuming we add 'wasAnyClosed' var above */

    // Note: This logic is tricky without tracking specific hand interactions.
    // Simplified: If any closed now, and none closed before ?? 
    // Or just randomness.

    // State Transitions
    // Check if we just opened from a closed state (Explosion trigger)
    if (lastAnyClosed && !anyClosed && (anyOpen || handsData.length > 0)) {
        // If we were closed, and now we are not closed (either open or just released)
        audioManager.playExplosion(maxVolume + 0.3);
    }

    if (anyClosed) {
        if (Math.random() < 0.05) audioManager.playChime(maxVolume + 0.2);
    }

    if (anyClosed) {
        if (Math.random() < 0.4) audioManager.playSparkle(maxVolume * 0.7);
    }
    else if (anyOpen) {
        if (Math.random() < 0.1) audioManager.playSparkle(maxVolume);
    }

    // Update history
    lastAnyClosed = anyClosed;

    // Hide loading once we get first result
    if (loadingElement.style.display !== 'none') {
        loadingElement.style.display = 'none';
        console.log("Tracking started!");
    }

    // Pass strictly strictly array to particles
    currentHandsData = handsData;
});

handInput.start();

// Resize Handler
function resize() {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    canvasElementFg.width = window.innerWidth;
    canvasElementFg.height = window.innerHeight;
    particles.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);
resize();

// Animation Loop
function animate() {
    animationId = requestAnimationFrame(animate);
    particles.update(currentHandsData);
}

animate();
