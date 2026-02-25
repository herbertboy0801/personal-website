class Enemy {
    // 添加 image 参数，移除 color 参数
    constructor(game, x, y, width = 50, height = 50, speed = 100, health = 1, image = null) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed; // 像素/秒，向下为正
        this.image = image; // 存储图片对象
        this.health = health;
        this.markedForDeletion = false; // 标记是否待删除

        // 射击相关
        this.shootCooldown = 2.5; // 每2.5秒尝试射击一次 (可以给不同敌人设置不同值)
        this.shootTimer = Math.random() * this.shootCooldown; // 初始射击时间随机，避免所有敌人同时射击
    }

    update(deltaTime) {
        // 敌人向下移动
        this.y += this.speed * deltaTime;

        // 如果敌人移出屏幕底部，则标记为待删除
        if (this.y > this.game.height && !this.markedForDeletion) { // 检查是否已经标记，避免重复日志
            this.markedForDeletion = true;
            // console.log('Enemy offscreen and marked for deletion');
        }

        // 敌人射击逻辑
        this.shootTimer -= deltaTime;
        if (this.shootTimer <= 0 && !this.markedForDeletion && this.y > 0 && this.y < this.game.height * 0.75) { // 只在屏幕内一定区域射击
            this.shoot();
            this.shootTimer = this.shootCooldown;
        }
    }

    shoot() {
        // 使用对象池获取子弹
        if (this.game && typeof this.game.getBullet === 'function') {
            const bulletX = this.x + this.width / 2 - 2.5; // 子弹中心X
            const bulletY = this.y + this.height; // 子弹从敌人下方发射
            const bulletSpeed = 200; // 敌人子弹速度 (向下为正)
            // 直接调用 getBullet，它会处理获取和添加到 activeBullets
            this.game.getBullet(bulletX, bulletY, bulletSpeed, 'enemy');
            // console.log('Enemy shot using object pool from x:', this.x);
        } else {
            console.warn("Game object or getBullet method not available for enemy shooting.");
        }
    }

    draw(ctx) {
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // 如果图片不存在，绘制备用方块
            ctx.fillStyle = 'red'; // 用红色表示错误或缺失
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        // 移除绘制眼睛的代码，由图片本身提供细节
    }

    // 被击中时的逻辑
    hit(damage = 1) {
        this.health -= damage;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            console.log('Enemy destroyed at x:', this.x, 'y:', this.y);

            // 掉落道具逻辑
            const dropChance = 0.3; // 30% 几率掉落道具
            if (Math.random() < dropChance) {
                const powerUpTypes = ['weapon_upgrade', 'shield', 'bomb'];
                const randomTypeIndex = Math.floor(Math.random() * powerUpTypes.length);
                const type = powerUpTypes[randomTypeIndex];
                // 使用对象池获取道具
                this.game.getPowerUp(this.x + this.width / 2 - 15, this.y + this.height / 2 - 15, type);
                console.log(`Enemy dropped a ${type} power-up (using pool).`);
            }
            // this.game.increaseScore(10); // 分数增加已在Game.checkCollisions中处理
        }
    }

    // 用于对象池的重置方法
    reset(x, y, speed, health, image, width, height, shootCooldown) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.health = health; // 重置为满血
        this.image = image;
        this.width = width;
        this.height = height;
        this.markedForDeletion = false;
        this.shootCooldown = shootCooldown || 2.5; // 使用传入值或默认值
        this.shootTimer = Math.random() * this.shootCooldown; // 随机化初始射击计时器
        // console.log(`Base Enemy reset: x=${this.x}, y=${this.y}, health=${this.health}`);
    }
}

class SineWaveEnemy extends Enemy {
    constructor(game, x, y) {
        // 获取 SineWaveEnemy 的图片
        const image = game.assets['assets/images/enemy_sinewave.png'];
        const width = image ? image.width : 50; // 使用图片宽度或默认值
        const height = image ? image.height : 50; // 使用图片高度或默认值
        // 调用父类构造函数，传递图片，调整宽高，移除颜色
        super(game, x, y, width, height, 80, 2, image); // 宽,高,速,血量,图片
        this.amplitude = Math.random() * 40 + 20; // 正弦波振幅
        this.frequency = Math.random() * 0.02 + 0.01; // 正弦波频率
        this.angle = 0; // 正弦波角度
        this.originalX = x; // 保存初始x位置用于计算正弦波位移

        this.shootCooldown = 1.8; // 更快的射击频率
        this.shootTimer = Math.random() * this.shootCooldown;
    }

