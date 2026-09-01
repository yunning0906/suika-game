/**
 * Colored Pencil / Crayon Doodle Particle System
 * High performance & memory bounded, with extra-long persistent score popups.
 */

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.confetti = [];
        this.maxParticles = 60;
        this.maxConfetti = 50;
    }

    spawnMergeEffect(x, y, fruitData, score = 0, combo = 1) {
        const baseColor = fruitData.color;
        const count = Math.min(14, 8 + fruitData.tier);

        // Juice drops
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = 2.2 + Math.random() * 3.5;
            const size = 3 + Math.random() * 4.0;
            const life = 20 + Math.random() * 15;

            this.particles.push({
                type: 'crayon_dot',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.2,
                size: size,
                color: baseColor,
                outline: fruitData.pencilOutline || '#5A3D31',
                alpha: 1,
                life: life,
                maxLife: life,
                gravity: 0.16
            });
        }

        // Stars
        const starCount = Math.min(4, 2 + Math.floor(fruitData.tier / 2));
        for (let i = 0; i < starCount; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 2.5;
            const life = 25 + Math.random() * 10;

            this.particles.push({
                type: 'doodle_star',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.0,
                size: 5 + Math.random() * 5,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.15,
                color: '#FFEAA7',
                outline: '#795548',
                alpha: 1,
                life: life,
                maxLife: life,
                gravity: 0.05
            });
        }

        // Extra long persistent score popup (Stays ~2.4 seconds total!)
        if (score > 0) {
            this.floatingTexts.push({
                x: x,
                y: y - 14,
                text: `+${score}`,
                color: '#D63031',
                alpha: 1,
                scale: 0.5,
                targetScale: 1.15 + Math.min(combo * 0.12, 0.4),
                vy: -2.8,
                life: 140,         // ~2.33 seconds total duration
                maxLife: 140,
                fadeThreshold: 45  // Only fade in the last 0.75 seconds
            });
        }
    }

    spawnVictoryConfetti(width, height) {
        const colors = ['#FF7675', '#FFEAA7', '#55EFC4', '#74B9FF', '#A29BFE'];
        for (let i = 0; i < 40; i++) {
            if (this.confetti.length >= this.maxConfetti) break;
            this.confetti.push({
                x: Math.random() * width,
                y: -20 - Math.random() * 80,
                vx: (Math.random() - 0.5) * 2.5,
                vy: 2 + Math.random() * 3,
                width: 6 + Math.random() * 6,
                height: 10 + Math.random() * 8,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.12,
                alpha: 1,
                life: 120 + Math.random() * 40,
                maxLife: 160
            });
        }
    }

    update() {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0;
            p.life--;
            p.alpha = p.life / p.maxLife;

            if (p.type === 'doodle_star') {
                p.rotation += p.rotSpeed;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update floating score texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy;
            t.vy *= 0.95; // Gentle smooth float up and hover

            // Bouncy pop-in
            t.scale += (t.targetScale - t.scale) * 0.22;

            t.life--;

            // Fully solid for ~1.6 seconds, then gentle fade out during last 0.75s
            if (t.life <= t.fadeThreshold) {
                t.alpha = t.life / t.fadeThreshold;
            } else {
                t.alpha = 1.0;
            }

            if (t.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // Update confetti
        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const c = this.confetti[i];
            c.x += c.vx + Math.sin(c.life * 0.08) * 0.6;
            c.y += c.vy;
            c.rotation += c.rotSpeed;
            c.life--;
            c.alpha = c.life / c.maxLife;

            if (c.life <= 0) {
                this.confetti.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();

        // 1. Draw particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);

            if (p.type === 'crayon_dot') {
                ctx.fillStyle = p.color;
                ctx.strokeStyle = p.outline;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(0.5, p.size * (p.life / p.maxLife)), 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'doodle_star') {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.strokeStyle = p.outline;
                ctx.lineWidth = 1.2;
                this.drawStarShape(ctx, 0, 0, 4, p.size, p.size * 0.35);
                ctx.restore();
                continue;
            }

            ctx.restore();
        }

        // 2. Draw confetti
        for (let i = 0; i < this.confetti.length; i++) {
            const c = this.confetti[i];
            ctx.save();
            ctx.globalAlpha = Math.max(0, c.alpha);
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
            ctx.restore();
        }

        // 3. Draw Floating Score Text (Bold, large, clear white stroke)
        for (let i = 0; i < this.floatingTexts.length; i++) {
            const t = this.floatingTexts[i];
            ctx.save();
            ctx.globalAlpha = Math.max(0, t.alpha);
            ctx.translate(t.x, t.y);
            ctx.scale(t.scale, t.scale);

            ctx.font = 'bold 26px "Microsoft JhengHei", "微軟正黑體", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Thick white outline for crystal-clear readability
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 6;
            ctx.lineJoin = 'round';
            ctx.strokeText(t.text, 0, 0);

            // Bold red score text
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, 0, 0);

            ctx.restore();
        }

        ctx.restore();
    }

    drawStarShape(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = (Math.PI / 2) * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    clear() {
        this.particles = [];
        this.floatingTexts = [];
        this.confetti = [];
    }
}

window.particleSystem = new ParticleSystem();
