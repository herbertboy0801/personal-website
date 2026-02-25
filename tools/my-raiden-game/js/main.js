// 使用 async 函数来方便地处理 Promise (资源加载)
window.addEventListener('load', async function() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('2D context not available!');
        return;
    }

    // 设置Canvas尺寸 (可以根据需要调整)
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    console.log('Canvas initialized:', canvas.width, 'x', canvas.height);

    // 游戏资源预加载（如果需要）
    // const assets = new Assets();
    // assets.loadAll(() => {
    //     // 资源加载完毕后启动游戏
    //     const game = new Game(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, assets);
    //     game.start();
    // });

    // 定义需要加载的图片资源列表
    const imageUrls = [
        'assets/images/player.png',
        'assets/images/enemy_basic.png',
        'assets/images/enemy_sinewave.png',
        'assets/images/enemy_tracking.png',
        'assets/images/enemy_scatter.png',
        'assets/images/boss_phase1.png',
        'assets/images/bullet_player.png',
        'assets/images/bullet_enemy.png'
        // 道具图片暂时不加载
        // 'assets/images/powerup_weapon.png',
        // 'assets/images/powerup_shield.png',
        // 'assets/images/powerup_bomb.png'
    ];

    try {
        console.log('Loading assets...');
        // 调用 assetLoader.js 中的函数加载资源
        const loadedAssets = await loadAssets(imageUrls);
        console.log('Assets loaded, initializing game...');

        // 创建 Game 实例，并将加载的资源传递进去
        // *** 注意：我们稍后需要修改 Game 类的构造函数来接收和存储 loadedAssets ***
        const game = new Game(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, loadedAssets);

        if (typeof game.start === 'function') {
            game.start();
            // console.log('Game started.'); // game.start() 内部已有日志
        } else {
            console.error('Game object or game.start() method is not defined properly.');
        }

    } catch (error) {
        console.error('Failed to load assets or start game:', error);
        // 可以在这里向用户显示错误信息
        ctx.fillStyle = 'red';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('加载资源失败，请刷新重试。', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
});