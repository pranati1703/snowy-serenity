export class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3; // Low volume default

        this.enabled = false;
        this.isDronePlaying = false;
        this.lastSparkleTime = 0;
        this.lastExplosionTime = 0;
    }

    async resume() {
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
        this.enabled = true;

        // Professional Audio Chain:
        // Sources -> Compressor -> Reverb -> Destination

        if (!this.compressor) {
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;

            // Re-route master gain to compressor
            this.masterGain.disconnect();
            this.masterGain.connect(this.compressor);
            this.compressor.connect(this.ctx.destination);

            // Setup Convolution Reverb (Lush, Professional Space)
            this.reverb = this.ctx.createConvolver();
            this.reverb.buffer = this.createReverbImpulse(2.0); // 2 seconds tail

            // Wet/Dry Mix
            this.reverbGain = this.ctx.createGain();
            this.reverbGain.gain.value = 0.6; // Heavy reverb for "Liquid" feel

            this.compressor.connect(this.reverb); // Send compressed signal to reverb
            this.reverb.connect(this.reverbGain);
            this.reverbGain.connect(this.ctx.destination);
        }

        this.startAmbience();
    }

    // Generate a lush, randomized impulse response for smooth reverb
    createReverbImpulse(duration) {
        const rate = this.ctx.sampleRate;
        const length = rate * duration;
        const impulse = this.ctx.createBuffer(2, length, rate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            // Exponential decay
            const decay = Math.pow(1 - i / length, 2.0);
            // White noise
            left[i] = (Math.random() * 2 - 1) * decay;
            right[i] = (Math.random() * 2 - 1) * decay;
        }
        return impulse;
    }

    playSparkle(volume = 0.3) {
        if (!this.enabled) return;

        // Cooldown for performance
        const now = this.ctx.currentTime;
        if (now - this.lastSparkleTime < 0.05) return;
        this.lastSparkleTime = now;

        // "Music Box" / Magical Ice effect
        // Range: C5 (523) to C7 (2093)
        const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00];
        const fundamental = scale[Math.floor(Math.random() * scale.length)];

        // Randomize velocity slightly
        const velocity = 0.8 + Math.random() * 0.4;

        const mainGain = this.ctx.createGain();
        mainGain.gain.value = volume * velocity;
        mainGain.connect(this.masterGain);

        // Oscillator 1: Sine (Fundamental) - Warmth
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = fundamental;

        const gain1 = this.ctx.createGain();
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.6, now + 0.05); // Slower attack (was 0.02)
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.0); // Longer decay (was 1.2)

        osc1.connect(gain1);
        gain1.connect(mainGain);
        osc1.start();
        osc1.stop(now + 2.1);

        // Oscillator 2: Sine (Octave) - Brightness
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = fundamental * 2.0;

        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc2.connect(gain2);
        gain2.connect(mainGain);
        osc2.start();
        osc2.stop(now + 0.9);
    }

    playChime(volume = 0.5) {
        if (!this.enabled) return;
        // Deeper resonance for the giant snowflake
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(261.63, this.ctx.currentTime); // C4

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume * 0.8, this.ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 4.0);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 4.0);
    }

    // 5. EXPLOSION: "Firework"
    // Noise burst + Sparkle spray
    playExplosion(volume = 0.5) {
        if (!this.enabled) return;

        const now = this.ctx.currentTime;
        if (now - this.lastExplosionTime < 0.2) return;
        this.lastExplosionTime = now;
        const mainGain = this.ctx.createGain();
        mainGain.gain.value = volume;
        mainGain.connect(this.masterGain);

        // 1. The "Boom" (Low Noise / Thud)
        // Creating noise buffer
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 sec
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Lowpass filter for "Thud"
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 150;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1.0, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3); // Short thud

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(mainGain);
        noise.start();

        // 2. The "Sparkle Spray" (Firework tail)
        // Burst of high notes
        const particleCount = 10;
        for (let i = 0; i < particleCount; i++) {
            const timeOffset = Math.random() * 0.2;
            const freq = 1000 + Math.random() * 3000;

            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + timeOffset);

            const pGain = this.ctx.createGain();
            pGain.gain.setValueAtTime(0, now + timeOffset);
            pGain.gain.linearRampToValueAtTime(0.3, now + timeOffset + 0.01);
            pGain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.4);

            osc.connect(pGain);
            pGain.connect(mainGain);
            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + 0.5);
        }
    }

    startAmbience() {
        // Drone removed.
    }
}
