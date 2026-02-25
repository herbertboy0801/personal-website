class Game {
    constructor(ctx, width, height, assets) { // 添加 assets 参数
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.assets = assets; // 存储加载的资源
        this.gameState = 'startScreen'; // 'startScreen', 'playing', 'gameOver'
        this.player = null; // 稍后初始化玩家

        // --- Bullet Pooling ---
        this.activeBullets = []; // 存储屏幕上活跃的子弹
        this.playerBulletPool = []; // 玩家子弹对象池
        this.enemyBulletPool = [];  // 敌人子弹对象池
        this.bulletPoolSize = 150; // 对象池初始大小 (玩家+敌人)

        // --- Enemy Pooling ---
        // this.enemies = []; // 使用对象池替代
        this.activeEnemies = []; // 活动敌人列表
        this.enemyPools = { // 按类型存储敌人对象池
            basic: [],
            sinewave: [],
            tracking: [],
            scatter: []
        };
        this.enemyPoolInitialSize = 20; // 每种类型敌人的初始池大小

        // --- PowerUp Pooling ---
        this.activePowerUps = []; // 活动道具列表
        this.powerUpPool = [];    // 道具对象池
        this.powerUpPoolSize = 30; // 对象池初始大小

        this.score = 0;
        this.lastTime = 0;
        this.frameCount = 0;
        this.gameSpeed = 1;

        this.enemySpawnInterval = 1.5; // 稍微加快生成速度
        this.enemySpawnTimer = this.enemySpawnInterval;
        this.isSpawningEnemies = false;

        this.boss = null; // Boss 暂时不池化
        this.bossTriggerScore = 200;
        this.bossActive = false;
        this.bossDefeated = false;

        this.ui = new UI(this);
        console.log('UI initialized in Game constructor:', this.ui);

        this.setupInputHandlers();
        this.gameLoop = this.gameLoop.bind(this);
    }

    init() {
        console.log('Resetting game state for playing...');
        this.score = 0;
        // this.enemies = []; // 清空旧数组
        this.activeEnemies = []; // 清空活动敌人
        this.activeBullets = [];
        this.activePowerUps = []; // 清空活动道具

        // --- 清空并重新创建对象池 ---
        this.createBulletPool(this.bulletPoolSize);
        this.createEnemyPools(this.enemyPoolInitialSize); // 创建敌人池
        this.createPowerUpPool(this.powerUpPoolSize);   // 创建道具池

        this.boss = null; // 重置 Boss
        this.bossActive = false;
        this.bossDefeated = false;
        this.isSpawningEnemies = true;
        this.enemySpawnTimer = this.enemySpawnInterval;

        this.player = new Player(this);
        console.log('New player instance created:', this.player);
    }

    setupInputHandlers() {
        document.addEventListener('keydown', (event) => {
            if (this.gameState === 'startScreen') {
                if (event.key === 'Enter') {
                    console.log('Enter pressed on start screen, starting game...');
                    this.startGamePlay();
                }
            } else if (this.gameState === 'gameOver') {
                if (event.key === 'r' || event.key === 'R') {
                    console.log('R pressed on game over screen, restarting game...');
                    this.startGamePlay();
                }
            }
        });
        console.log('Centralized keydown listener for game state changes set up.');
    }

    start() {
        if (!this.ui) {
            console.error("UI not initialized before starting game loop!");
            return;
        }
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
        console.log('Game loop started. Initial state:', this.gameState);
    }

    startGamePlay() {
        this.init();
        this.gameState = 'playing';
        console.log('Game state set to playing.');
    }

    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        this.frameCount++;
        this.update(deltaTime * this.gameSpeed);
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }

    update(deltaTime) {
        if (this.gameState === 'playing') {
            if (!this.player) return;

            this.player.update(deltaTime);
            if (this.player.lives <= 0 && this.gameState === 'playing') {
                this.gameState = 'gameOver';
                console.log('Player ran out of lives. Game state set to gameOver.');
                return;
            }

            // 更新子弹 (使用对象池)
            for (let i = this.activeBullets.length - 1; i >= 0; i--) {
                const bullet = this.activeBullets[i];
                bullet.update(deltaTime);
                if (bullet.markedForDeletion || bullet.isOffscreen(this.height)) {
                    this.activeBullets.splice(i, 1);
                    this.releaseBullet(bullet);
                }
            }

            // Boss 战逻辑
            if (!this.bossActive && !this.bossDefeated && this.score >= this.bossTriggerScore) {
                this.activateBoss();
            }

            // 更新 Boss (Boss 暂时不池化)
            if (this.boss) {
                this.boss.update(deltaTime);
                if (this.boss.markedForDeletion) {
                    // Boss 被击败后的处理
                    this.boss = null;
                    this.bossActive = false;
                    this.isSpawningEnemies = true;
                    this.enemySpawnTimer = this.enemySpawnInterval;
                    console.log("Boss defeated! Resuming normal enemy spawns.");
                    this.bossDefeated = true;
                    if (this.ui && typeof this.ui.showMessage === 'function') {
                        this.ui.showMessage('关卡 1 完成!', 3);
                    }
                }
            }

            // 更新普通敌人 (使用对象池)
            if (this.isSpawningEnemies && !this.bossActive) {
                this.enemySpawnTimer -= deltaTime;
                if (this.enemySpawnTimer <= 0) {
                    this.spawnEnemy();
                    this.enemySpawnTimer = this.enemySpawnInterval;
                }
            }
            // 反向遍历 activeEnemies 以便安全移除
            for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
                const enemy = this.activeEnemies[i];
                enemy.update(deltaTime);
                if (enemy.markedForDeletion) {
                    this.activeEnemies.splice(i, 1); // 从活动列表移除
                    this.releaseEnemy(enemy);        // 归还到对象池
                }
            }

            // 更新道具 (使用对象池)
            for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
                const powerUp = this.activePowerUps[i];
                powerUp.update(deltaTime);
                if (powerUp.markedForDeletion) {
                    this.releasePowerUp(powerUp); // releasePowerUp 会处理从 activePowerUps 移除
                }
            }

            // 碰撞检测
            this.checkCollisions();

        } else if (this.gameState === 'startScreen') {
            // ...
        } else if (this.gameState === 'gameOver') {
            // ...
        }
    }

    // --- Enemy Pooling Methods ---
    createEnemyPools(sizePerType) {
        console.log(`Creating enemy pools with size per type: ${sizePerType}`);
        // 清空现有池
        for (const type in this.enemyPools) {
            this.enemyPools[type] = [];
        }

        // 填充基础敌人池
        const basicImg = this.assets['assets/images/enemy_basic.png'];
        const basicW = basicImg ? basicImg.width : 50;
        const basicH = basicImg ? basicImg.height : 50;
        for (let i = 0; i < sizePerType; i++) {
            this.enemyPools.basic.push(new Enemy(this, 0, 0, basicW, basicH, 0, 0, null)); // 初始属性不重要
        }

        // 填充 SineWave 敌人池
        // const sinewaveImg = this.assets['assets/images/enemy_sinewave.png'];
        // const sinewaveW = sinewaveImg ? sinewaveImg.width : 50;
        // const sinewaveH = sinewaveImg ? sinewaveImg.height : 50;
        for (let i = 0; i < sizePerType; i++) {
            // SineWaveEnemy构造函数现在不需要宽高，它会从asset获取
            this.enemyPools.sinewave.push(new SineWaveEnemy(this, 0, 0));
        }

         // 填充 Tracking 敌人池
        // const trackingImg = this.assets['assets/images/enemy_tracking.png'];
        // const trackingW = trackingImg ? trackingImg.width : 50;
        // const trackingH = trackingImg ? trackingImg.height : 50;
        for (let i = 0; i < sizePerType; i++) {
             // TrackingEnemy构造函数现在不需要宽高
            this.enemyPools.tracking.push(new TrackingEnemy(this, 0, 0));
        }

         // 填充 Scatter 敌人池
        // const scatterImg = this.assets['assets/images/enemy_scatter.png'];
        // const scatterW = scatterImg ? scatterImg.width : 50;
        // const scatterH = scatterImg ? scatterImg.height : 50;
        for (let i = 0; i < sizePerType; i++) {
            // ScatterShotEnemy构造函数现在不需要宽高
            this.enemyPools.scatter.push(new ScatterShotEnemy(this, 0, 0));
        }

        console.log("Enemy pools created:", Object.keys(this.enemyPools).map(k => `${k}: ${this.enemyPools[k].length}`).join(', '));
    }

    getEnemy(type, x, y) {
        const pool = this.enemyPools[type];
        if (!pool) {
            console.error(`Enemy pool type "${type}" does not exist!`);
            return null; // 或者抛出错误
        }

        let enemy = null;
        if (pool.length > 0) {
            enemy = pool.pop();
            // console.log(`Got enemy type ${type} from pool. Pool size: ${pool.length}`);
        } else {
            // 池子空了，动态创建新的 (后备)
            console.warn(`${type} enemy pool empty, creating new enemy.`);
            // 使用对应的构造函数创建
            switch (type) {
                case 'basic': {
                    const img = this.assets['assets/images/enemy_basic.png'];
                    const w = img ? img.width : 50;
                    const h = img ? img.height : 50;
                    enemy = new Enemy(this, x, y, w, h, 100, 1, img); break;
                }
                case 'sinewave':
                    enemy = new SineWaveEnemy(this, x, y); break;
                case 'tracking':
                    enemy = new TrackingEnemy(this, x, y); break;
                case 'scatter':
                    enemy = new ScatterShotEnemy(this, x, y); break;
                default:
                    console.error(`Cannot create new enemy of unknown type: ${type}`);
                    return null;
            }
        }

        if (enemy) {
             // 使用 reset 方法重置敌人状态
             const img = this.assets[`assets/images/enemy_${type}.png`];
             const w = img ? img.width : 50;
             const h = img ? img.height : 50;
             // 根据类型调用不同的 reset (假设 reset 方法参数已对应好)
             // 注意：传递给reset的参数应与构造函数或默认值对应
             switch (type) {
                case 'basic':
                    enemy.reset(x, y, 100, 1, img, w, h, 2.5); // Enemy reset
                    break;
                case 'sinewave':
                    // SineWaveEnemy reset 需要 x, y, speed, health, image, width, height, shootCooldown, amplitude, frequency
                    enemy.reset(x, y, 80, 2, img, w, h, 1.8, undefined, undefined); // 使用默认 amplitude/frequency
                    break;
                case 'tracking':
                     // TrackingEnemy reset 需要 x, y, speed, health, image, width, height, shootCooldown, trackingThresholdY, maxHorizontalSpeed, accelerationX
                    enemy.reset(x, y, 70, 2, img, w, h, 2.0, undefined, undefined, undefined); // 使用默认 tracking 参数
                    break;
                case 'scatter':
                     // ScatterShotEnemy reset 需要 x, y, speed, health, image, width, height, shootCooldown, scatterAngle, bulletBaseSpeed
                    enemy.reset(x, y, 120, 1, img, w, h, 2.2, undefined, undefined); // 使用默认 scatter 参数
                    break;
             }
            this.activeEnemies.push(enemy); // 加入活动列表
        }
        return enemy; // 返回敌人实例，尽管已加入列表
    }

    releaseEnemy(enemy) {
        if (!enemy || !enemy.constructor) return; // 基本检查

        let type = '';
        // 根据构造函数确定类型 (或者可以在敌人对象上添加一个 type 属性)
        if (enemy instanceof SineWaveEnemy) type = 'sinewave';
        else if (enemy instanceof TrackingEnemy) type = 'tracking';
        else if (enemy instanceof ScatterShotEnemy) type = 'scatter';
        else if (enemy instanceof Enemy) type = 'basic'; // 基类 Enemy 放最后检查

        const pool = this.enemyPools[type];
        if (pool) {
            pool.push(enemy);
            // console.log(`Released enemy type ${type}. Pool size: ${pool.length}`);
        } else {
            console.warn(`Could not find pool for enemy type "${type}" to release.`);
        }
    }

    // 修改 spawnEnemy 使用对象池
    spawnEnemy() {
        const x = getRandomInt(0, this.width - 50); // 假设最大宽度50
        const y = -50; // 从屏幕外生成
        let type = 'basic'; // 默认类型
        const enemyTypeRoll = Math.random();

        if (enemyTypeRoll < 0.4) {
            type = 'basic';
        } else if (enemyTypeRoll < 0.7) {
            type = 'sinewave';
        } else if (enemyTypeRoll < 0.9) {
            type = 'scatter';
        } else {
            type = 'tracking';
        }

        const newEnemy = this.getEnemy(type, x, y); // 从池中获取;
if (!newEnemy) {
                console.error(`Failed to get enemy of type: ${type}. Enemy instance is null or undefined.`);
                return; // 如果无法获取敌人，则提前返回，避免后续错误
            }
            // console.log(`Spawned ${type} enemy using pool. Total active: ${this.activeEnemies.length}`);
    }