    update(deltaTime) {
        // 调用父类的update来处理向下移动和基本射击逻辑
        // super.update(deltaTime); // 如果父类update包含了射击，这里要小心重复调用或覆盖

        // 先处理父类的向下移动和边界检测
        this.y += this.speed * deltaTime;
        if (this.y > this.game.height && !this.markedForDeletion) {
            this.markedForDeletion = true;
        }

        // 正弦波水平移动
        this.angle += this.frequency * this.game.gameSpeed * 60 * deltaTime; // 乘以60是为了让频率值更直观些
        this.x = this.originalX + Math.sin(this.angle) * this.amplitude;

        // 确保不超出左右边界
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;


        // 敌人射击逻辑 (可以从父类继承或重写)
        this.shootTimer -= deltaTime;
        if (this.shootTimer <= 0 && !this.markedForDeletion && this.y > 0 && this.y < this.game.height * 0.85) {
            this.shoot(); // 使用自己的或父类的shoot方法
            this.shootTimer = this.shootCooldown;
        }
    }

    // shoot 方法可以继承父类的，如果需要不同射击行为则重写
    // shoot() {
    //     super.shoot(); // 调用父类射击
    //     // 或者实现完全不同的射击，例如发射三向子弹等
    // }

    // 用于对象池的重置方法
    reset(x, y, speed, health, image, width, height, shootCooldown, amplitude, frequency) {
        // 调用父类的 reset 方法来重置通用属性
        super.reset(x, y, speed, health, image, width, height, shootCooldown);

        // 重置 SineWaveEnemy 特有的属性
        this.amplitude = amplitude || (Math.random() * 40 + 20); // 使用传入值或重新随机生成
        this.frequency = frequency || (Math.random() * 0.02 + 0.01); // 使用传入值或重新随机生成
        this.angle = 0; // 重置角度
        this.originalX = x; // 更新初始X位置
        // console.log(`SineWaveEnemy reset: x=${this.x}, y=${this.y}, amplitude=${this.amplitude}`);
    }
}

// 之后可以创建更多 Enemy 的子类，实现不同行为的敌人
// class EnemyTypeA extends Enemy { ... }
// class EnemyTypeB extends Enemy { ... }
class TrackingEnemy extends Enemy {
    constructor(game, x, y) {
        // 获取 TrackingEnemy 的图片
        const image = game.assets['assets/images/enemy_tracking.png'];
        const width = image ? image.width : 50;
        const height = image ? image.height : 50;
        // 调用父类构造函数，传递图片，调整宽高，移除颜色
        super(game, x, y, width, height, 70, 2, image);
        this.trackingThresholdY = game.height * 0.3; // Y坐标达到屏幕30%时开始追踪
        this.isTracking = false;
        this.horizontalSpeed = 0; // 当前水平速度
        this.maxHorizontalSpeed = 150; // 最大水平追踪速度
        this.accelerationX = 500; // 水平加速度

        this.shootCooldown = 2.0; // 射击间隔
        this.shootTimer = Math.random() * this.shootCooldown;
    }

    update(deltaTime) {
        // 向下移动
        this.y += this.speed * deltaTime;

        // 检查是否移出屏幕
        if (this.y > this.game.height && !this.markedForDeletion) {
            this.markedForDeletion = true;
        }

        // 追踪逻辑
        if (!this.isTracking && this.y >= this.trackingThresholdY) {
            this.isTracking = true;
            console.log(`TrackingEnemy at x:${this.x} started tracking.`);
        }

        if (this.isTracking && this.game.player && !this.markedForDeletion) {
            const playerCenterX = this.game.player.x + this.game.player.width / 2;
            const enemyCenterX = this.x + this.width / 2;
            const targetDirectionX = Math.sign(playerCenterX - enemyCenterX); // 1 或 -1

            // 根据目标方向调整水平速度
            if (targetDirectionX > 0) { // 玩家在右边
                this.horizontalSpeed += this.accelerationX * deltaTime;
            } else if (targetDirectionX < 0) { // 玩家在左边
                this.horizontalSpeed -= this.accelerationX * deltaTime;
            }
            // 限制最大速度
            this.horizontalSpeed = Math.max(-this.maxHorizontalSpeed, Math.min(this.maxHorizontalSpeed, this.horizontalSpeed));

            this.x += this.horizontalSpeed * deltaTime;

            // 边界限制
            if (this.x < 0) {
                 this.x = 0;
                 this.horizontalSpeed = Math.max(0, this.horizontalSpeed); // 撞左墙速度不能为负
            }
            if (this.x + this.width > this.game.width) {
                 this.x = this.game.width - this.width;
                 this.horizontalSpeed = Math.min(0, this.horizontalSpeed); // 撞右墙速度不能为正
            }
        }

        // 射击逻辑 (继承或重写)
        this.shootTimer -= deltaTime;
        if (this.shootTimer <= 0 && !this.markedForDeletion && this.y > 0 && this.y < this.game.height * 0.8) {
            this.shoot();
            this.shootTimer = this.shootCooldown;
        }
    }

