/**
 * Physics Engine & Fruit Collision / Merge Logic using Matter.js
 * Clean colored-pencil style, zero audio, 100% active gravity (zero mid-air freezing).
 */

class PhysicsWorld {
    constructor(canvas, onScoreAdd, onGameOver) {
        this.canvas = canvas;
        this.onScoreAdd = onScoreAdd;
        this.onGameOver = onGameOver;

        this.width = canvas.width;
        this.height = canvas.height;

        this.dangerLineY = 120;
        this.dangerTimer = 0;
        this.isDanger = false;
        this.dangerMaxTime = 160;

        this.fruits = [];
        this.mergeQueue = [];

        this.comboCount = 0;
        this.lastMergeTime = 0;
        this.comboResetDelay = 1800;
        this.difficulty = 'normal';

        this.initMatter();
    }

    setDifficulty(mode) {
        this.difficulty = mode;
        if (mode === 'easy') {
            this.dangerMaxTime = 220;
        } else if (mode === 'hard') {
            this.dangerMaxTime = 110;
        } else {
            this.dangerMaxTime = 160;
        }
    }

    initMatter() {
        const { Engine, World, Bodies, Events } = Matter;

        this.engine = Engine.create({
            // CRITICAL FIX: enableSleeping MUST be false so fruits never freeze mid-air!
            enableSleeping: false,
            positionIterations: 6,
            velocityIterations: 4,
            gravity: { x: 0, y: 2.8, scale: 0.0012 }
        });

        this.world = this.engine.world;

        const wallThickness = 60;
        const ground = Bodies.rectangle(
            this.width / 2,
            this.height + wallThickness / 2 - 5,
            this.width + 100,
            wallThickness,
            { isStatic: true, friction: 0.8, restitution: 0.2 }
        );

        const leftWall = Bodies.rectangle(
            -wallThickness / 2 + 5,
            this.height / 2,
            wallThickness,
            this.height * 2,
            { isStatic: true, friction: 0.2, restitution: 0.2 }
        );

        const rightWall = Bodies.rectangle(
            this.width + wallThickness / 2 - 5,
            this.height / 2,
            wallThickness,
            this.height * 2,
            { isStatic: true, friction: 0.2, restitution: 0.2 }
        );

        // Simple, clean chamfer blocks at bottom corners to prevent dead-corner sticking
        const leftChamfer = Bodies.rectangle(15, this.height - 15, 50, 20, {
            isStatic: true,
            angle: Math.PI / 4,
            friction: 0.3,
            restitution: 0.2
        });

        const rightChamfer = Bodies.rectangle(this.width - 15, this.height - 15, 50, 20, {
            isStatic: true,
            angle: -Math.PI / 4,
            friction: 0.3,
            restitution: 0.2
        });

        World.add(this.world, [ground, leftWall, rightWall, leftChamfer, rightChamfer]);

        Events.on(this.engine, 'collisionStart', (event) => {
            const pairs = event.pairs;
            for (let i = 0; i < pairs.length; i++) {
                const { bodyA, bodyB } = pairs[i];
                this.handleCollision(bodyA, bodyB);
            }
        });
    }

    createFruit(x, y, tier, isStatic = false) {
        const config = FRUIT_TIERS[tier] || FRUIT_TIERS[0];
        const { Bodies, World } = Matter;

        const restitution = this.difficulty === 'hard' ? 0.24 : (this.difficulty === 'easy' ? 0.14 : 0.18);
        const friction = this.difficulty === 'hard' ? 0.25 : (this.difficulty === 'easy' ? 0.35 : 0.3);

        const body = Bodies.circle(x, y, config.radius, {
            restitution: restitution,
            friction: friction,
            frictionAir: 0.001, // Extremely low air friction for smooth downward fall
            density: 0.002 * (1 + tier * 0.08),
            isStatic: isStatic,
            label: 'fruit'
        });

        body.tier = tier;
        body.isMerging = false;
        body.dropTime = Date.now();
        body.scaleX = 1.0;
        body.scaleY = 1.0;
        body.targetScaleX = 1.0;
        body.targetScaleY = 1.0;

        if (!isStatic) {
            World.add(this.world, body);
            this.fruits.push(body);
        }

        return body;
    }

    handleCollision(bodyA, bodyB) {
        if (bodyA.label === 'fruit') {
            const speed = Matter.Vector.magnitude(bodyA.velocity);
            if (speed > 2.5) {
                bodyA.scaleX = 1.15;
                bodyA.scaleY = 0.88;
                if (speed > 3.5 && window.soundEngine) {
                    window.soundEngine.playBounce();
                }
            }
        }
        if (bodyB.label === 'fruit') {
            const speed = Matter.Vector.magnitude(bodyB.velocity);
            if (speed > 2.5) {
                bodyB.scaleX = 1.15;
                bodyB.scaleY = 0.88;
                if (speed > 3.5 && window.soundEngine) {
                    window.soundEngine.playBounce();
                }
            }
        }

        if (bodyA.label === 'fruit' && bodyB.label === 'fruit') {
            if (bodyA.tier === bodyB.tier && !bodyA.isMerging && !bodyB.isMerging) {
                if (bodyA.tier < FRUIT_TIERS.length - 1) {
                    bodyA.isMerging = true;
                    bodyB.isMerging = true;
                    this.mergeQueue.push({ bodyA, bodyB, nextTier: bodyA.tier + 1 });
                }
            }
        }
    }

