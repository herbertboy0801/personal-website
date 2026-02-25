// 获取 DOM 元素
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score');
const timeLeftDisplay = document.getElementById('time-left');
const catcher = document.getElementById('catcher');
const gameOverDisplay = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
// 新增 DOM 元素引用
const nameInputOverlay = document.getElementById('name-input-overlay');
const playerNameInput = document.getElementById('player-name-input');
const submitNameButton = document.getElementById('submit-name-button');
const leaderboardButton = document.getElementById('leaderboard-button');
const leaderboardOverlay = document.getElementById('leaderboard-overlay');
const leaderboardList = document.getElementById('leaderboard-list');
const closeLeaderboardButton = document.getElementById('close-leaderboard-button');


// 游戏变量
let score = 0;
let playerName = ''; // 存储玩家名称
let leaderboardData = []; // 存储排行榜数据 { name: 'xxx', score: 100 }
const initialTime = 30; // 初始游戏时间 (秒) - 定义为常量
let timeLeft = initialTime; // 使用常量初始化
// let itemInterval; // 不再使用 setInterval
let itemCreationTimeoutId = null; // 用于 setTimeout
let timerInterval;
let isGameOver = true; // 初始状态为游戏结束，等待开始
let isPaused = false; // 游戏是否暂停
let animationFrameId = null; // 用于存储 requestAnimationFrame 的 ID
let bgmAudio = null; // 背景音乐 Audio 对象
let eatAudio = new Audio('assets/eat.mp3'); // 接到物品音效
let gameOverAudio = new Audio('assets/gameover.mp3'); // 游戏结束音效

// 掉落物类型、分数和权重 - 使用实际图片
const itemTypes = [
    // 分数低，权重高 (更容易出现)
    { type: 'item3', points: 5,  imageUrl: 'assets/picture3.png', weight: 30 }, // 最低分，最高权重
    { type: 'item5', points: 10, imageUrl: 'assets/picture5.png', weight: 25 },
    { type: 'item1', points: 15, imageUrl: 'assets/picture1.png', weight: 20 },
    { type: 'item6', points: 25, imageUrl: 'assets/picture6.png', weight: 15 },
    // 分数高，权重低 (更难出现)
    { type: 'item2', points: 50, imageUrl: 'assets/picture2.png', weight: 7 },
    { type: 'item4', points: 100,imageUrl: 'assets/picture4.png', weight: 3 }  // 最高分，最低权重
];
// 计算总权重，用于加权随机选择
const totalWeight = itemTypes.reduce((sum, item) => sum + item.weight, 0);

// 控制按钮 (稍后在 HTML 中添加)
let startButton;
let pauseButton;
let endButton;


// 游戏区域尺寸 - 在 DOM 加载后获取
let gameWidth;
let gameHeight;
// let catcherWidth; // catcherWidth 会在需要时动态获取 offsetWidth

function initializeGameDimensions() {
    // 使用 clientWidth 获取内部宽度，不包括边框
    gameWidth = gameContainer.clientWidth;
    gameHeight = gameContainer.clientHeight; // 使用 clientHeight
}


// 控制圆盘移动 (鼠标)
gameContainer.addEventListener('mousemove', (e) => {
    // 游戏结束或暂停时不允许移动
    if (isGameOver || isPaused) return;

    const gameRect = gameContainer.getBoundingClientRect();
    const containerClientWidth = gameContainer.clientWidth;
    const currentCatcherWidth = catcher.offsetWidth;

    // 鼠标位置相对于游戏容器 *内容区域* 左边缘的位置
    const mouseXRelPadding = e.clientX - (gameRect.left + gameContainer.clientLeft);

    // --- 强制边界逻辑 ---
    let targetLeft = mouseXRelPadding - currentCatcherWidth / 2;
    const minBoundary = 0;
    const maxBoundary = containerClientWidth - currentCatcherWidth;
    let clampedLeft;
    if (targetLeft < minBoundary) {
        clampedLeft = minBoundary;
    } else if (targetLeft > maxBoundary) {
        clampedLeft = maxBoundary;
    } else {
        clampedLeft = targetLeft;
    }
    // --- 结束强制边界逻辑 ---

    const finalLeft = Math.floor(clampedLeft);
    catcher.style.left = `${finalLeft}px`;
});

