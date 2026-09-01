/**
 * Colored Pencil (色鉛筆手繪風) Fruit Definitions & Dynamic Vector Renderer
 * Clean minimalist aesthetic: No strawberry seeds, no blush, smaller cute black dot eyes.
 */

const FRUIT_TIERS = [
    {
        tier: 0,
        name: 'Cherry',
        radius: 17,
        score: 2,
        color: '#FF6B7A',
        accentColor: '#FFA3AC',
        pencilOutline: '#5A3D31',
        stroke: '#5A3D31'
    },
    {
        tier: 1,
        name: 'Strawberry',
        radius: 25,
        score: 4,
        color: '#FF5E6C',
        accentColor: '#FF9EAA',
        leafColor: '#7BC676',
        pencilOutline: '#5A3D31',
        stroke: '#5A3D31'
    },
    {
        tier: 2,
        name: 'Grape',
        radius: 33,
        score: 8,
        color: '#A57BC9',
        accentColor: '#CFB5EB',
        leafColor: '#7BC676',
        pencilOutline: '#4A3245',
        stroke: '#4A3245'
    },
    {
        tier: 3,
        name: 'Dekopon',
        radius: 42,
        score: 16,
        color: '#FFA74F',
        accentColor: '#FFCE85',
        leafColor: '#7BC676',
        pencilOutline: '#5A3E28',
        stroke: '#5A3E28'
    },
    {
        tier: 4,
        name: 'Persimmon',
        radius: 52,
        score: 32,
        color: '#FF7657',
        accentColor: '#FFAE96',
        calyxColor: '#5EA882',
        pencilOutline: '#593424',
        stroke: '#593424'
    },
    {
        tier: 5,
        name: 'Apple',
        radius: 63,
        score: 64,
        color: '#EE5A5A',
        accentColor: '#FF9696',
        stemColor: '#6B4C35',
        leafColor: '#66BB6A',
        pencilOutline: '#4A2A2A',
        stroke: '#4A2A2A'
    },
    {
        tier: 6,
        name: 'Pear',
        radius: 74,
        score: 128,
        color: '#C6E377',
        accentColor: '#E4F4A5',
        stemColor: '#6B4C35',
        leafColor: '#4CAF50',
        pencilOutline: '#475225',
        stroke: '#475225'
    },
    {
        tier: 7,
        name: 'Peach',
        radius: 86,
        score: 256,
        color: '#FFB2C9',
        accentColor: '#FFE0EB',
        leafColor: '#66BB6A',
        pencilOutline: '#633B48',
        stroke: '#633B48'
    },
    {
        tier: 8,
        name: 'Pineapple',
        radius: 98,
        score: 512,
        color: '#FCD858',
        accentColor: '#FFF09E',
        leafColor: '#81C784',
        pencilOutline: '#5E4C1D',
        stroke: '#5E4C1D'
    },
    {
        tier: 9,
        name: 'Melon',
        radius: 110,
        score: 1024,
        color: '#9EE6A8',
        accentColor: '#D2F8D7',
        meshColor: '#7AC985',
        pencilOutline: '#35543A',
        stroke: '#35543A'
    },
    {
        tier: 10,
        name: 'Watermelon',
        radius: 124,
        score: 2048,
        color: '#65D38A',
        accentColor: '#A8F2C0',
        stripeColor: '#1F5434',
        pencilOutline: '#1F472E',
        stroke: '#1F472E'
    }
];

class FruitRenderer {
    constructor() {
        this.time = 0;
    }

    update() {
        this.time += 0.05;
    }

    /**
     * Draw fruit in colored pencil style
     */
    drawFruit(ctx, fruitBody, previewMode = false) {
        const tier = fruitBody.tier !== undefined ? fruitBody.tier : 0;
        const config = FRUIT_TIERS[tier] || FRUIT_TIERS[0];
        const radius = fruitBody.circleRadius || config.radius;
        const pos = fruitBody.position || { x: 0, y: 0 };
        const angle = fruitBody.angle || 0;

        const scaleX = fruitBody.scaleX || 1.0;
        const scaleY = fruitBody.scaleY || 1.0;

        if (!fruitBody.blinkTimer) {
            fruitBody.blinkTimer = Math.floor(70 + Math.random() * 180);
            fruitBody.isBlinking = false;
        }
        if (!previewMode) {
            fruitBody.blinkTimer--;
            if (fruitBody.blinkTimer <= 0) {
                fruitBody.isBlinking = true;
                if (fruitBody.blinkTimer < -6) {
                    fruitBody.isBlinking = false;
                    fruitBody.blinkTimer = Math.floor(100 + Math.random() * 200);
                }
            }
        }

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        ctx.scale(scaleX, scaleY);

        // 1. Base Colored-Pencil Body
        this.drawPencilBody(ctx, config, radius);

        // 2. Fruit Features (Leaves, Stems, Stripes)
        this.drawPencilFeatures(ctx, config, radius);

        // 3. Face: Smaller black dot eyes, no blush
        this.drawMatteFace(ctx, config, radius, fruitBody.isBlinking, tier);

        ctx.restore();
    }