    processMerges() {
        if (this.mergeQueue.length === 0) return;

        const now = Date.now();
        if (now - this.lastMergeTime < this.comboResetDelay) {
            this.comboCount++;
        } else {
            this.comboCount = 1;
        }
        this.lastMergeTime = now;

        const { World } = Matter;

        while (this.mergeQueue.length > 0) {
            const { bodyA, bodyB, nextTier } = this.mergeQueue.shift();

            const midX = (bodyA.position.x + bodyB.position.x) / 2;
            const midY = (bodyA.position.y + bodyB.position.y) / 2;

            // Remove merged fruits from world
            World.remove(this.world, bodyA);
            World.remove(this.world, bodyB);

            this.fruits = this.fruits.filter((f) => f !== bodyA && f !== bodyB);

            // Spawn upgraded fruit at midpoint
            const newFruit = this.createFruit(midX, midY, nextTier);
            newFruit.scaleX = 1.35;
            newFruit.scaleY = 0.75;

            // Gentle pop impulse
            Matter.Body.setVelocity(newFruit, {
                x: (Math.random() - 0.5) * 1.2,
                y: -2.0
            });

            // Wake up and ensure all remaining fruits stay dynamic
            for (let i = 0; i < this.fruits.length; i++) {
                this.fruits[i].isSleeping = false;
            }

            const fruitConfig = FRUIT_TIERS[nextTier];
            const baseScore = fruitConfig.score;
            const totalScore = baseScore * this.comboCount;

            if (this.onScoreAdd) {
                this.onScoreAdd(totalScore, this.comboCount, fruitConfig);
            }

            if (window.soundEngine) {
                window.soundEngine.playMerge(nextTier, this.comboCount);
                if (this.comboCount > 1) {
                    window.soundEngine.playCombo(this.comboCount);
                }
            }

            if (window.particleSystem) {
                window.particleSystem.spawnMergeEffect(midX, midY, fruitConfig, totalScore, this.comboCount);
            }

            if (nextTier === FRUIT_TIERS.length - 1) {
                if (window.soundEngine) {
                    window.soundEngine.playVictory();
                }
                if (window.particleSystem) {
                    window.particleSystem.spawnVictoryConfetti(this.width, this.height);
                }
            }
        }
    }

    update() {
        Matter.Engine.update(this.engine, 1000 / 60);
        this.processMerges();

        const now = Date.now();
        let exceedingFruitCount = 0;

        for (let i = 0; i < this.fruits.length; i++) {
            const fruit = this.fruits[i];

            // Anti-freeze watchdog: Ensure fruits never stay asleep or stuck in mid-air
            fruit.isSleeping = false;

            // Squash & stretch recovery
            if (fruit.scaleX !== fruit.targetScaleX || fruit.scaleY !== fruit.targetScaleY) {
                fruit.scaleX += (fruit.targetScaleX - fruit.scaleX) * 0.18;
                fruit.scaleY += (fruit.targetScaleY - fruit.scaleY) * 0.18;
            }

            // Danger line check
            if (now - fruit.dropTime > 1200) {
                const config = FRUIT_TIERS[fruit.tier];
                const topEdge = fruit.position.y - config.radius;
                const speed = Matter.Vector.magnitude(fruit.velocity);

                if (topEdge < this.dangerLineY && speed < 1.8) {
                    exceedingFruitCount++;
                }
            }
        }

        if (exceedingFruitCount > 0) {
            this.isDanger = true;
            this.dangerTimer++;
            if (this.dangerTimer >= this.dangerMaxTime) {
                if (this.onGameOver) {
                    this.onGameOver();
                }
            }
        } else {
            this.isDanger = false;
            this.dangerTimer = Math.max(0, this.dangerTimer - 2);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.setLineDash([8, 6]);
        if (this.isDanger) {
            const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.012);
            ctx.strokeStyle = `rgba(225, 112, 85, ${0.5 + pulse * 0.5})`;
            ctx.lineWidth = 3.5;

            const progressWidth = (this.dangerTimer / this.dangerMaxTime) * this.width;
            ctx.fillStyle = 'rgba(255, 118, 117, 0.22)';
            ctx.fillRect(0, this.dangerLineY - 4, progressWidth, 8);
        } else {
            ctx.strokeStyle = 'rgba(180, 130, 110, 0.45)';
            ctx.lineWidth = 2;
        }

        ctx.beginPath();
        ctx.moveTo(10, this.dangerLineY);
        ctx.lineTo(this.width - 10, this.dangerLineY);
        ctx.stroke();
        ctx.restore();

        if (window.fruitRenderer) {
            for (let i = 0; i < this.fruits.length; i++) {
                window.fruitRenderer.drawFruit(ctx, this.fruits[i]);
            }
        }
    }

    reset() {
        const { World } = Matter;
        for (let i = 0; i < this.fruits.length; i++) {
            World.remove(this.world, this.fruits[i]);
        }
        this.fruits = [];
        this.mergeQueue = [];
        this.dangerTimer = 0;
        this.isDanger = false;
        this.comboCount = 0;
    }
}

window.PhysicsWorld = PhysicsWorld;
