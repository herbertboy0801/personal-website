class Boss extends Enemy {
    constructor(game) {
        // 获取 Boss 图片资源
        const image = game.assets['assets/images/boss_phase1.png'];
        // 使用图片尺寸或默认值
        const width = image ? image.width : game.width * 0.8; // 300
        const height = image ? image.height : 100; // 169
        const x = (game.width - width) / 2; // 初始居中
        const y = -height - 50; // 从屏幕外上方缓慢进入
        const speed = 40; // 初始向下移动速度
        // const color = 'darkred'; // 移除颜色
        const health = 100; // Boss 血量很高

        // 调用父类构造函数，传递图片和尺寸，移除颜色
        super(game, x, y, width, height, speed, health, image); // 注意参数顺序调整为匹配 Enemy 构造函数

        this.maxHealth = health; // 保存最大血量
        this.phase = 1; // 初始阶段
        this.phaseTriggerHealth = this.maxHealth / 2; // 触发第二阶段的血量阈值
        // this.phase2Color = 'purple'; // 移除阶段2颜色，由图片处理（如果需要）

        this.movementPattern = 'entering'; // entering, patrolling
        this.targetY = 50; // 进入后停留的 Y 坐标
        this.patrolSpeedX = 100; // 阶段1左右巡逻速度
        this.patrolSpeedXPhase2 = 150; // 阶段2左右巡逻速度
        this.directionX = 1; // 初始向右移动

        // --- 阶段1 射击模式 (两侧连射) ---
        this.shootCooldown = 1.0; // 主射击间隔
        this.shootTimer = this.shootCooldown;
        this.burstCount = 0; // 连射计数
        this.burstMax = 5;   // 每次连射5发
        this.burstDelay = 0.1; // 连射内子弹间隔
        this.burstTimer = 0;

        // --- 阶段2 新增射击模式 (中心单发快射) ---
        this.centerShootCooldown = 0.5; // 中心射击间隔 (更快)
        this.centerShootTimer = this.centerShootCooldown;
    }

    update(deltaTime) {
        // --- Boss 移动逻辑 ---
        if (this.movementPattern === 'entering') {
            // 向下移动进入战场
            this.y += this.speed * deltaTime;
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.movementPattern = 'patrolling'; // 进入完成，开始巡逻
                console.log('Boss entered patrolling phase.');
            }
        } else if (this.movementPattern === 'patrolling') {
            // --- 阶段切换检测 ---
            if (this.phase === 1 && this.health <= this.phaseTriggerHealth) {
                this.phase = 2;
                // this.color = this.phase2Color; // 移除颜色改变
                this.patrolSpeedX = this.patrolSpeedXPhase2; // 提高速度
                // 可以在这里切换图片，如果为阶段2准备了不同图片
                // this.image = this.game.assets['assets/images/boss_phase2.png'] || this.image;
                // 调整阶段1射击参数 (可选，例如稍微减慢连射)
                // this.shootCooldown = 1.2;
                // this.burstMax = 4;
                console.log('BOSS ENTERED PHASE 2!');
            }

            // 左右移动 (根据当前阶段速度)
            this.x += this.patrolSpeedX * this.directionX * deltaTime;

            // 边界检测与反向
            if (this.x <= 0) {
                this.x = 0;
                this.directionX = 1; // 碰到左边界，向右
            } else if (this.x + this.width >= this.game.width) {
                this.x = this.game.width - this.width;
                this.directionX = -1; // 碰到右边界，向左
            }
        }

        // --- Boss 射击逻辑 ---
        if (this.movementPattern === 'patrolling') {
            // --- 两侧连射逻辑 (一直存在，但参数可能变化) ---
            this.shootTimer -= deltaTime;
            if (this.burstCount > 0 && this.burstTimer <= 0) {
                this.fireSideShots(); // 调用专门的侧边射击方法
                this.burstCount--;
                this.burstTimer = this.burstDelay;
            } else if (this.burstTimer > 0) {
                this.burstTimer -= deltaTime;
            }

            if (this.shootTimer <= 0 && this.burstCount === 0) {
                this.burstCount = this.burstMax;
                this.burstTimer = 0;
                this.shootTimer = this.shootCooldown;
            }

            // --- 阶段 2 中心射击逻辑 ---
            if (this.phase === 2) {
                this.centerShootTimer -= deltaTime;
                if (this.centerShootTimer <= 0) {
                    this.fireCenterShot(); // 调用中心射击方法
                    this.centerShootTimer = this.centerShootCooldown;
                }
            }
        }

         // 如果生命值耗尽，标记删除 (继承自Enemy)
         if (this.health <= 0 && !this.markedForDeletion) {
            this.markedForDeletion = true;
            console.log('BOSS DEFEATED!');
            // 可以在这里触发游戏胜利或下一关等逻辑
            // this.game.increaseScore(1000); // 击败Boss得大量分数
        }
    }

    // 发射两侧炮台的子弹 (使用对象池)
    fireSideShots() {
         if (this.game && typeof this.game.getBullet === 'function') {
            const bulletSpeed = 250; // 侧边子弹速度
            // 左炮台
            const bulletX1 = this.x + this.width * 0.2;
            const bulletY1 = this.y + this.height;
            this.game.getBullet(bulletX1, bulletY1, bulletSpeed, 'enemy'); // 使用 getBullet
            // 右炮台
            const bulletX2 = this.x + this.width * 0.8;
            const bulletY2 = this.y + this.height;
            this.game.getBullet(bulletX2, bulletY2, bulletSpeed, 'enemy'); // 使用 getBullet
        } else {
             console.warn("Game object or getBullet method not available for boss side shots.");
        }
    }

    // 发射中心炮台的子弹 (阶段2, 使用对象池)
    fireCenterShot() {
        if (this.game && typeof this.game.getBullet === 'function') {
            const bulletSpeed = 350; // 中心子弹更快
            const bulletX = this.x + this.width / 2 - 2.5; // 中心位置
            const bulletY = this.y + this.height * 0.8; // 稍微靠上一点发射
            this.game.getBullet(bulletX, bulletY, bulletSpeed, 'enemy'); // 使用 getBullet
        } else {
             console.warn("Game object or getBullet method not available for boss center shot.");
        }
    }

    // Boss 被击中时的特殊处理（例如，可能有护甲或弱点）
    // hit(damage = 1) {
    //     super.hit(damage); // 调用父类处理减血和标记删除
    //     // 可以在这里添加 Boss 特有的被击中效果，比如改变颜色、短暂无敌等
    // }

    draw(ctx) {
        if (this.image) {
            // 绘制 Boss 图片
            // (如果需要根据阶段切换图片，在此处添加逻辑)
            // let imageToDraw = this.image;
            // if (this.phase === 2 && this.game.assets['assets/images/boss_phase2.png']) {
            //     imageToDraw = this.game.assets['assets/images/boss_phase2.png'];
            // }
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // 图片缺失时的备用绘制
            ctx.fillStyle = 'purple'; // 用紫色表示错误
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        // 移除绘制细节的代码，由图片提供
    }

     // 用于对象池的重置方法 (如果将来 Boss 也需要池化)
    reset(x, y, speed, health, image, width, height) {
        // 调用父类的 reset 方法来重置通用属性
        // 注意: Boss 的射击冷却等参数可能与普通敌人不同，需要传递或在此处设置
        super.reset(x, y, speed, health, image, width, height, this.shootCooldown); // 使用 Boss 自己的 shootCooldown

        // 重置 Boss 特有的属性
        this.maxHealth = health;
        this.phase = 1;
        this.phaseTriggerHealth = this.maxHealth / 2;
        this.movementPattern = 'entering'; // 总是从 'entering' 开始
        this.targetY = 50; // 重置目标 Y
        this.patrolSpeedX = 100; // 重置为阶段1速度
        this.directionX = 1; // 重置方向
        this.burstCount = 0;
        this.burstTimer = 0;
        this.shootTimer = this.shootCooldown; // 重置主射击计时器
        this.centerShootTimer = this.centerShootCooldown; // 重置中心射击计时器
         // console.log(`Boss reset: x=${this.x}, y=${this.y}, health=${this.health}, phase=${this.phase}`);
    }
}