class Player {
    constructor(game) {
        this.game = game; // 引用Game实例
        // 尝试获取玩家图片资源
        this.image = this.game.assets['assets/images/player.png'];

        if (this.image) {
            // 如果图片加载成功，使用图片的尺寸
            this.width = this.image.width;
            this.height = this.image.height;
            console.log(`Player using image: ${this.image.src}, size: ${this.width}x${this.height}`);
        } else {
            // 图片加载失败或未提供，回退到默认尺寸和颜色
            console.warn('Player image not found or loaded, using default square.');
            this.width = 50;
            this.height = 50;
            this.color = 'blue'; // 保留颜色作为后备
        }

        this.x = (this.game.width - this.width) / 2; // 初始位置在画布中央底部
        this.y = this.game.height - this.height - 20;
        this.speed = 250; // 像素/秒
        // this.color = 'blue'; // 不再需要固定颜色
        this.lives = 3; // 玩家初始生命值
        this.isInvincible = false; // 是否处于无敌状态
        this.invincibilityDuration = 1.5; // 无敌持续时间（秒）
        this.invincibilityTimer = 0; // 无敌计时器

        this.bullets = []; // 玩家发射的子弹
        this.shootCooldown = 0.2; // 射击冷却时间（秒）
        this.shootTimer = 0; // 射击计时器

        this.weaponLevel = 1;
        this.maxWeaponLevel = 4; // 最高武器等级 (增加激光)
        this.bombs = 1; // 初始炸弹数量
        this.maxBombs = 3; // 最大炸弹数量
        this.isFiringLaser = false; // 是否正在发射激光
        this.laserDamagePerSecond = 15; // 激光每秒伤害

        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            Space: false, // 用于射击的空格键
            KeyX: false // 用于使用炸弹 (X键)
        };