// 控制圆盘移动 (触摸)
gameContainer.addEventListener('touchmove', (e) => {
    if (isGameOver || isPaused) return;
    e.preventDefault(); // 阻止滚动

    if (e.touches.length > 0) {
        const touch = e.touches[0];
        const gameRect = gameContainer.getBoundingClientRect();
        const containerClientWidth = gameContainer.clientWidth;
        const currentCatcherWidth = catcher.offsetWidth;
        const touchXRelPadding = touch.clientX - (gameRect.left + gameContainer.clientLeft);

        // --- 强制边界逻辑 (与 mousemove 相同) ---
        let targetLeft = touchXRelPadding - currentCatcherWidth / 2;
        const minBoundary = 0;
        const maxBoundary = containerClientWidth - currentCatcherWidth;
        let clampedLeft;
        if (targetLeft < minBoundary) { clampedLeft = minBoundary; }
        else if (targetLeft > maxBoundary) { clampedLeft = maxBoundary; }
        else { clampedLeft = targetLeft; }
        // --- 结束强制边界逻辑 ---

        const finalLeft = Math.floor(clampedLeft);
        catcher.style.left = `${finalLeft}px`;
    }
}, { passive: false });

gameContainer.addEventListener('touchstart', (e) => {
     if (isGameOver || isPaused) return;
     if (e.touches.length > 0) {
        // 重复 touchmove 中的移动逻辑
        const touch = e.touches[0];
        const gameRect = gameContainer.getBoundingClientRect();
        const containerClientWidth = gameContainer.clientWidth;
        const currentCatcherWidth = catcher.offsetWidth;
        const touchXRelPadding = touch.clientX - (gameRect.left + gameContainer.clientLeft);
        let targetLeft = touchXRelPadding - currentCatcherWidth / 2;
        const minBoundary = 0;
        const maxBoundary = containerClientWidth - currentCatcherWidth;
        let clampedLeft;
        if (targetLeft < minBoundary) { clampedLeft = minBoundary; }
        else if (targetLeft > maxBoundary) { clampedLeft = maxBoundary; }
        else { clampedLeft = targetLeft; }
        const finalLeft = Math.floor(clampedLeft);
        catcher.style.left = `${finalLeft}px`;
     }
}, { passive: true });


// 创建掉落物 (使用加权随机选择)
function createFallingItem() {
    if (isGameOver || isPaused || !gameWidth) return;

    // --- 加权随机选择逻辑 ---
    let randomWeight = Math.random() * totalWeight;
    let selectedType = null;
    for (const itemType of itemTypes) {
        randomWeight -= itemType.weight;
        if (randomWeight <= 0) {
            selectedType = itemType;
            break;
        }
    }
    // 如果因为浮点数精度问题没有选到，默认选第一个
    if (!selectedType) {
        selectedType = itemTypes[0];
    }
    // --- 结束加权随机选择逻辑 ---

    const item = document.createElement('div');
    item.classList.add('falling-item', selectedType.type);
    item.style.position = 'absolute';
    item.style.backgroundSize = 'contain';
    item.style.backgroundRepeat = 'no-repeat';
    item.style.backgroundPosition = 'center';
    item.style.backgroundImage = `url('${selectedType.imageUrl}')`;
    item.dataset.points = selectedType.points;

    // 从 CSS 获取尺寸或在此处定义 (确保与 CSS 匹配)
    // 注意：如果 CSS 中修改了 .falling-item 的尺寸，这里可能需要同步
    const itemStyle = window.getComputedStyle(item);
    // 尝试获取 CSS 变量或直接使用数值
    const itemWidth = parseInt(itemStyle.getPropertyValue('--item-size')) || 70; // 假设 CSS 中定义了 --item-size
    // 如果没有 CSS 变量，则使用之前的值，但要确保与 CSS 一致
    // const itemWidth = 70; // 确保与 CSS 中的 .falling-item width 一致
    const maxLeft = gameWidth - itemWidth;
    const randomLeft = Math.random() * maxLeft;
    item.style.left = `${randomLeft}px`;
    item.style.top = `-${itemWidth}px`;

    gameContainer.appendChild(item);
    setItemFallSpeed(item);
}