    // 射击方法 (可以定制，例如发射更快的子弹)
    shoot() {
         if (this.game && this.game.addBullet) {
            const bulletX = this.x + this.width / 2 - 2.5;
            const bulletY = this.y + this.height;
            const bulletSpeed = 250; // 更快的子弹速度
            this.game.addBullet(new Bullet(this.game, bulletX, bulletY, bulletSpeed, 'enemy'));
        }
    }

     // 用于对象池的重置方法
    reset(x, y, speed, health, image, width, height, shootCooldown, trackingThresholdY, maxHorizontalSpeed, accelerationX) {
        // 调用父类的 reset 方法
        super.reset(x, y, speed, health, image, width, height, shootCooldown);

        // 重置 TrackingEnemy 特有的属性
        this.trackingThresholdY = trackingThresholdY || this.game.height * 0.3; // 使用传入值或默认值
        this.isTracking = false; // 重置追踪状态
        this.horizontalSpeed = 0; // 重置水平速度
        this.maxHorizontalSpeed = maxHorizontalSpeed || 150; // 使用传入值或默认值
        this.accelerationX = accelerationX || 500; // 使用传入值或默认值
        // console.log(`TrackingEnemy reset: x=${this.x}, y=${this.y}, isTracking=${this.isTracking}`);
    }
}
class ScatterShotEnemy extends Enemy {
    constructor(game, x, y) {
        // 获取 ScatterShotEnemy 的图片
        const image = game.assets['assets/images/enemy_scatter.png'];
        const width = image ? image.width : 50;
        const height = image ? image.height : 50;
         // 调用父类构造函数，传递图片，调整宽高，移除颜色
        super(game, x, y, width, height, 120, 1, image);
        this.shootCooldown = 2.2; // 射击间隔
        this.shootTimer = Math.random() * this.shootCooldown;
        this.scatterAngle = Math.PI / 9; // 散射角度 (20度)
        this.bulletBaseSpeed = 180; // 子弹基础速度
    }

    // update 方法可以继承父类的，只负责直线向下移动

    shoot() {
        // 使用对象池获取子弹
        if (this.game && typeof this.game.getBullet === 'function') {
            const centerX = this.x + this.width / 2 - 2.5; // 子弹中心X
            const startY = this.y + this.height; // 子弹从下方发射

            // 计算散射子弹的速度分量
            const straightYSpeed = this.bulletBaseSpeed;
            const diagonalYSpeed = this.bulletBaseSpeed * Math.cos(this.scatterAngle);
            const diagonalXSpeed = this.bulletBaseSpeed * Math.sin(this.scatterAngle);

            // 发射三颗子弹 (从对象池获取)
            // 1. 直线向下
            this.game.getBullet(centerX, startY, straightYSpeed, 'enemy', 0);
            // 2. 斜向左下
            this.game.getBullet(centerX, startY, diagonalYSpeed, 'enemy', -diagonalXSpeed);
            // 3. 斜向右下
            this.game.getBullet(centerX, startY, diagonalYSpeed, 'enemy', diagonalXSpeed);

            // console.log(`ScatterShotEnemy at x:${this.x} fired using object pool.`);
        }
    }

     // 用于对象池的重置方法
    reset(x, y, speed, health, image, width, height, shootCooldown, scatterAngle, bulletBaseSpeed) {
        // 调用父类的 reset 方法
        super.reset(x, y, speed, health, image, width, height, shootCooldown);

        // 重置 ScatterShotEnemy 特有的属性
        this.scatterAngle = scatterAngle || Math.PI / 9; // 使用传入值或默认值
        this.bulletBaseSpeed = bulletBaseSpeed || 180; // 使用传入值或默认值
         // console.log(`ScatterShotEnemy reset: x=${this.x}, y=${this.y}, scatterAngle=${this.scatterAngle}`);
    }
}