        this.setupInputHandlers();
    }

    setupInputHandlers() {
        document.addEventListener('keydown', (event) => {
            // console.log('Keydown event:', event.key); // 移除调试信息
            // 检查是否是我们要处理的按键（方向键、空格、X键）
            const relevantKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'x', 'X'];
            if (relevantKeys.includes(event.key)) {
                 if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    this.keys[event.key] = true;
                 } else if (event.key === ' ') {
                     this.keys.Space = true;
                 } else if (event.key === 'x' || event.key === 'X') {
                     this.keys.KeyX = true;
                 }
                 event.preventDefault(); // 阻止默认行为，如页面滚动
            }
        });

        document.addEventListener('keyup', (event) => {
            // console.log('Keyup event:', event.key);
            // 检查是否是我们要处理的按键
            const relevantKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'x', 'X'];
            if (relevantKeys.includes(event.key)) {
                 if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    this.keys[event.key] = false;
                 } else if (event.key === ' ') {
                     this.keys.Space = false;
                 } else if (event.key === 'x' || event.key === 'X') {
                     this.keys.KeyX = false;
                 }
            }
        });
        // console.log('Player input handlers set up.'); // 移除调试信息
    }

    update(deltaTime) {
        // 更新射击计时器 (对非激光武器有效)
        if (this.shootTimer > 0) {
            this.shootTimer -= deltaTime;
        }

        // 更新无敌计时器
        if (this.isInvincible) {
            this.invincibilityTimer -= deltaTime;
            if (this.invincibilityTimer <= 0) {
                this.isInvincible = false;
                console.log('Player invincibility ended.');
            }
        }

        // 处理移动
        let dx = 0;
        let dy = 0;
        if (this.keys.ArrowLeft) dx -= 1;
        if (this.keys.ArrowRight) dx += 1;
        if (this.keys.ArrowUp) dy -= 1;
        if (this.keys.ArrowDown) dy += 1;
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx = (dx / length);
            dy = (dy / length);
        }
        this.x += dx * this.speed * deltaTime;
        this.y += dy * this.speed * deltaTime;

        // 边界限制
         if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > this.game.height) this.y = this.game.height - this.height;


        // --- 处理射击 (根据武器等级) ---
        if (this.weaponLevel === 4) {
            // 等级4: 控制激光状态
            this.isFiringLaser = this.keys.Space; // 按住空格即发射激光
        } else {
            // 等级 1-3: 处理普通子弹射击
            this.isFiringLaser = false; // 确保非激光等级不显示激光
            if (this.keys.Space && this.shootTimer <= 0) {
                this.shoot(); // 调用 shoot 发射子弹
                this.shootTimer = this.shootCooldown; // 重置冷却
            }
        }

        // --- 激光伤害逻辑 ---
        if (this.isFiringLaser) {
            const laserX = this.x + this.width / 2 - 2; // 激光束中心 X (宽度为 4)
            const laserWidth = 4;
            const damage = this.laserDamagePerSecond * deltaTime; // 本帧造成的伤害

            // 检测与普通敌人的碰撞
            this.game.enemies.forEach(enemy => {
                if (!enemy.markedForDeletion &&
                    laserX < enemy.x + enemy.width && // 激光左侧 < 敌人右侧
                    laserX + laserWidth > enemy.x &&   // 激光右侧 > 敌人左侧
                    this.y > enemy.y // 激光从玩家向上，检查敌人是否在激光路径上 (简化为Y坐标检查)
                ) {
                    enemy.hit(damage); // 持续造成伤害
                     if (enemy.markedForDeletion) {
                        this.game.increaseScore(1); // 激光持续伤害得分较低
                    }
                }
            });

            // 检测与 Boss 的碰撞
            if (this.game.boss && !this.game.boss.markedForDeletion && this.game.bossActive) {
                 if (laserX < this.game.boss.x + this.game.boss.width &&
                     laserX + laserWidth > this.game.boss.x &&
                     this.y > this.game.boss.y)
                 {
                     this.game.boss.hit(damage); // 持续对 Boss 造成伤害
                      if (this.game.boss.markedForDeletion) {
                        this.game.increaseScore(10); // 激光击败 Boss 得分
                    }
                 }
            }
        }


        // --- 处理使用炸弹 ---
        if (this.keys.KeyX) {
            this.useBomb();
            this.keys.KeyX = false; // 避免按住连续使用，或者添加冷却
        }
    }

    draw(ctx) {
        ctx.save(); // 保存状态，特别是 globalAlpha

        // 无敌状态闪烁效果
        if (this.isInvincible) {
            // 每 0.1 秒切换一次透明度
            if (Math.floor(this.invincibilityTimer * 10) % 2 !== 0) {
                ctx.globalAlpha = 0.5; // 设置半透明
            }
        }

        // --- 绘制激光 ---
        if (this.isFiringLaser) {
            ctx.save();
            ctx.fillStyle = 'red';
            ctx.shadowColor = 'orange';
            ctx.shadowBlur = 15;
            // 激光从玩家中心顶部向上发射
            const laserX = this.x + this.width / 2 - 2; // 宽度为 4
            const laserY = 0; // 从屏幕顶部开始
            const laserHeight = this.y; // 到玩家顶部结束
            ctx.fillRect(laserX, laserY, 4, laserHeight);
            ctx.restore(); // 恢复阴影等设置
        }

        // --- 绘制玩家 ---
        if (this.image) {
            // 绘制玩家图片
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else if (this.color) {
            // 如果图片不存在，绘制备用方块
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.restore(); // 恢复 globalAlpha 等状态
    }

    shoot() {
        if (this.weaponLevel === 4) return; // 等级4不发射子弹

        // 创建子弹 (Bullet 类将在bullet.js中定义)
        // 子弹从玩家中心上方发射
        const bulletX = this.x + this.width / 2 - 2.5; // 子弹中心X
        const bulletY = this.y; // 子弹从玩家顶部发射
        const bulletSpeed = -400; // 向上

        if (this.weaponLevel === 1) {
            // 从对象池获取子弹
            this.game.getBullet(bulletX, bulletY, bulletSpeed, 'player');
        } else if (this.weaponLevel === 2) {
             // 从对象池获取子弹
            this.game.getBullet(bulletX - 8, bulletY, bulletSpeed, 'player');
            this.game.getBullet(bulletX + 8, bulletY, bulletSpeed, 'player');
        } else if (this.weaponLevel === 3) {
             // 从对象池获取子弹
            this.game.getBullet(bulletX, bulletY, bulletSpeed, 'player'); // 中间
            this.game.getBullet(bulletX - 15, bulletY + 5, bulletSpeed, 'player'); // 左边靠前一点
            this.game.getBullet(bulletX + 15, bulletY + 5, bulletSpeed, 'player'); // 右边靠前一点
        }
        // console.log('Player shot using object pool.');
    }

    hit() {
        if (!this.isInvincible) {
            this.lives--;
            console.log('Player hit! Lives remaining:', this.lives);
            this.isInvincible = true;
            this.invincibilityTimer = this.invincibilityDuration;
            // this.color = 'orange'; // 不再需要改变颜色

            if (this.lives <= 0) {
                this.game.gameOver = true; // 通知Game游戏结束
                console.log('Player has no lives left. GAME OVER.');
            }
            return true; // 表示成功击中
        }
        return false; // 无敌状态，未被击中
    }

    upgradeWeapon() {
        if (this.weaponLevel < this.maxWeaponLevel) {
            this.weaponLevel++;
            console.log('Weapon upgraded to level:', this.weaponLevel);
        } else {
            console.log('Weapon already at max level.');
            this.game.increaseScore(50); // 满级再吃P则加分
        }
    }

    activateShield() {
        // 简单地触发当前的无敌效果
        if (!this.isInvincible) {
            this.isInvincible = true;
            this.invincibilityTimer = this.invincibilityDuration; // 使用玩家当前的无敌时间
            // this.color = 'cyan'; // 不再需要改变颜色
            console.log('Shield activated! Player is invincible.');
        } else {
             // 如果已经在无敌中，可以考虑延长无敌时间或不执行操作
            this.invincibilityTimer = Math.max(this.invincibilityTimer, this.invincibilityDuration); // 取更长的无敌时间
            console.log('Shield reactivated/extended.');
        }
    }

    addBomb() {
        if (this.bombs < this.maxBombs) {
            this.bombs++;
            console.log('Bomb added. Total bombs:', this.bombs);
        } else {
            console.log('Bombs at max capacity.');
            this.game.increaseScore(30); // 满炸弹再吃B则加分
        }
    }

    useBomb() {
        if (this.bombs > 0 && !this.game.gameOver) { // 确保游戏未结束才可用炸弹
            this.bombs--;
            console.log(`Bomb used! ${this.bombs} bombs remaining.`);
            // 通知Game类激活炸弹效果 (Game类需要实现 activateBombEffect)
            if (this.game && typeof this.game.activateBombEffect === 'function') {
                this.game.activateBombEffect();
            } else {
                console.warn('Game.activateBombEffect() is not defined.');
            }
            // 可以在这里添加一个短暂的全屏闪烁或音效触发
        } else {
            // console.log('No bombs to use or game over.'); // 避免在游戏结束时打印过多日志
        }
    }
}