// 动态调度物品创建 (5秒后加速, 数量从2倍增至5倍)
function scheduleNextItemCreation() {
    if (isGameOver || isPaused) {
        itemCreationTimeoutId = null;
        return;
    }
    const thresholdTime = 5; // 开始加速的时间点 (秒) - 改为5秒
    const accelerationDuration = initialTime - thresholdTime; // 加速阶段的总时长
    const minInterval = 37; // 最快间隔 (ms) - 最终目标 (保持不变)
    const maxInterval = 1000; // 最慢间隔 (ms) - 保持不变
    const baseItemCount = 2; // 基础掉落数量
    const maxItemCount = 5; // 最大掉落数量

    let adjustedTimeElapsedRatio = 0;
    // 仅在游戏进行超过 thresholdTime 秒且有加速区间时计算加速比例
    if (timeLeft < initialTime - thresholdTime && accelerationDuration > 0) {
        const timeSinceThreshold = Math.max(0, (initialTime - thresholdTime) - timeLeft);
        adjustedTimeElapsedRatio = Math.min(1, timeSinceThreshold / accelerationDuration);
    }

    // 使用调整后的比例计算当前间隔
    const currentInterval = maxInterval - adjustedTimeElapsedRatio * (maxInterval - minInterval);

    // 计算当前应该生成的物品数量
    let itemCount = baseItemCount;
    if (timeLeft < initialTime - thresholdTime && accelerationDuration > 0) {
        // 在加速区间内，数量从 baseItemCount 线性增加到 maxItemCount
        itemCount = Math.round(baseItemCount + adjustedTimeElapsedRatio * (maxItemCount - baseItemCount));
    }


    itemCreationTimeoutId = setTimeout(() => {
        // 根据计算出的 itemCount 生成物品
        for (let i = 0; i < itemCount; i++) {
            createFallingItem();
        }
        scheduleNextItemCreation();
    }, currentInterval);
}

// 设置物品下落速度 (5秒后加速)
function setItemFallSpeed(item) {
    const pointsValue = parseInt(item.dataset.points);
    const baseSpeed = 2 + (pointsValue / 5);
    let randomSpeedComponent = Math.random() * 2;
    const thresholdTime = 5; // 开始加速的时间点 (秒)
    const accelerationDuration = initialTime - thresholdTime; // 加速阶段的总时长
    const maxSpeedIncreaseFactor = 5.4; // 提高速度增加因子 - 调整为原60%

    let adjustedTimeElapsedRatio = 0;
    // 仅在游戏进行超过10秒且有加速区间时计算加速比例
    if (timeLeft < initialTime - thresholdTime && accelerationDuration > 0) {
        const timeSinceThreshold = Math.max(0, (initialTime - thresholdTime) - timeLeft);
        adjustedTimeElapsedRatio = Math.min(1, timeSinceThreshold / accelerationDuration);
    }

    // 使用调整后的比例计算时间速度因子
    const timeSpeedFactor = 1.0 + adjustedTimeElapsedRatio * maxSpeedIncreaseFactor;
    const finalSpeed = (baseSpeed + randomSpeedComponent) * timeSpeedFactor;
    item.dataset.fallSpeed = finalSpeed;
}


// --- 主游戏循环 ---
let gameLoopId = null;