// --- PowerUp Pooling Methods ---
    createPowerUpPool(size) {
        console.log(`Creating power-up pool with size: ${size}`);
        this.powerUpPool = [];
        for (let i = 0; i < size; i++) {
            // 初始类型和位置不重要，getPowerUp时会reset
            this.powerUpPool.push(new PowerUp(this, 0, 0, 'weapon_upgrade'));
        }
    }

    getPowerUp(x, y, type) {
        let powerUp;
        if (this.powerUpPool.length > 0) {
            powerUp = this.powerUpPool.pop();
        } else {
            // 池为空，创建新的，虽然理想情况下池应该足够大
            powerUp = new PowerUp(this, x, y, type);
            console.warn('PowerUp pool empty, created new instance.');
        }
        powerUp.reset(x, y, type);
        this.activePowerUps.push(powerUp);
        // console.log(`Got power-up type ${type}. Pool size: ${this.powerUpPool.length}, Active: ${this.activePowerUps.length}`);
        return powerUp;
    }

    releasePowerUp(powerUp) {
        const index = this.activePowerUps.indexOf(powerUp);
        if (index > -1) {
            this.activePowerUps.splice(index, 1); // 从活动列表移除
        }
        this.powerUpPool.push(powerUp);
        // console.log(`Released power-up type ${powerUp.type}. Pool size: ${this.powerUpPool.length}, Active: ${this.activePowerUps.length}`);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.gameState === 'playing') {
            if (this.player) this.player.draw(this.ctx);
            // 绘制活动敌人
            this.activeEnemies.forEach(enemy => enemy.draw(this.ctx));
            if (this.boss) this.boss.draw(this.ctx);
            this.activeBullets.forEach(bullet => bullet.draw(this.ctx));
            this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
            if (this.ui) this.ui.draw(this.ctx);
            else console.error("UI object is missing in draw!");
        } else if (this.gameState === 'startScreen') {
             if (this.ui) this.ui.draw(this.ctx);
        } else if (this.gameState === 'gameOver') {
             if (this.ui) this.ui.draw(this.ctx);
        }
    }

    // --- Bullet Pooling Methods (Keep them) ---
    createBulletPool(size) {
        console.log(`Creating bullet pool with size: ${size}`);
        this.playerBulletPool = [];
        this.enemyBulletPool = [];
        for (let i = 0; i < size; i++) {
            const bullet = new Bullet(this, 0, 0, 0, 'inactive');
            if (i < size * 0.4) {
               this.playerBulletPool.push(bullet);
            } else {
               this.enemyBulletPool.push(bullet);
            }
        }
         console.log(`Bullet pool created. Player: ${this.playerBulletPool.length}, Enemy: ${this.enemyBulletPool.length}`);
    }
    getBullet(x, y, ySpeed, type, xSpeed = 0) {
        let pool = (type === 'player') ? this.playerBulletPool : this.enemyBulletPool;
        let bullet;
        if (pool.length > 0) {
            bullet = pool.pop();
            bullet.reset(x, y, ySpeed, type, xSpeed);
        } else {
            console.warn(`${type} bullet pool empty, creating new bullet.`);
            bullet = new Bullet(this, x, y, ySpeed, type, xSpeed);
        }
        this.activeBullets.push(bullet);
        return bullet;
    }
    releaseBullet(bullet) {
        if (!bullet) return;
        let pool = (bullet.type === 'player') ? this.playerBulletPool : this.enemyBulletPool;
        pool.push(bullet);
    }

    increaseScore(amount) {
        this.score += amount;
         // 触发 Boss 的逻辑移到 update 中，在分数增加后检查更合适
    }

    activateBoss() {
        if (!this.bossActive && this.assets) {
            console.log("Activating Boss!");
            this.isSpawningEnemies = false;
            // 清空活动敌人并归还到池中
            for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
                 this.releaseEnemy(this.activeEnemies[i]);
            }
            this.activeEnemies = []; // 确保清空
            console.log(`Cleared active enemies for Boss fight. Pools:`, Object.keys(this.enemyPools).map(k => `${k}: ${this.enemyPools[k].length}`).join(', '));

            const bossImage = this.assets['assets/images/boss_phase1.png'];
            // Boss 暂时不池化，直接创建
            this.boss = new Boss(this, bossImage); // Boss 构造只需要 game 参数
            this.bossActive = true;
        } else if (!this.assets) {
            console.error("Cannot activate boss: Assets not loaded!");
        }
    }

    checkCollisions() {
        const checkCollision = (rect1, rect2) => {
             if (!rect1 || !rect2 || typeof rect1.x === 'undefined' || typeof rect1.y === 'undefined' || typeof rect1.width === 'undefined' || typeof rect1.height === 'undefined' || typeof rect2.x === 'undefined' || typeof rect2.y === 'undefined' || typeof rect2.width === 'undefined' || typeof rect2.height === 'undefined') {
                return false;
            }
            return (
                rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.y + rect1.height > rect2.y
            );
        };

        // 玩家子弹 vs 敌人 (使用 activeEnemies)
        this.activeBullets.forEach(bullet => {
            if (bullet.type === 'player') {
                this.activeEnemies.forEach(enemy => { // 修改这里
                    // 确保 enemy 有 scoreValue 属性，或者提供默认值
                    const enemyScoreValue = enemy.scoreValue !== undefined ? enemy.scoreValue : 10;
                    if (!bullet.markedForDeletion && !enemy.markedForDeletion && checkCollision(bullet, enemy)) {
                        bullet.markedForDeletion = true; // 子弹标记回收
                        enemy.hit(1); // 敌人受伤
                        if (enemy.markedForDeletion) { // 敌人被击毁
                            this.increaseScore(enemyScoreValue);
                            // 掉落道具逻辑已在 enemy.hit 中处理
                        }
                    }
                });
                // 玩家子弹 vs Boss
                if (this.boss && !bullet.markedForDeletion && !this.boss.markedForDeletion && checkCollision(bullet, this.boss)) {
                    bullet.markedForDeletion = true;
                    this.boss.hit(1);
                     // 确保 boss 有 scoreValue 属性
                    const bossScoreValue = this.boss.scoreValue !== undefined ? this.boss.scoreValue : 500;
                    if (this.boss.markedForDeletion) {
                        this.increaseScore(bossScoreValue);
                    }
                }
            }
        });

        // 敌人子弹 vs 玩家
        this.activeBullets.forEach(bullet => {
            if (bullet.type === 'enemy' && !bullet.markedForDeletion && this.player && !this.player.invincible && !this.player.markedForDeletion) {
                if (checkCollision(bullet, this.player)) {
                    bullet.markedForDeletion = true;
                    this.player.hit();
                    if (this.player.lives <= 0 && this.gameState === 'playing') {
                       this.gameState = 'gameOver';
                       console.log('Player hit by enemy bullet and ran out of lives. Game over.');
                    }
                }
            }
        });

        // 玩家 vs 敌人 (直接碰撞, 使用 activeEnemies)
        if (this.player && !this.player.invincible && !this.player.markedForDeletion) {
            this.activeEnemies.forEach((enemy) => { // 修改这里
                 // 确保 enemy 有 scoreValue 属性
                 const enemyScoreValue = enemy.scoreValue !== undefined ? enemy.scoreValue : 10;
                if (!enemy.markedForDeletion && checkCollision(this.player, enemy)) {
                    enemy.hit(10); // 敌人受撞击伤害
                    this.player.hit(); // 玩家受撞击伤害
                    if (enemy.markedForDeletion) {
                        this.increaseScore(enemyScoreValue);
                         // 掉落道具逻辑已在 enemy.hit 中处理
                    }
                     if (this.player.lives <= 0 && this.gameState === 'playing') {
                       this.gameState = 'gameOver';
                       console.log('Player collided with enemy and ran out of lives. Game over.');
                    }
                }
            });

             // 玩家 vs Boss (碰撞)
             if (this.boss && !this.boss.markedForDeletion && checkCollision(this.player, this.boss)) {
                 this.player.hit(2);
                 if (this.player.lives <= 0 && this.gameState === 'playing') {
                    this.gameState = 'gameOver';
                    console.log('Player collided with boss and ran out of lives. Game over.');
                 }
             }
        }

        // 玩家 vs 道具
        if (this.player && !this.player.markedForDeletion) {
            this.powerUps.forEach((powerUp) => {
                if (!powerUp.markedForDeletion && checkCollision(this.player, powerUp)) {
                    powerUp.applyEffect(this.player);
                    powerUp.markedForDeletion = true;
                }
            });
        }
    }

    activateBombEffect() {
         if (this.gameState !== 'playing') return;
        console.log("Activating Bomb!");

        // 清除屏幕上的所有敌人子弹 (使用对象池)
        let enemyBulletsCleared = 0;
        for (let i = this.activeBullets.length - 1; i >= 0; i--) {
            const bullet = this.activeBullets[i];
            if (bullet.type === 'enemy') {
                this.activeBullets.splice(i, 1);
                this.releaseBullet(bullet);
                enemyBulletsCleared++;
            }
        }
        console.log(`Bomb cleared ${enemyBulletsCleared} enemy bullets.`);

        // 对屏幕上的所有敌人造成大量伤害 (使用 activeEnemies)
        const bombDamage = 100;
        let enemiesHit = 0;
        this.activeEnemies.forEach(enemy => { // 修改这里
             // 确保 enemy 有 scoreValue 属性
             const enemyScoreValue = enemy.scoreValue !== undefined ? enemy.scoreValue : 10;
             if (!enemy.markedForDeletion) {
                enemy.hit(bombDamage);
                enemiesHit++;
                if (enemy.markedForDeletion) {
                    this.increaseScore(enemyScoreValue);
                     // 掉落道具逻辑已在 enemy.hit 中处理
                }
            }
        });
         console.log(`Bomb hit ${enemiesHit} regular enemies.`);

        // 对 Boss 造成伤害
        if (this.boss && !this.boss.markedForDeletion) {
             // 确保 boss 有 scoreValue 属性
            const bossScoreValue = this.boss.scoreValue !== undefined ? this.boss.scoreValue : 500;
            this.boss.hit(bombDamage * 0.5);
             if (this.boss.markedForDeletion) {
                this.increaseScore(bossScoreValue);
            }
            console.log(`Bomb hit Boss for ${bombDamage * 0.5} damage.`);
        }

        // 添加视觉效果
        if(this.ui && typeof this.ui.showBombFlash === 'function') {
            this.ui.showBombFlash();
        } else if (this.ui && typeof this.ui.triggerScreenFlash === 'function') {
             this.ui.triggerScreenFlash();
        }
    }
}