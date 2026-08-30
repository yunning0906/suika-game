/**
 * Physics Engine & Fruit Collision / Merge Logic using Matter.js
 * High-performance configuration (enableSleeping: true, zero memory leaks, fast steady framerate).
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

        this.initMatter();
    }

    initMatter() {
        const { Engine, World, Bodies, Events } = Matter;

        this.engine = Engine.create({
            enableSleeping: true, // Crucial: lets settled bottom fruits sleep, keeping 60 FPS even with 40+ fruits!
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
            { isStatic: true, friction: 0.3, restitution: 0.2 }
        );

        const rightWall = Bodies.rectangle(
            this.width + wallThickness / 2 - 5,
            this.height / 2,
            wallThickness,
            this.height * 2,
            { isStatic: true, friction: 0.3, restitution: 0.2 }
        );

        const cornerSize = 40;
        const leftCorner = Bodies.fromVertices(
            20,
            this.height - 20,
            [
                { x: 0, y: this.height },
                { x: cornerSize, y: this.height },
                { x: 0, y: this.height - cornerSize }
            ],
            { isStatic: true, friction: 0.5, restitution: 0.3 }
        );

        const rightCorner = Bodies.fromVertices(
            this.width - 20,
            this.height - 20,
            [
                { x: this.width, y: this.height },
                { x: this.width - cornerSize, y: this.height },
                { x: this.width, y: this.height - cornerSize }
            ],
            { isStatic: true, friction: 0.5, restitution: 0.3 }
        );

        World.add(this.world, [ground, leftWall, rightWall]);
        if (leftCorner && rightCorner) {
            World.add(this.world, [leftCorner, rightCorner]);
        }

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

        const body = Bodies.circle(x, y, config.radius, {
            restitution: 0.2,
            friction: 0.35,
            frictionAir: 0.002,
            density: 0.0018 * (1 + tier * 0.08),
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
            }
        }
        if (bodyB.label === 'fruit') {
            const speed = Matter.Vector.magnitude(bodyB.velocity);
            if (speed > 2.5) {
                bodyB.scaleX = 1.15;
                bodyB.scaleY = 0.88;
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

            World.remove(this.world, bodyA);
            World.remove(this.world, bodyB);

            this.fruits = this.fruits.filter((f) => f !== bodyA && f !== bodyB);

            const newFruit = this.createFruit(midX, midY, nextTier);
            newFruit.scaleX = 1.35;
            newFruit.scaleY = 0.75;

            Matter.Body.setVelocity(newFruit, {
                x: (Math.random() - 0.5) * 1.5,
                y: -3.0
            });

            const fruitConfig = FRUIT_TIERS[nextTier];
            const baseScore = fruitConfig.score;
            const totalScore = baseScore * this.comboCount;

            if (this.onScoreAdd) {
                this.onScoreAdd(totalScore, this.comboCount, fruitConfig);
            }

            if (window.particleSystem) {
                window.particleSystem.spawnMergeEffect(midX, midY, fruitConfig, totalScore, this.comboCount);
            }

            if (nextTier === FRUIT_TIERS.length - 1) {
                if (window.particleSystem) {
                    window.particleSystem.spawnVictoryConfetti(this.width, this.height);
                }
            }
        }
    }

    update() {
        Matter.Engine.update(this.engine, 1000 / 60);
        this.processMerges();

        for (let i = 0; i < this.fruits.length; i++) {
            const fruit = this.fruits[i];
            if (fruit.scaleX !== fruit.targetScaleX || fruit.scaleY !== fruit.targetScaleY) {
                fruit.scaleX += (fruit.targetScaleX - fruit.scaleX) * 0.18;
                fruit.scaleY += (fruit.targetScaleY - fruit.scaleY) * 0.18;
            }
        }

        const now = Date.now();
        let exceedingFruitCount = 0;

        for (let i = 0; i < this.fruits.length; i++) {
            const fruit = this.fruits[i];
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