function gameLoop() {
    if (isGameOver || isPaused) {
        gameLoopId = null;
        return;
    }

    const gameRect = gameContainer.getBoundingClientRect();
    const catcherRect = catcher.getBoundingClientRect();
    const catcherTopRel = catcherRect.top - gameRect.top - gameContainer.clientTop;
    const catcherLeftRel = catcherRect.left - gameRect.left - gameContainer.clientLeft;
    const currentCatcherHeight = catcherRect.height;
    const currentCatcherWidth = catcherRect.width;

    const items = document.querySelectorAll('.falling-item');

    items.forEach(item => {
        const fallSpeed = parseFloat(item.dataset.fallSpeed);
        if (isNaN(fallSpeed)) return;

        let top = parseFloat(item.style.top);
        top += fallSpeed;
        item.style.top = `${top}px`;

        const itemRect = item.getBoundingClientRect();

        // 1. 检查是否掉落出底部
        if (itemRect.bottom > gameRect.bottom) {
            if (item.parentNode === gameContainer) gameContainer.removeChild(item);
            return;
        }

        // 2. 检测碰撞
        const itemTopRel = itemRect.top - gameRect.top - gameContainer.clientTop;
        const itemLeftRel = itemRect.left - gameRect.left - gameContainer.clientLeft;
        const currentItemHeight = itemRect.height;
        const currentItemWidth = itemRect.width;
        const pointsValue = parseInt(item.dataset.points);

        if (itemTopRel + currentItemHeight >= catcherTopRel &&
            itemTopRel < catcherTopRel + currentCatcherHeight &&
            itemLeftRel + currentItemWidth > catcherLeftRel &&
            itemLeftRel < catcherLeftRel + currentCatcherWidth) {

            score += pointsValue;
            scoreDisplay.textContent = score;
            const popupX = itemLeftRel + currentItemWidth / 2;
            const popupY = itemTopRel;
            showPointsAnimation(pointsValue, popupX, popupY);
            if (item.parentNode === gameContainer) gameContainer.removeChild(item);
            eatAudio.currentTime = 0;
            eatAudio.play().catch(e => console.log("无法播放接到音效:", e));
            return;
        }
    });

    gameLoopId = requestAnimationFrame(gameLoop);
}

// 显示得分动画
function showPointsAnimation(points, x, y) {
    const pointsPopup = document.createElement('div');
    pointsPopup.textContent = `+${points}`;
    pointsPopup.classList.add('score-popup');
    pointsPopup.style.left = `${x}px`;
    pointsPopup.style.top = `${y - 30}px`;
    gameContainer.appendChild(pointsPopup);
    pointsPopup.addEventListener('animationend', () => {
        if (pointsPopup.parentNode === gameContainer) gameContainer.removeChild(pointsPopup);
    });
}


// 更新计时器
function updateTimer() {
    if (isPaused || isGameOver) return;
    timeLeft--;
    timeLeftDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
        endGame();
    }
}

// --- 游戏控制函数 ---

// 开始游戏
function startGame() {
    if (!isGameOver && !isPaused) return;
    if (isPaused) {
        resumeGame();
        return;
    }

    initializeGameDimensions();
    if (!gameWidth) {
        console.error("无法获取游戏容器尺寸");
        return;
    }

    isGameOver = false;
    isPaused = false;
    score = 0;
    timeLeft = initialTime;
    scoreDisplay.textContent = score;
    timeLeftDisplay.textContent = timeLeft;
    gameOverDisplay.style.display = 'none';

    const currentCatcherWidth = catcher.offsetWidth;
    catcher.style.left = `${(gameWidth - currentCatcherWidth) / 2}px`;

    clearTimeout(itemCreationTimeoutId);
    itemCreationTimeoutId = null;
    clearInterval(timerInterval);
    document.querySelectorAll('.falling-item').forEach(item => {
        if (item.parentNode === gameContainer) gameContainer.removeChild(item);
    });

    scheduleNextItemCreation();
    timerInterval = setInterval(updateTimer, 1000);

    if (!gameLoopId) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    if(pauseButton) pauseButton.textContent = '暂停';
    if(startButton) startButton.disabled = true;
    if(pauseButton) pauseButton.disabled = false;
    if(endButton) endButton.disabled = false;

    if (!bgmAudio) {
        bgmAudio = new Audio('assets/bgm.mp3');
        bgmAudio.loop = true;
    }
    bgmAudio.play().catch(e => console.log("无法播放背景音乐:", e));
    console.log("游戏开始");
}

