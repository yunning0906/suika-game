/**
 * Main Suika Game Orchestrator (Smooth Drop, Anti-Freeze, Touch/Mouse Only)
 */

class SuikaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = 440;
        this.canvas.height = 680;

        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('suika_high_score_v1') || '0', 10);

        this.isGameOver = false;
        this.isPaused = false;
        this.canDrop = true;
        this.dropCooldown = 420;

        this.dropperX = this.canvas.width / 2;
        this.targetDropperX = this.canvas.width / 2;
        this.dropperY = 52;

        this.currentTier = this.getRandomDropTier();
        this.nextTier = this.getRandomDropTier();

        this.initUIElements();
        this.initPhysics();
        this.initEventListeners();
        this.updateHUD();
        this.renderNextFruitPreview();
        this.renderEvolutionBar();

        // Start continuous cute background music
        if (window.soundEngine) {
            window.soundEngine.startBGM();
        }

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    initUIElements() {
        this.scoreEl = document.getElementById('currentScore');
        this.highScoreEl = document.getElementById('highScore');
        this.nextFruitCanvas = document.getElementById('nextFruitCanvas');
        this.nextFruitCtx = this.nextFruitCanvas ? this.nextFruitCanvas.getContext('2d') : null;

        this.evolutionCanvas = document.getElementById('evolutionCanvas');
        this.evolutionCtx = this.evolutionCanvas ? this.evolutionCanvas.getContext('2d') : null;

        this.gameOverModal = document.getElementById('gameOverModal');
        this.finalScoreEl = document.getElementById('finalScore');
        this.bestScoreEl = document.getElementById('bestScoreModal');

        this.restartBtn = document.getElementById('restartBtn');
        this.modalRestartBtn = document.getElementById('modalRestartBtn');
    }

    initPhysics() {
        this.physics = new PhysicsWorld(
            this.canvas,
            (scoreToAdd, combo, fruitConfig) => this.onScoreGained(scoreToAdd, combo, fruitConfig),
            () => this.triggerGameOver()
        );
    }

    getRandomDropTier() {
        const rand = Math.random();
        if (rand < 0.35) return 0;
        if (rand < 0.65) return 1;
        if (rand < 0.85) return 2;
        if (rand < 0.95) return 3;
        return 4;
    }

    initEventListeners() {
        const handlePointerMove = (e) => {
            if (this.isGameOver || this.isPaused) return;
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const scaleX = this.canvas.width / rect.width;
            const rawX = (clientX - rect.left) * scaleX;

            const curConfig = FRUIT_TIERS[this.currentTier];
            const margin = curConfig.radius + 15;
            this.targetDropperX = Math.max(margin, Math.min(this.canvas.width - margin, rawX));
        };

        const handlePointerDrop = (e) => {
            if (this.isGameOver || this.isPaused) return;
            if (e.target !== this.canvas) return;
            this.dropFruit();
        };

        this.canvas.addEventListener('mousemove', handlePointerMove);
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            handlePointerMove(e);
        }, { passive: false });

        this.canvas.addEventListener('click', handlePointerDrop);
        this.canvas.addEventListener('touchend', handlePointerDrop);

        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => this.resetGame());
        }

        if (this.modalRestartBtn) {
            this.modalRestartBtn.addEventListener('click', () => this.resetGame());
        }
    }

    getSpawnY() {
        const curConfig = FRUIT_TIERS[this.currentTier];
        return Math.max(curConfig.radius + 10, this.dropperY);
    }

    dropFruit() {
        if (!this.canDrop || this.isGameOver || this.isPaused) return;

        this.canDrop = false;

        const spawnX = this.dropperX;
        const spawnY = this.getSpawnY();

        const fruitBody = this.physics.createFruit(spawnX, spawnY, this.currentTier);
        fruitBody.scaleX = 0.88;
        fruitBody.scaleY = 1.15;

        // Downward velocity for immediate snappy fall
        Matter.Body.setVelocity(fruitBody, { x: 0, y: 5.5 });

        // Play cute bubble drop sound
        if (window.soundEngine) {
            window.soundEngine.playDrop();
        }

        this.currentTier = this.nextTier;
        this.nextTier = this.getRandomDropTier();
        this.renderNextFruitPreview();

        setTimeout(() => {
            this.canDrop = true;
        }, this.dropCooldown);
    }

    onScoreGained(scoreToAdd, combo, fruitConfig) {
        this.score += scoreToAdd;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('suika_high_score_v1', this.highScore.toString());
        }

        this.updateHUD();
    }

    updateHUD() {
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        if (this.highScoreEl) this.highScoreEl.textContent = this.highScore;
    }

    renderNextFruitPreview() {
        if (!this.nextFruitCtx) return;
        const ctx = this.nextFruitCtx;
        ctx.clearRect(0, 0, this.nextFruitCanvas.width, this.nextFruitCanvas.height);

        const config = FRUIT_TIERS[this.nextTier];
        const cx = this.nextFruitCanvas.width / 2;
        const cy = this.nextFruitCanvas.height / 2;

        const scale = Math.min(1.2, 36 / config.radius);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        const dummyBody = {
            tier: this.nextTier,
            position: { x: 0, y: 0 },
            circleRadius: config.radius,
            angle: 0,
            scaleX: 1,
            scaleY: 1,
            isBlinking: false
        };

        if (window.fruitRenderer) {
            window.fruitRenderer.drawFruit(ctx, dummyBody, true);
        }
        ctx.restore();
    }

    renderEvolutionBar() {
        if (!this.evolutionCtx) return;
        const canvas = this.evolutionCanvas;
        const ctx = this.evolutionCtx;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const totalFruits = FRUIT_TIERS.length;
        const spacing = canvas.width / totalFruits;

        for (let i = 0; i < totalFruits; i++) {
            const config = FRUIT_TIERS[i];
            const cx = spacing * i + spacing / 2;
            const cy = canvas.height / 2;

            const radius = 10 + i * 0.95;
            ctx.save();
            ctx.translate(cx, cy);

            const scale = radius / config.radius;
            ctx.scale(scale, scale);

            const dummyBody = {
                tier: i,
                position: { x: 0, y: 0 },
                circleRadius: config.radius,
                angle: 0,
                scaleX: 1,
                scaleY: 1,
                isBlinking: false
            };

            if (window.fruitRenderer) {
                window.fruitRenderer.drawFruit(ctx, dummyBody, true);
            }
            ctx.restore();

            if (i < totalFruits - 1) {
                const arrowX = cx + spacing / 2;
                ctx.save();
                ctx.strokeStyle = '#B8A495';
                ctx.fillStyle = '#B8A495';
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(arrowX - 5, cy);
                ctx.lineTo(arrowX + 3, cy);
                ctx.lineTo(arrowX, cy - 3);
                ctx.moveTo(arrowX + 3, cy);
                ctx.lineTo(arrowX, cy + 3);
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        if (window.soundEngine) {
            window.soundEngine.playGameOver();
        }

        if (this.finalScoreEl) this.finalScoreEl.textContent = this.score;
        if (this.bestScoreEl) this.bestScoreEl.textContent = this.highScore;

        if (this.gameOverModal) {
            this.gameOverModal.classList.remove('hidden');
        }
    }

    resetGame() {
        if (window.soundEngine) {
            window.soundEngine.playClick();
        }

        this.score = 0;
        this.isGameOver = false;
        this.canDrop = true;
        this.physics.reset();
        if (window.particleSystem) window.particleSystem.clear();

        this.currentTier = this.getRandomDropTier();
        this.nextTier = this.getRandomDropTier();

        this.updateHUD();
        this.renderNextFruitPreview();

        if (this.gameOverModal) {
            this.gameOverModal.classList.add('hidden');
        }
    }

    gameLoop(timestamp) {
        this.lastTime = timestamp;

        this.dropperX += (this.targetDropperX - this.dropperX) * 0.25;

        if (!this.isPaused && !this.isGameOver) {
            this.physics.update();
        }

        if (window.fruitRenderer) window.fruitRenderer.update();
        if (window.particleSystem) window.particleSystem.update();

        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Physics Fruits & Danger Line
        this.physics.draw(ctx);

        // 2. Particles & Popups
        if (window.particleSystem) {
            window.particleSystem.draw(ctx);
        }

        // 3. Hanging Fruit & Guide Line
        if (!this.isGameOver) {
            this.drawDropper(ctx);
        }
    }

    drawDropper(ctx) {
        const x = this.dropperX;
        const y = this.getSpawnY();
        const curConfig = FRUIT_TIERS[this.currentTier];

        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(160, 110, 95, 0.4)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(x, y + curConfig.radius + 6);
        ctx.lineTo(x, this.canvas.height - 15);
        ctx.stroke();
        ctx.restore();

        if (this.canDrop) {
            ctx.save();
            const dummyBody = {
                tier: this.currentTier,
                position: { x: x, y: y },
                circleRadius: curConfig.radius,
                angle: Math.sin(Date.now() * 0.005) * 0.08,
                scaleX: 1,
                scaleY: 1,
                isBlinking: false
            };
            if (window.fruitRenderer) {
                window.fruitRenderer.drawFruit(ctx, dummyBody, true);
            }
            ctx.restore();
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.suikaGame = new SuikaGame();
});
