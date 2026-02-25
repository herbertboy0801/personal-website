class PowerUp {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type; // e.g., 'weapon_upgrade', 'shield', 'bomb'
        this.width = 30;
        this.height = 30;
        this.speedY = 80; // 道具向下漂浮的速度
        this.markedForDeletion = false;

        // 根据类型设置不同外观或属性
        switch (this.type) {
            case 'weapon_upgrade':
                this.color = 'orange';
                this.letter = 'P'; // Power
                break;
            case 'shield':
                this.color = 'cyan';
                this.letter = 'S'; // Shield
                break;
            case 'bomb':
                this.color = 'red';
                this.letter = 'B'; // Bomb
                break;
            default:
                this.color = 'gray';
                this.letter = '?';
        }
    }
reset(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.markedForDeletion = false;
        // this.speedY 保持不变，或者也可以作为参数传入

        switch (this.type) {
            case 'weapon_upgrade':
                this.color = 'orange';
                this.letter = 'P';
                break;
            case 'shield':
                this.color = 'cyan';
                this.letter = 'S';
                break;
            case 'bomb':
                this.color = 'red';
                this.letter = 'B';
                break;
            default:
                this.color = 'gray';
                this.letter = '?';
        }
    }

    update(deltaTime) {
        this.y += this.speedY * deltaTime;
        if (this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 在道具上绘制字母以区分
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.letter, this.x + this.width / 2, this.y + this.height / 2);
    }

    applyEffect(player) {
        switch (this.type) {
            case 'weapon_upgrade':
                player.upgradeWeapon();
                console.log('Player picked up weapon upgrade!');
                break;
            case 'shield':
                player.activateShield();
                console.log('Player picked up shield!');
                break;
            case 'bomb':
                player.addBomb();
                console.log('Player picked up bomb!');
                break;
        }
        this.markedForDeletion = true; // 拾取后标记删除
    }
}