// 暂停游戏
function pauseGame() {
    if (isGameOver || isPaused) return;
    isPaused = true;
    clearTimeout(itemCreationTimeoutId);
    itemCreationTimeoutId = null;
    clearInterval(timerInterval);

    if(pauseButton) pauseButton.textContent = '继续';
    if(startButton) startButton.disabled = true;
    if(pauseButton) pauseButton.disabled = false;
    if(endButton) endButton.disabled = false;

    if (bgmAudio) bgmAudio.pause();
    console.log("游戏暂停");
}

// 继续游戏
function resumeGame() {
    if (isGameOver || !isPaused) return;
    isPaused = false;
    scheduleNextItemCreation();
    timerInterval = setInterval(updateTimer, 1000);
    if (!gameLoopId) {
         gameLoopId = requestAnimationFrame(gameLoop);
    }

    if(pauseButton) pauseButton.textContent = '暂停';
    if(startButton) startButton.disabled = true;
    if(pauseButton) pauseButton.disabled = false;
    if(endButton) endButton.disabled = false;

    if (bgmAudio) bgmAudio.play().catch(e => console.log("无法恢复背景音乐:", e));
    console.log("游戏继续");
}


// 结束游戏
function endGame() {
    if (isGameOver) return;
    isGameOver = true;
    isPaused = false;
    clearTimeout(itemCreationTimeoutId);
    itemCreationTimeoutId = null;
    clearInterval(timerInterval);
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    document.querySelectorAll('.falling-item').forEach(item => {
         if (item.parentNode === gameContainer) gameContainer.removeChild(item);
    });

    finalScoreDisplay.textContent = score;
    gameOverDisplay.style.display = 'block';

    if(startButton) startButton.disabled = false;
    if(pauseButton) pauseButton.disabled = true;
    if(pauseButton) pauseButton.textContent = '暂停';
    if(endButton) endButton.disabled = true;

    if (bgmAudio) {
        bgmAudio.pause();
        bgmAudio.currentTime = 0;
    }
    gameOverAudio.play().catch(e => console.log("无法播放结束音效:", e));
    saveScoreToLeaderboard(playerName, score);
    console.log("游戏结束");
}


// --- 排行榜函数 ---

function loadLeaderboard() {
    const storedData = localStorage.getItem('fallingItemsLeaderboard');
    if (storedData) {
        try {
            leaderboardData = JSON.parse(storedData);
            if (!Array.isArray(leaderboardData)) leaderboardData = [];
        } catch (e) {
            console.error("加载排行榜数据失败:", e);
            leaderboardData = [];
        }
    } else {
        leaderboardData = [];
    }
    leaderboardData.sort((a, b) => b.score - a.score);
}

function saveScoreToLeaderboard(name, score) {
    if (!name || typeof score !== 'number') return;
    loadLeaderboard();
    leaderboardData.push({ name, score });
    leaderboardData.sort((a, b) => b.score - a.score);
    leaderboardData = leaderboardData.slice(0, 10);
    try {
        localStorage.setItem('fallingItemsLeaderboard', JSON.stringify(leaderboardData));
    } catch (e) {
        console.error("保存排行榜数据失败:", e);
    }
}

function displayLeaderboard() {
    loadLeaderboard();
    leaderboardList.innerHTML = '';
    if (leaderboardData.length === 0) {
        leaderboardList.innerHTML = '<li>暂无记录</li>';
    } else {
        leaderboardData.forEach((entry, index) => {
            const li = document.createElement('li');
            const displayName = entry.name || '未知玩家';
            const displayScore = typeof entry.score === 'number' ? entry.score : '?';
            li.textContent = `${displayName}: `; // 移除手动添加的序号，依赖 <ol> 自动编号
            const scoreSpan = document.createElement('span');
            scoreSpan.textContent = displayScore;
            li.appendChild(scoreSpan);
            leaderboardList.appendChild(li);
        });
    }
}