    drawPencilBody(ctx, config, r) {
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Shading crosshatch strokes (bottom-right shadow)
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
        ctx.clip();

        ctx.strokeStyle = config.pencilOutline;
        ctx.globalAlpha = 0.14;
        ctx.lineWidth = 1.2;
        for (let i = -r * 0.5; i <= r * 1.3; i += 6) {
            ctx.beginPath();
            ctx.moveTo(i, r * 0.25);
            ctx.lineTo(i + r * 0.5, r * 0.95);
            ctx.stroke();
        }
        ctx.restore();

        // Hand-Drawn Outline
        ctx.save();
        ctx.strokeStyle = config.pencilOutline;
        ctx.lineWidth = Math.max(2.2, r * 0.05);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 0.35;
        ctx.lineWidth = Math.max(1.2, r * 0.03);
        ctx.beginPath();
        ctx.arc(0.3, 0.3, r - 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    drawPencilFeatures(ctx, config, r) {
        const outlineColor = config.pencilOutline;

        switch (config.tier) {
            case 0: // 🍒 Cherry
                ctx.save();
                ctx.strokeStyle = '#524338';
                ctx.lineWidth = Math.max(2.2, r * 0.12);
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.85);
                ctx.quadraticCurveTo(r * 0.35, -r * 1.45, r * 0.25, -r * 1.65);
                ctx.stroke();

                ctx.fillStyle = '#8BC34A';
                ctx.strokeStyle = '#524338';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(r * 0.3, -r * 1.55, r * 0.32, r * 0.16, -Math.PI / 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                break;

            case 1: // 🍓 Strawberry (草變小，點點已刪除)
                ctx.save();
                ctx.fillStyle = '#81C784';
                ctx.strokeStyle = outlineColor;
                ctx.lineWidth = 1.2;
                for (let i = -1; i <= 1; i++) {
                    ctx.beginPath();
                    ctx.ellipse(i * (r * 0.22), -r * 0.95, r * 0.09, r * 0.14, (i * Math.PI) / 10, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.restore();
                break;

            case 2: // 🍇 Grape
                ctx.save();
                ctx.fillStyle = '#81C784';
                ctx.strokeStyle = outlineColor;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(r * 0.2, -r * 0.95, r * 0.24, r * 0.13, -Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                break;

            case 3: // 🍊 Dekopon
                ctx.save();
                ctx.fillStyle = config.color;
                ctx.strokeStyle = outlineColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, -r * 0.92, r * 0.22, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#81C784';
                ctx.beginPath();
                ctx.ellipse(r * 0.2, -r * 1.05, r * 0.22, r * 0.12, Math.PI / 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                break;

            case 4: // 🍅 Persimmon
                ctx.save();
                ctx.fillStyle = '#5EA882';
                ctx.strokeStyle = outlineColor;
                ctx.lineWidth = 1.8;
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.ellipse(
                        Math.cos((i * Math.PI) / 2) * (r * 0.28),
                        -r * 0.82 + Math.sin((i * Math.PI) / 2) * (r * 0.14),
                        r * 0.19,
                        r * 0.11,
                        (i * Math.PI) / 2,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.restore();
                break;

            case 5: // 🍎 Apple
                ctx.save();
                ctx.strokeStyle = '#5D4037';
                ctx.lineWidth = Math.max(2.8, r * 0.08);
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.88);
                ctx.quadraticCurveTo(r * 0.1, -r * 1.15, r * 0.2, -r * 1.25);
                ctx.stroke();

                ctx.fillStyle = '#81C784';
                ctx.strokeStyle = outlineColor;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.ellipse(r * 0.35, -r * 1.15, r * 0.25, r * 0.13, -Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                break;

            case 6: // 🍐 Pear
                ctx.save();
                ctx.strokeStyle = '#5D4037';
                ctx.lineWidth = Math.max(2.8, r * 0.07);
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.9);
                ctx.lineTo(r * 0.1, -r * 1.18);
                ctx.stroke();

                ctx.fillStyle = '#81C784';
                ctx.strokeStyle = outlineColor;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.ellipse(r * 0.25, -r * 1.1, r * 0.2, r * 0.1, Math.PI / 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                break;

            case 7: // 🍑 Peach
                ctx.save();
                ctx.strokeStyle = 'rgba(163, 75, 105, 0.45)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.95);
                ctx.quadraticCurveTo(0, -r * 0.3, 0, 0);
                ctx.stroke();

                ctx.fillStyle = '#81C784';
                ctx.strokeStyle = outlineColor;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.ellipse(-r * 0.25, -r * 0.95, r * 0.28, r * 0.13, -Math.PI / 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                break;

            case 8: // 🍍 Pineapple
                ctx.save();
                ctx.fillStyle = '#81C784';
                ctx.strokeStyle = outlineColor;
                ctx.lineWidth = 2;
                const leafAngles = [-0.42, -0.2, 0, 0.2, 0.42];
                for (const la of leafAngles) {
                    ctx.save();
                    ctx.rotate(la);
                    ctx.beginPath();
                    ctx.moveTo(-r * 0.12, -r * 0.85);
                    ctx.lineTo(0, -r * 1.35);
                    ctx.lineTo(r * 0.12, -r * 0.85);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }

                ctx.strokeStyle = 'rgba(150, 95, 25, 0.35)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let d = -0.5; d <= 0.5; d += 0.35) {
                    ctx.moveTo(-r * 0.7, d * r);
                    ctx.lineTo(r * 0.7, (d + 0.3) * r);
                    ctx.moveTo(r * 0.7, d * r);
                    ctx.lineTo(-r * 0.7, (d + 0.3) * r);
                }
                ctx.stroke();
                ctx.restore();
                break;

            case 9: // 🍈 Melon
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                for (let i = -0.6; i <= 0.6; i += 0.4) {
                    ctx.moveTo(i * r * 0.8, -r * 0.85);
                    ctx.quadraticCurveTo(i * r * 1.2, 0, i * r * 0.8, r * 0.85);
                }
                ctx.stroke();

                ctx.strokeStyle = '#5D4037';
                ctx.lineWidth = 3.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.92);
                ctx.lineTo(0, -r * 1.15);
                ctx.moveTo(-r * 0.18, -r * 1.15);
                ctx.lineTo(r * 0.18, -r * 1.15);
                ctx.stroke();
                ctx.restore();
                break;

            case 10: // 🍉 Watermelon
                ctx.save();
                ctx.beginPath();
                ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2);
                ctx.clip();

                ctx.strokeStyle = config.stripeColor || '#1F5434';
                ctx.lineWidth = Math.max(4.0, r * 0.08);
                ctx.lineCap = 'round';

                const stripeRatios = [-0.7, -0.35, 0, 0.35, 0.7];
                for (let s = 0; s < stripeRatios.length; s++) {
                    const ratio = stripeRatios[s];
                    const startX = ratio * r * 0.85;
                    const midCurve = ratio === 0 ? 4 : ratio * 8;

                    ctx.beginPath();
                    ctx.moveTo(startX * 0.8, -r * 0.98);
                    ctx.quadraticCurveTo(startX + midCurve, 0, startX * 0.8, r * 0.98);
                    ctx.stroke();
                }
                ctx.restore();

                ctx.save();
                ctx.strokeStyle = '#5D4037';
                ctx.lineWidth = Math.max(3.0, r * 0.065);
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.92);
                ctx.quadraticCurveTo(r * 0.12, -r * 1.15, r * 0.22, -r * 1.2);
                ctx.stroke();
                ctx.restore();
                break;
        }
    }

    /**
     * Draw Face: Smaller solid black dot eyes, NO blush (完全刪除腮紅，眼睛更小巧)
     */
    drawMatteFace(ctx, config, r, isBlinking, tier) {
        ctx.save();
        const eyeOffsetX = r * 0.32;
        const eyeOffsetY = r * 0.06;
        // Smaller delicate eyes: scaled down
        const eyeRadius = Math.max(1.6, r * 0.052);
        const pencilLead = '#222222';

        // 1. NO BLUSH (已刪除腮紅)

        // 2. Eyes: Smaller Solid Black Dots
        if (isBlinking) {
            ctx.strokeStyle = pencilLead;
            ctx.lineWidth = Math.max(1.5, r * 0.045);
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.arc(-eyeOffsetX, eyeOffsetY + 1, eyeRadius * 1.1, Math.PI * 1.15, Math.PI * 1.85);
            ctx.arc(eyeOffsetX, eyeOffsetY + 1, eyeRadius * 1.1, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();
        } else {
            ctx.fillStyle = pencilLead;
            ctx.beginPath();
            ctx.arc(-eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
            ctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Cute Hand-drawn Smile
        ctx.strokeStyle = pencilLead;
        ctx.lineWidth = Math.max(1.6, r * 0.048);
        ctx.lineCap = 'round';

        if (tier >= 8) {
            ctx.fillStyle = '#FF7582';
            ctx.beginPath();
            ctx.arc(0, eyeOffsetY + r * 0.13, r * 0.13, 0, Math.PI);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(0, eyeOffsetY + r * 0.11, r * 0.1, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();
        }

        ctx.restore();
    }
}

window.fruitRenderer = new FruitRenderer();
