class Bullet {
    constructor(game, x, y, ySpeed, type = 'player', xSpeed = 0) { // 添加 xSpeed 参数
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 15;
        this.ySpeed = ySpeed; // 垂直速度
        this.xSpeed = xSpeed; // 水平速度 (新增)
        this.type = type; // 'player' 或 'enemy'
        this.markedForDeletion = false;

        this.image = null;

        if (this.type === 'player') {
            this.image = this.game.assets['assets/images/bullet_player.png'];
            this.color = 'yellow'; // 保留颜色作为后备
        } else if (this.type === 'enemy') {
            this.image = this.game.assets['assets/images/bullet_enemy.png'];
            this.color = 'red'; // 保留颜色作为后备
        } else {
            this.color = 'gray';
        }

        if (this.image) {
            this.width = this.image.width;
            this.height = this.image.height;
            // console.log(`Bullet (${this.type}) using image: ${this.image.src}, size: ${this.width}x${this.height}`);
        } else {
             console.warn(`Bullet image (${this.type}) not found or loaded, using default square.`);
             // 使用之前的默认尺寸
             if(this.type === 'enemy') this.height = 10;
        }

    }

    update(deltaTime) {
        this.y += this.ySpeed * deltaTime;
        this.x += this.xSpeed * deltaTime; // 添加水平移动
    }

    draw(ctx) {
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else if (this.color) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    isOffscreen(gameHeight) {
        // 检查子弹是否完全移出屏幕顶部或底部
        if (this.ySpeed < 0) { // 向上飞的子弹 (玩家子弹)
            return this.y + this.height < 0;
        } else { // 向下飞的子弹 (敌人子弹)
            return this.y > gameHeight;
        }
    }

    reset(x, y, ySpeed, type, xSpeed = 0) {
        this.x = x;
        this.y = y;
        this.ySpeed = ySpeed;
        this.xSpeed = xSpeed;
        this.type = type;
        this.markedForDeletion = false;

        // 根据新的类型重新设置图片和尺寸
        if (this.type === 'player') {
            this.image = this.game.assets['assets/images/bullet_player.png'];
            this.color = 'yellow';
        } else if (this.type === 'enemy') {
            this.image = this.game.assets['assets/images/bullet_enemy.png'];
            this.color = 'red';
        } else {
             this.image = null; // 重置为null，以防类型无效
             this.color = 'gray';
        }

        if (this.image) {
            this.width = this.image.width;
            this.height = this.image.height;
        } else {
            // 如果没有图片，使用默认尺寸
            this.width = 5;
            this.height = (this.type === 'enemy') ? 10 : 15;
        }
        // console.log(`Bullet reset: type=${this.type}, x=${this.x}, y=${this.y}, image=${this.image ? this.image.src : 'none'}`);
    }

    // 碰撞检测相关 (可以后续添加，或者在collision.js中统一处理)
    // collidesWith(otherObject) {
    //     return (
    //         this.x < otherObject.x + otherObject.width &&
    //         this.x + this.width > otherObject.x &&
    //         this.y < otherObject.y + otherObject.height &&
    //         this.y + this.height > otherObject.y
    //     );
    // }
}