// --- 新增：键盘控制 ---
const catcherMoveSpeed = 15; // 键盘移动速度 (像素/按键)

function moveCatcherByKey(direction) {
    if (isGameOver || isPaused) return;

    const containerClientWidth = gameContainer.clientWidth;
    const currentCatcherWidth = catcher.offsetWidth;
    // 尝试从 style.left 获取，如果为空或无效，则计算居中值
    let currentLeft = parseFloat(catcher.style.left);
    if (isNaN(currentLeft)) {
        currentLeft = (containerClientWidth - currentCatcherWidth) / 2;
    }


    if (direction === 'left') {
        currentLeft -= catcherMoveSpeed;
    } else if (direction === 'right') {
        currentLeft += catcherMoveSpeed;
    }

    // --- 强制边界逻辑 ---
    const minBoundary = 0;
    const maxBoundary = containerClientWidth - currentCatcherWidth;
    let clampedLeft;
    if (currentLeft < minBoundary) {
        clampedLeft = minBoundary;
    } else if (currentLeft > maxBoundary) {
        clampedLeft = maxBoundary;
    } else {
        clampedLeft = currentLeft;
    }
    // --- 结束强制边界逻辑 ---

    catcher.style.left = `${Math.floor(clampedLeft)}px`;
}

document.addEventListener('keydown', (e) => {
    // 只在游戏进行中且名称输入界面隐藏时响应键盘事件
    if (!isGameOver && !isPaused && nameInputOverlay.style.display === 'none') {
        if (e.key === 'ArrowLeft') {
            moveCatcherByKey('left');
        } else if (e.key === 'ArrowRight') {
            moveCatcherByKey('right');
        }
    }
});


// --- 事件监听器 ---

// 处理名称提交
function handleNameSubmit() {
    const name = playerNameInput.value.trim();
    if (name) {
        playerName = name;
        nameInputOverlay.style.display = 'none';
        if(startButton) startButton.disabled = false;
    } else {
        alert('请输入你的名字！');
    }
}

// 重新开始游戏按钮
restartButton.addEventListener('click', startGame);

// --- 物品图例显示 ---
function displayItemLegend() {
    const legendContainer = document.getElementById('item-legend');
    if (!legendContainer) return;

    legendContainer.innerHTML = ''; // 清空现有内容

    itemTypes.forEach(item => {
        const legendItemDiv = document.createElement('div');
        legendItemDiv.classList.add('legend-item');

        const img = document.createElement('img');
        img.src = item.imageUrl;
        img.alt = item.type; // 添加 alt 文本

        const pointsSpan = document.createElement('span');
        pointsSpan.textContent = `${item.points}`;

        legendItemDiv.appendChild(img);
        legendItemDiv.appendChild(pointsSpan);
        legendContainer.appendChild(legendItemDiv);
    });
}


// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', (event) => {
    startButton = document.getElementById('start-button');
    pauseButton = document.getElementById('pause-button');
    endButton = document.getElementById('end-button');

    loadLeaderboard();

    if (submitNameButton) submitNameButton.addEventListener('click', handleNameSubmit);
    if (playerNameInput) playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleNameSubmit();
    });

    if (startButton) startButton.addEventListener('click', startGame);
    if (pauseButton) {
        pauseButton.addEventListener('click', () => {
            if (isPaused) resumeGame(); else pauseGame();
        });
        pauseButton.disabled = true;
    }
    if (endButton) {
        endButton.addEventListener('click', endGame);
        endButton.disabled = true;
    }
    if (leaderboardButton) leaderboardButton.addEventListener('click', () => {
        displayLeaderboard();
        leaderboardOverlay.style.display = 'block';
    });
    if (closeLeaderboardButton) closeLeaderboardButton.addEventListener('click', () => {
        leaderboardOverlay.style.display = 'none';
    });

    initializeGameDimensions();
    displayItemLegend(); // 调用函数显示图例

    eatAudio.load();
    gameOverAudio.load();
});


// 注意：音效文件 (bgm.mp3, eat.mp3, gameover.mp3) 和背景图片需要放在 assets 目录下。