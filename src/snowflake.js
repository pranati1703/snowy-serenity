export class Snowflake {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.w;
        this.y = Math.random() * this.h;
        this.vx = (Math.random() - 0.5) * 8; // Further reduced from 15
        this.vy = (Math.random() - 0.5) * 8;
        this.size = Math.random() * 5 + 3; // Larger: 3 to 8
        this.alpha = Math.random() * 0.5 + 0.3;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.1;
    }

    update(handsData) {
        this.angle += this.spin;

        // Accumulate forces from hands
        if (handsData && handsData.length > 0) {
            // Find nearest hand to prioritize its influence
            // Or apply forces with inverse square falloff so only close hands matter

            handsData.forEach(hand => {
                const handX = hand.center.x * this.w;
                const handY = hand.center.y * this.h;

                const dx = handX - this.x;
                const dy = handY - this.y;
                const distSq = dx * dx + dy * dy;

                // Optimized distance check: Use squared threshold
                // 800^2 = 640000
                if (distSq > 640000) return;

                const dist = Math.sqrt(distSq);
                const ndx = dx / (dist || 1);
                const ndy = dy / (dist || 1);

                // Priority Weight: Stronger influence when close
                let weight = 1.0 - (dist / 800);
                weight = weight * weight; // sharper falloff

                if (hand.state === 'CLOSED') {
                    // DRAMATIC Attraction
                    const tx = -ndy;
                    const ty = ndx;

                    // Strong Pull
                    this.vx += ndx * 2.5 * weight;
                    this.vy += ndy * 2.5 * weight;
                    // Faster Spin
                    this.vx += tx * 1.2 * weight;
                    this.vy += ty * 1.2 * weight;

                } else if (hand.state === 'OPEN') {
                    // Optimized check: 600^2 = 360000
                    if (distSq < 360000) {
                        const force = (600 - dist) / 600;
                        this.vx -= ndx * force * 5.0;
                        this.vy -= ndy * force * 5.0;
                    }
                }
            });

            // Damping logic (Reduced damping for more speed retention)
            this.vx *= 0.96;
            this.vy *= 0.96;

        } else {
            // Normal Float - further reduced chaotic energy
            this.vx += (Math.random() - 0.5) * 0.4; // Reduced from 0.8
            this.vy += (Math.random() - 0.5) * 0.4;
            this.vx *= 0.95; // More damping (was 0.98)
            this.vy *= 0.95;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Wrap around
        if (this.x < 0) this.x = this.w;
        if (this.x > this.w) this.x = 0;
        if (this.y < 0) this.y = this.h;
        if (this.y > this.h) this.y = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = "#a5f3fc"; // Cyan-ish white
        ctx.strokeStyle = "#a5f3fc";
        ctx.lineWidth = 1.5;

        // Draw 6 main armsth();
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            ctx.moveTo(0, -this.size);
            ctx.lineTo(0, this.size);
            ctx.rotate(Math.PI / 3);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
