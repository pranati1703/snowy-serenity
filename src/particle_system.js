import { Snowflake } from './snowflake.js';

export class ParticleSystem {
    constructor(canvas, canvasFg, count = 120) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvasFg = canvasFg;
        this.ctxFg = canvasFg.getContext('2d'); // Foreground context
        this.particles = [];
        this.count = count;

        this.resize(canvas.width, canvas.height);

        for (let i = 0; i < this.count; i++) {
            this.particles.push(new Snowflake(this.width, this.height));
        }

        this.giantSnowflakeScale = 0;
        this.trails = [];
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
        this.canvas.width = w;
        this.canvas.height = h;
        this.canvasFg.width = w;
        this.canvasFg.height = h;
        this.particles.forEach(p => {
            p.w = w;
            p.h = h;
        });
    }

    update(handsData) {
        // Clear Background completely (Reverted trail effect)
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Clear Foreground completely (No trails)
        this.ctxFg.clearRect(0, 0, this.width, this.height);

        // Giant Snowflake Logic (per hand)
        // Note: Currently we only show one giant snowflake per hand if Closed.
        // We'll trust the individual snowflake loop for particles.

        // Draw Particles (Background)
        this.particles.forEach(p => {
            p.update(handsData);
            p.draw(this.ctx);
        });

        // Update and draw Trails (Foreground)
        this.trails = this.trails.filter(t => {
            t.x += t.vx;
            t.y += t.vy;
            t.alpha *= 0.94;
            t.size *= 0.96;

            if (t.alpha > 0.05) {
                this.ctxFg.save();
                this.ctxFg.globalAlpha = t.alpha;
                this.ctxFg.fillStyle = "#fff";
                this.ctxFg.beginPath();
                this.ctxFg.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                this.ctxFg.fill();
                this.ctxFg.restore();
                return true;
            }
            return false;
        });

        // Draw Giant Snowflakes (Foreground - Crisp)
        if (handsData && handsData.length > 0) {
            handsData.forEach(hand => {
                if (hand.state === 'CLOSED') {
                    // Animate scaling up using hand distance scale
                    // hand.scale is already normalized to roughly 0.1 - 1.0 (or more when close)
                    this.drawGiantSnowflake(this.ctxFg, hand.center.x * this.width, hand.center.y * this.height, hand.scale);
                }
            });
        }
    }

    drawGiantSnowflake(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Rotate slowly
        const time = Date.now() * 0.001;
        ctx.rotate(time * 0.5);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 3;

        const size = 100;

        // Draw detailed flake
        for (let i = 0; i < 6; i++) {
            ctx.rotate(Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, size);

            // Branches
            ctx.moveTo(0, size * 0.5);
            ctx.lineTo(size * 0.3, size * 0.7);
            ctx.moveTo(0, size * 0.5);
            ctx.lineTo(-size * 0.3, size * 0.7);

            ctx.moveTo(0, size * 0.8);
            ctx.lineTo(size * 0.2, size * 0.9);
            ctx.moveTo(0, size * 0.8);
            ctx.lineTo(-size * 0.2, size * 0.9);

            ctx.stroke();
        }

        // Center Glow
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();

        ctx.restore();
    }

    triggerFrostNova(x, y) {
        // Create an "explosion" of snowflakes
        for (let i = 0; i < 40; i++) {
            const flake = new Snowflake(this.width, this.height);
            flake.x = x;
            flake.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 20;
            flake.vx = Math.cos(angle) * speed;
            flake.vy = Math.sin(angle) * speed;
            this.particles.push(flake);
        }

        // Cap total particles to prevent lag
        if (this.particles.length > 500) {
            this.particles.splice(0, this.particles.length - 500);
        }
    }

    addTrailParticle(x, y) {
        this.trails.push({
            x, y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            alpha: 0.8,
            size: Math.random() * 3 + 2
        });
    }
}
