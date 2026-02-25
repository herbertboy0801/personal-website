class UI {
    constructor(game) {
        this.game = game;
        this.fontSize = 24;
        this.fontFamily = 'Arial';
        this.color = 'white';
        this.playerIcon = this.game.assets['assets/images/player.png']; // 获取玩家图标
        this.iconSize = 30; // 定义图标大小

        // 屏幕闪烁效果相关
        this.screenFlashAlpha = 0;
        this.screenFlashDuration = 0.3; // 闪烁持续总时间（秒）
        this.screenFlashTimer = 0;

        // 临时消息相关
        this.messageText = '';
        this.messageDuration = 3; // 消息显示时间（秒）
        this.messageTimer = 0;
    }

    showMessage(text, duration) {
        // ... (保持不变) ...
        this.messageText = text;
        this.messageDuration = duration || 3; // 默认显示3秒
        this.messageTimer = this.messageDuration;
        console.log(`UI showing message: "${text}" for ${this.messageDuration}s`);
    }


    draw(ctx) {
        ctx.save(); // 保存状态

        // --- 根据游戏状态绘制不同内容 ---
        if (this.game.gameState === 'startScreen') {
            // --- 绘制开始界面 ---
            ctx.save(); // 保存特定于此状态的设置
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // 半透明背景
            ctx.fillRect(0, 0, this.game.width, this.game.height);

            // 游戏标题
            ctx.font = 'bold 70px Arial';
            ctx.fillStyle = 'lightblue';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 4;
            ctx.fillText('MY RAIDEN GAME', this.game.width / 2, this.game.height / 2 - 80);
            ctx.shadowColor = 'transparent'; // 清除阴影

            // 开始提示
            ctx.font = '30px Arial';
            ctx.fillStyle = 'white';
            // 添加闪烁效果 (可选)
            if (Math.floor(performance.now() / 500) % 2 === 0) { // 每半秒切换显隐
                 ctx.fillText('按 Enter 键开始游戏', this.game.width / 2, this.game.height / 2 + 50);
            }

            // 操作说明 (可选)
            ctx.font = '18px Arial';
            ctx.fillStyle = '#ccc';
            ctx.fillText('方向键: 移动  空格: 射击  X: 炸弹', this.game.width / 2, this.game.height - 50);

            ctx.restore(); // 恢复状态

        } else if (this.game.gameState === 'playing') {
            // --- 绘制游戏进行中的 UI ---
            const padding = 15;
            const topMargin = 35;

            // 绘制得分 (左上角)
            ctx.font = `${this.fontSize}px ${this.fontFamily}`;
            ctx.fillStyle = this.color;
            ctx.textAlign = 'left';
            ctx.fillText(`得分: ${this.game.score}`, padding, topMargin);

            // 绘制生命和炸弹 (右上角)
            if (this.game.player) {
                if (this.playerIcon) {
                    const livesStartX = this.game.width - padding - (this.game.player.lives * (this.iconSize + 5));
                    for (let i = 0; i < this.game.player.lives; i++) {
                        ctx.drawImage(this.playerIcon, livesStartX + i * (this.iconSize + 5), topMargin - this.iconSize / 2 - 5, this.iconSize, this.iconSize);
                    }
                } else {
                    ctx.textAlign = 'right';
                    ctx.fillText(`生命: ${this.game.player.lives}`, this.game.width - padding, topMargin);
                }
                ctx.textAlign = 'right';
                const livesAreaWidth = this.playerIcon ? (this.game.player.lives * (this.iconSize + 5)) + padding : 100;
                const bombTextX = this.game.width - padding - livesAreaWidth;
                ctx.fillText(`炸弹: ${this.game.player.bombs}`, bombTextX, topMargin);
            } else {
                ctx.textAlign = 'right';
                ctx.fillText(`生命: N/A`, this.game.width - padding, topMargin);
                ctx.fillText(`炸弹: N/A`, this.game.width - padding - 100, topMargin);
            }

            // 绘制 Boss 血条
            if (this.game.boss && this.game.bossActive && !this.game.boss.markedForDeletion) {
                const barWidth = this.game.width * 0.6;
                const barHeight = 20;
                const barX = (this.game.width - barWidth) / 2;
                const barY = 15;
                const healthPercent = Math.max(0, this.game.boss.health / this.game.boss.maxHealth);
                ctx.fillStyle = '#555';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                ctx.fillStyle = 'red';
                ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.strokeRect(barX, barY, barWidth, barHeight);
            }

        } else if (this.game.gameState === 'gameOver') {
            // --- 绘制游戏结束信息 ---
             ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, this.game.width, this.game.height);
            ctx.font = 'bold 60px Arial';
            ctx.fillStyle = 'red';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;
            ctx.fillText('游戏结束', this.game.width / 2, this.game.height / 2 - 40);
            ctx.shadowColor = 'transparent';
            ctx.font = '30px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText(`最终得分: ${this.game.score}`, this.game.width / 2, this.game.height / 2 + 30);
            ctx.font = '24px Arial';
            ctx.fillStyle = '#ccc';
             // 添加闪烁效果 (可选)
            if (Math.floor(performance.now() / 500) % 2 === 0) { // 每半秒切换显隐
                 ctx.fillText('按 R 键重新开始', this.game.width / 2, this.game.height / 2 + 80);
            }
        }

        // --- 绘制通用 UI 元素 (闪烁和消息) ---
        // 屏幕闪烁效果
        if (this.screenFlashTimer > 0) {
             this.screenFlashTimer -= (1/60);
            const halfDuration = this.screenFlashDuration / 2;
            if (this.screenFlashTimer > halfDuration) {
                this.screenFlashAlpha = 1 - (this.screenFlashTimer - halfDuration) / halfDuration;
            } else {
                this.screenFlashAlpha = this.screenFlashTimer / halfDuration;
            }
            this.screenFlashAlpha = Math.min(0.7, Math.max(0, this.screenFlashAlpha));
            ctx.fillStyle = `rgba(255, 255, 255, ${this.screenFlashAlpha})`;
            ctx.fillRect(0, 0, this.game.width, this.game.height);
            if (this.screenFlashTimer <= 0) {
                this.screenFlashAlpha = 0;
            }
        }

        // 临时消息
        if (this.messageTimer > 0) {
             this.messageTimer -= (1/60);
            ctx.font = '30px Arial';
            ctx.fillStyle = 'yellow';
            ctx.textAlign = 'center';
            const halfMsgDuration = this.messageDuration / 2;
            let msgAlpha = 1;
            if (this.messageTimer > this.messageDuration - 0.5) {
                 msgAlpha = (this.messageDuration - this.messageTimer) / 0.5;
            } else if (this.messageTimer < 0.5) {
                 msgAlpha = this.messageTimer / 0.5;
            }
            ctx.globalAlpha = Math.max(0, Math.min(1, msgAlpha));
            ctx.fillText(this.messageText, this.game.width / 2, this.game.height / 2 - 60);
            ctx.globalAlpha = 1;
            if (this.messageTimer <= 0) {
                this.messageText = '';
            }
        }

        ctx.restore(); // 恢复 canvas 状态
    }

     triggerScreenFlash() {
        // ... (保持不变) ...
        this.screenFlashTimer = this.screenFlashDuration;
        this.screenFlashAlpha = 0; // 初始透明度
        console.log('UI triggered screen flash.');
    }
}