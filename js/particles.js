/**
 * Colored Pencil / Crayon Doodle Particle System
 * High performance & memory bounded.
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

        if (score > 0) {
            this.floatingTexts.push({
                x: x,
                y: y - 10,
                text: `+${score}`,
                color: '#D63031',
                alpha: 1,
                scale: 1 + Math.min(combo * 0.15, 0.4),
                vy: -2.0,
                life: 35,
                maxLife: 35
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

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy;
            t.vy *= 0.94;
            t.life--;
            t.alpha = t.life / t.maxLife;

            if (t.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

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

        for (let i = 0; i < this.floatingTexts.length; i++) {
            const t = this.floatingTexts[i];
            ctx.save();
            ctx.globalAlpha = Math.max(0, t.alpha);
            ctx.translate(t.x, t.y);
            ctx.scale(t.scale, t.scale);

            ctx.font = 'bold 20px "Microsoft JhengHei", "微軟正黑體", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.lineJoin = 'round';
            ctx.strokeText(t.text, 0, 0);

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
