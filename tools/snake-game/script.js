// --- DOM 元素获取 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
// const startButton = document.getElementById('startButton'); // This button seems unused in the current HTML structure
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton'); // Now "Return to Main Menu"
const finalScoreElement = document.getElementById('finalScore');
const pauseButton = document.getElementById('pauseButton');
const endButton = document.getElementById('endButton');
const highScoreElement = document.getElementById('highScore'); // Global High Score
const timerElement = document.getElementById('timer');
const difficultyLevelElement = document.getElementById('difficultyLevel');
const newHighScoreMsgElement = document.getElementById('newHighScoreMsg'); // Global new high score message

// Start Screen Elements
const startScreenElement = document.getElementById('startScreen');
const preGamePlayerNameInputElement = document.getElementById('preGamePlayerNameInput');
const startGameWithNameButtonElement = document.getElementById('startGameWithNameButton');
const globalLeaderboardPreviewElement = document.getElementById('globalLeaderboardPreview');
const globalLeaderboardListPreviewElement = document.getElementById('globalLeaderboardListPreview');
const noScoresYetElement = document.getElementById('noScoresYet'); // For "no scores" message

// Game Container Elements
const gameContainerElement = document.querySelector('.game-container'); // Get the game container itself
const currentPlayerNameElement = document.getElementById('currentPlayerName');

// Language Button
const langButton = document.getElementById('langButton');

// Play Count Element
const playCountElement = document.getElementById('playCount'); // New

// D-pad Elements
const dpadElement = document.getElementById('dpad');
const dpadUpButton = document.getElementById('dpad-up');
const dpadDownButton = document.getElementById('dpad-down');
const dpadLeftButton = document.getElementById('dpad-left');
const dpadRightButton = document.getElementById('dpad-right');

// --- localStorage Keys ---
// const GLOBAL_HIGH_SCORE_KEY = 'cyberSnakeGlobalHighScore'; // Replaced by backend
// const PLAYER_SCORES_KEY = 'cyberSnakePlayerScores'; // Replaced by backend
const LANGUAGE_KEY = 'cyberSnakeLanguage'; // Key for language preference (still client-side)
// const PLAY_COUNT_KEY = 'cyberSnakePlayCount'; // Replaced by backend

// --- API Base URL ---
// const API_BASE_URL = 'http://localhost:3000/api'; // Old local server URL
const API_BASE_URL = '/.netlify/functions'; // Relative path for Netlify Functions

// --- 音效 ---
const eatSound = new Audio('assets/audio/eat.mp3');
const gameOverSound = new Audio('assets/audio/gameover.mp3');
const backgroundMusic = new Audio('assets/audio/bgm.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

// --- 游戏常量与变量 ---
const gridSize = 20;
let canvasSize = 400;
let tileCount = canvasSize / gridSize;

// 蛇的状态
let snake = [];
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };

// 食物的位置
let food = { x: 15, y: 15 };

// 游戏状态
let score = 0;
let gameLoopInterval = null;
let initialGameSpeed = 150;
let currentGameSpeed = initialGameSpeed;
let minGameSpeed = 50;
let speedIncreaseInterval = 10; // Increase speed every 10 seconds
let speedIncreaseAmount = 5; // Decrease interval by 5ms each time
let baseFoodScore = 10;
let scoreMultiplier = 1;
let currentDifficultyLevel = 1; // Store difficulty level reached (number or string "MAX")

let isGameOver = false;
let isGameRunning = false;
let isPaused = false;
let globalHighScore = 0; // Will be updated from leaderboard API
// let allPlayerScores = {}; // Replaced by backend leaderboard data
let currentLeaderboard = []; // Store fetched leaderboard data
let currentPlayerName = 'default'; // Store the current player's name

let timerInterval = null;
let elapsedTime = 0;

// Touch controls variables
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// Language state
let currentLanguage = 'zh-CN'; // Default language

// Play Count state
let totalPlayCount = 0; // New variable for play count

// --- 翻译文本 ---
const translations = {
    'zh-CN': {
        title: 'CyberSnake - 赛博朋克贪食蛇',
        gameTitle: 'CyberSnake',
        playerNamePlaceholder: '输入你的名字 (默认: default)',
        startGame: '开始游戏',
        leaderboardTitlePreview: '排行榜 (Top 5)',
        noScoresYet: '还没有记录...',
        playerLabel: '玩家',
        scoreLabel: '得分',
        timeLabel: '时间',
        difficultyLabel: '难度',
        highScoreLabel: '最高分',
        leaderboardTitle: '排行榜', // Unused leaderboard title
        controlsDesktop: '桌面端: 使用方向键控制',
        controlsMobile: '移动端: 滑动屏幕控制',
        pause: '暂停',
        resume: '恢复', // Added for pause button
        endGame: '结束游戏',
        gameOverTitle: '游戏结束!',
        finalScoreLabel: '最终得分',
        newHighScoreMsg: '新纪录!',
        returnToMenu: '返回主菜单',
        difficultyLevel: '难度', // For leaderboard entries
        maxDifficulty: '最大', // For difficulty display "MAX"
        playCountLabel: '游玩人次' // New translation
    },
    'en': {
        title: 'CyberSnake - Cyberpunk Snake Game',
        gameTitle: 'CyberSnake',
        playerNamePlaceholder: 'Enter your name (default: default)',
        startGame: 'Start Game',
        leaderboardTitlePreview: 'Leaderboard (Top 5)',
        noScoresYet: 'No records yet...',
        playerLabel: 'Player',
        scoreLabel: 'Score',
        timeLabel: 'Time',
        difficultyLabel: 'Difficulty',
        highScoreLabel: 'High Score',
        leaderboardTitle: 'Leaderboard', // Unused leaderboard title
        controlsDesktop: 'Desktop: Use arrow keys to control',
        controlsMobile: 'Mobile: Swipe screen to control',
        pause: 'Pause',
        resume: 'Resume', // Added for pause button
        endGame: 'End Game',
        gameOverTitle: 'Game Over!',
        finalScoreLabel: 'Final Score',
        newHighScoreMsg: 'New High Score!',
        returnToMenu: 'Return to Menu',
        difficultyLevel: 'Difficulty', // For leaderboard entries
        maxDifficulty: 'MAX', // For difficulty display "MAX"
        playCountLabel: 'Play Count' // New translation
    }
};

// --- 语言处理函数 (定义在前) ---
function loadLanguagePreference() {
    const savedLang = localStorage.getItem(LANGUAGE_KEY);
    if (savedLang && translations[savedLang]) {
        currentLanguage = savedLang;
    }
    console.log(`Language set to: ${currentLanguage}`);
    document.documentElement.lang = currentLanguage; // Set HTML lang attribute
}

function getTranslation(key) {
    return translations[currentLanguage][key] || translations['en'][key] || `[${key}]`; // Fallback chain
}

function translateElement(element) {
    const key = element.getAttribute('data-lang-key');
    const translation = getTranslation(key);
    if (translation) {
        if (element.tagName === 'INPUT' && element.placeholder) {
            element.placeholder = translation;
        } else if (element.tagName === 'TITLE') {
             document.title = translation; // Special handling for title
        }
        else {
            // Handle elements that might contain child nodes (like score labels)
            // Find the first text node and update it, or update textContent if no text nodes
             let textNode = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '');
             if (textNode) {
                 // Check if it's the pause button to apply correct state text
                 if (element.id === 'pauseButton') {
                     textNode.textContent = isPaused ? getTranslation('resume') : getTranslation('pause');
                 } else {
                     textNode.textContent = translation;
                 }
             } else {
                 // Fallback for simple elements or elements where the key applies to the whole content
                 // Check if it's the pause button to apply correct state text
                 if (element.id === 'pauseButton') {
                     element.textContent = isPaused ? getTranslation('resume') : getTranslation('pause');
                 } else {
                     element.textContent = translation;
                 }
             }
        }
    } else {
        console.warn(`Translation not found for key: ${key} in language: ${currentLanguage}`);
    }
}

function applyTranslations() {
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        translateElement(element);
    });
    // Special handling for dynamic elements not covered by querySelectorAll
    updateDifficultyDisplay(); // Ensure "MAX" is translated if needed
    renderGlobalLeaderboardPreview(); // Ensure leaderboard entries are translated
}


function toggleLanguage() {
    currentLanguage = currentLanguage === 'zh-CN' ? 'en' : 'zh-CN';
    localStorage.setItem(LANGUAGE_KEY, currentLanguage);
    document.documentElement.lang = currentLanguage; // Update HTML lang attribute
    applyTranslations(); // Apply translations everywhere
    console.log(`Language switched to: ${currentLanguage}`);
}


// --- API 数据获取与处理 ---

// 获取排行榜数据
async function fetchLeaderboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/leaderboard`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        currentLeaderboard = data; // Store fetched data
        console.log("排行榜数据已获取:", currentLeaderboard);
        // Update global high score based on fetched data
        if (currentLeaderboard.length > 0) {
            globalHighScore = currentLeaderboard[0].score;
        } else {
            globalHighScore = 0;
        }
        highScoreElement.textContent = globalHighScore; // Update display in game screen
        renderGlobalLeaderboardPreview(); // Update preview on start screen
    } catch (error) {
        console.error('获取排行榜失败:', error);
        // Optionally display an error message to the user
        currentLeaderboard = []; // Reset leaderboard on error
        globalHighScore = 0;
        highScoreElement.textContent = globalHighScore;
        renderGlobalLeaderboardPreview(); // Render empty state
    }
}

// 获取游玩次数
async function fetchPlayCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/playcount`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        totalPlayCount = data.playCount || 0;
        console.log(`获取游玩次数: ${totalPlayCount}`);
        updatePlayCountDisplay();
    } catch (error) {
        console.error('获取游玩次数失败:', error);
        totalPlayCount = 0; // Reset on error
        updatePlayCountDisplay();
    }
}

// 记录分数到后端
async function recordScore(playerName, finalScore, finalDifficulty) {
    try {
        const response = await fetch(`${API_BASE_URL}/score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerName: playerName,
                score: finalScore,
                difficulty: finalDifficulty
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.message}`);
        }
        const result = await response.json();
        console.log('分数记录成功:', result.message);
        // Check if the new score is a global high score based on the *current* leaderboard
        if (finalScore > globalHighScore) {
             console.log("New Global High Score!", finalScore);
             globalHighScore = finalScore; // Update local high score immediately
             highScoreElement.textContent = globalHighScore;
             newHighScoreMsgElement.classList.remove('hidden');
             translateElement(newHighScoreMsgElement);
        } else {
             newHighScoreMsgElement.classList.add('hidden');
        }
        // Optionally, fetch leaderboard again to update the start screen preview immediately
        // await fetchLeaderboard(); // Uncomment if you want immediate update on return to menu
    } catch (error) {
        console.error('记录分数失败:', error);
        // Optionally display an error message to the user
    }
}

// 增加游玩次数到后端
async function incrementPlayCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/play`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // No body needed for this endpoint in the current backend implementation
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.message}`);
        }
        const result = await response.json();
        totalPlayCount = result.playCount; // Update local count from server response
        console.log(`游玩次数已增加 (来自服务器): ${totalPlayCount}`);
        updatePlayCountDisplay(); // Update display
    } catch (error) {
        console.error('增加游玩次数失败:', error);
        // Don't increment local count if server fails
    }
}


// --- UI 更新函数 ---

// 渲染排行榜预览 (使用 currentLeaderboard 数据)
function renderGlobalLeaderboardPreview() {
    globalLeaderboardListPreviewElement.innerHTML = ''; // Clear existing list

    if (currentLeaderboard.length > 0) {
        noScoresYetElement.classList.add('hidden'); // Hide "no scores" message
        currentLeaderboard.forEach((entry, index) => { // Iterate over fetched data
            const li = document.createElement('li');
            // Format difficulty correctly, using translation if needed
            let difficultyText = entry.difficulty;
            if (difficultyText === translations['en'].maxDifficulty) {
                 difficultyText = getTranslation('maxDifficulty');
            } else if (difficultyText === translations['zh-CN'].maxDifficulty) {
                 difficultyText = getTranslation('maxDifficulty');
            }
            li.textContent = `#${index + 1}: ${entry.name} - ${entry.score} (${getTranslation('difficultyLabel')}: ${difficultyText})`;
            globalLeaderboardListPreviewElement.appendChild(li);
        });
        globalLeaderboardPreviewElement.classList.remove('hidden');
    } else {
        // Show translated "no scores" message
        noScoresYetElement.textContent = getTranslation('noScoresYet');
        noScoresYetElement.classList.remove('hidden');
        globalLeaderboardPreviewElement.classList.remove('hidden'); // Keep the container visible
    }
}

// 更新游玩次数显示 (使用 totalPlayCount 变量)
function updatePlayCountDisplay() {
    if (playCountElement) {
        playCountElement.textContent = totalPlayCount;
    }
     // Also translate the label next to it
    const labelElement = playCountElement?.previousElementSibling;
    if (labelElement && labelElement.getAttribute('data-lang-key') === 'playCountLabel') {
        translateElement(labelElement);
    }
}


// --- 计时器函数 (定义在前) ---
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        elapsedTime++;
        updateTimerDisplay();
        checkSpeedIncrease(); // Check speed based on time elapsed
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function updateTimerDisplay() {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// --- 更新难度等级显示 (定义在前) ---
function updateDifficultyDisplay() {
    let level = 1;
    if (currentGameSpeed <= 140) level = 2;
    if (currentGameSpeed <= 120) level = 3;
    if (currentGameSpeed <= 100) level = 4;
    if (currentGameSpeed <= 80) level = 5;
    if (currentGameSpeed <= 60) level = 6;
    if (currentGameSpeed <= minGameSpeed) level = getTranslation('maxDifficulty'); // Use translation for "MAX"

    // Only update currentDifficultyLevel if it's not already MAX
    // This prevents overwriting the "MAX" string with a number if speed somehow increases again
    if (currentDifficultyLevel !== getTranslation('maxDifficulty')) {
        currentDifficultyLevel = level;
    }
    difficultyLevelElement.textContent = level; // Always update display
}

// --- 检查并增加速度 (定义在前) ---
function checkSpeedIncrease() {
    // Only increase speed if game is running and not paused
    if (!isGameRunning || isPaused || isGameOver) return;

    const speedIncreasesNeeded = Math.floor(elapsedTime / speedIncreaseInterval);
    const targetSpeed = Math.max(minGameSpeed, initialGameSpeed - speedIncreasesNeeded * speedIncreaseAmount);

    if (currentGameSpeed > targetSpeed) {
        console.log(`时间: ${elapsedTime}s, 速度从 ${currentGameSpeed}ms 提升至 ${targetSpeed}ms`);
        currentGameSpeed = targetSpeed;
        clearInterval(gameLoopInterval); // Clear existing loop
        gameLoopInterval = setInterval(gameLoop, currentGameSpeed); // Start new loop with faster speed
        updateDifficultyDisplay(); // Update difficulty display
    }
}


// --- 初始化函数 (页面加载时) ---
async function initializeApp() { // Make async to await fetches
    console.log("App initializing...");
    loadLanguagePreference(); // Load language first (still from localStorage)

    // Fetch initial data from backend
    await fetchLeaderboard(); // Wait for leaderboard
    await fetchPlayCount();   // Wait for play count

    setupEventListeners();
    applyTranslations(); // Apply initial translations (will also update play count label)
    // updatePlayCountDisplay(); // Called within fetchPlayCount now
    showStartScreen(); // Show start screen initially (will render leaderboard using fetched data)
}

// --- 设备检测 ---
function isMobileDevice() {
    // 更可靠的检测方式：检查触摸事件支持
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    console.log(`设备检测: hasTouch=${hasTouch}`); // 添加日志方便调试
    return hasTouch;
    // 旧的 User Agent 检测方式 (保留注释备用)
    // return /Mobi|Android/i.test(navigator.userAgent);
}

// --- 设置事件监听 ---
function setupEventListeners() {
    startGameWithNameButtonElement.addEventListener('click', handleStartGameWithName);
    restartButton.addEventListener('click', returnToMainMenu);
    pauseButton.addEventListener('click', togglePause);
    endButton.addEventListener('click', endGame);
    window.addEventListener('resize', handleResize);
    langButton.addEventListener('click', toggleLanguage); // Add listener for language button

    // D-pad listeners (use touchstart for better responsiveness on mobile)
    dpadUpButton.addEventListener('touchstart', (e) => { e.preventDefault(); handleDPadInput(0, -1); });
    dpadDownButton.addEventListener('touchstart', (e) => { e.preventDefault(); handleDPadInput(0, 1); });
    dpadLeftButton.addEventListener('touchstart', (e) => { e.preventDefault(); handleDPadInput(-1, 0); });
    dpadRightButton.addEventListener('touchstart', (e) => { e.preventDefault(); handleDPadInput(1, 0); });

    // Game controls listeners (keyboard/swipe) are added inside handleStartGameWithName
}


// --- 显示/隐藏屏幕 ---
function showStartScreen() {
    gameContainerElement.classList.add('hidden');
    startScreenElement.classList.remove('hidden');
    gameOverScreen.classList.add('hidden'); // Ensure game over is hidden
    // Stop any ongoing game processes if returning to menu
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    if (timerInterval) stopTimer();
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    isGameRunning = false;
    isPaused = false;
    isGameOver = false;
    // Fetch latest data when showing start screen again
    fetchLeaderboard();
    fetchPlayCount();
    applyTranslations(); // Ensure translations are applied when showing screen
    // renderGlobalLeaderboardPreview(); // Called within fetchLeaderboard now
}

function showGameScreen() {
    startScreenElement.classList.add('hidden');
    gameContainerElement.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
}

// --- 游戏初始化 (每次开始新游戏时) ---
function initializeNewGame() {
    console.log(`Initializing new game for player: ${currentPlayerName}`);
    currentPlayerNameElement.textContent = currentPlayerName; // Display player name

    // 动态设置画布大小
    const containerWidth = canvas.parentElement.clientWidth - 4; // Adjust for border/padding
    canvasSize = Math.floor(containerWidth / gridSize) * gridSize;
    // Ensure minimum canvas size
    canvasSize = Math.max(canvasSize, gridSize * 10); // Example: min 10x10 grid
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    tileCount = canvasSize / gridSize;

    // 重置游戏状态
    snake = [{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }];
    direction = { x: 0, y: 0 }; // Reset direction
    nextDirection = { x: 0, y: 0 }; // Reset next direction
    score = 0;
    scoreElement.textContent = score;
    isGameOver = false;
    isGameRunning = false; // Will be set true by startGame function
    isPaused = false;
    gameOverScreen.classList.add('hidden');
    pauseButton.classList.add('hidden'); // Hide buttons until game starts running
    endButton.classList.add('hidden');
    pauseButton.textContent = getTranslation('pause'); // Set initial pause button text
    stopTimer(); // Ensure timer is stopped before starting
    elapsedTime = 0;
    updateTimerDisplay();
    currentGameSpeed = initialGameSpeed; // Reset speed
    scoreMultiplier = 1; // Reset multiplier
    updateDifficultyDisplay(); // Update based on initial speed
    newHighScoreMsgElement.classList.add('hidden'); // Hide new high score message

    // 随机生成食物位置
    generateFood();

    // 绘制初始状态
    clearCanvas();
    drawFood();
    drawSnake();

    console.log("New game initialized. Canvas:", canvasSize, "Tiles:", tileCount);
}

// --- 处理开始游戏按钮点击 ---
async function handleStartGameWithName() { // Make async
    // Increment play count via API
    await incrementPlayCount(); // Wait for server confirmation before proceeding

    let nameInput = preGamePlayerNameInputElement.value.trim();
    currentPlayerName = nameInput === '' ? 'default' : nameInput;
    console.log(`Starting game as: ${currentPlayerName}`);

    // Add game control listeners only when game is about to start
    // Keyboard listener
    document.removeEventListener('keydown', handleKeyPress); // Remove first to prevent duplicates
    document.addEventListener('keydown', handleKeyPress);
    // Swipe listeners (keep for devices without visible D-pad or as alternative)
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Show D-pad only on mobile devices
    if (isMobileDevice()) {
        dpadElement.classList.remove('hidden');
        dpadElement.style.display = 'flex'; // Explicitly set display for mobile
        // Optionally hide swipe control info text on mobile
        const mobileControlInfo = document.querySelector('[data-lang-key="controlsMobile"]');
        if (mobileControlInfo) mobileControlInfo.style.display = 'none';
         const desktopControlInfo = document.querySelector('[data-lang-key="controlsDesktop"]');
        if (desktopControlInfo) desktopControlInfo.style.display = 'none'; // Hide desktop info too
    } else {
        dpadElement.classList.add('hidden');
        dpadElement.style.display = 'none'; // Explicitly set display to none for desktop
         // Ensure control info text is visible on desktop
        const mobileControlInfo = document.querySelector('[data-lang-key="controlsMobile"]');
        if (mobileControlInfo) mobileControlInfo.style.display = '';
         const desktopControlInfo = document.querySelector('[data-lang-key="controlsDesktop"]');
        if (desktopControlInfo) desktopControlInfo.style.display = '';
    }


    showGameScreen();
    startGame(); // Call the main game start logic
    applyTranslations(); // Apply translations when game screen is shown
}

// --- 返回主菜单 ---
function returnToMainMenu() {
    console.log("Returning to main menu");
    dpadElement.classList.add('hidden'); // Hide D-pad when returning to menu
    // Remove game control listeners when returning to menu
    document.removeEventListener('keydown', handleKeyPress);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);

    showStartScreen();
}


// --- 游戏启动逻辑 (被 handleStartGameWithName 调用) ---
function startGame() {
    console.log("Game starting...");
    initializeNewGame(); // Initialize board and states for the new game

    isGameRunning = true; // Set game running flag
    isGameOver = false;
    isPaused = false;

    // Show/Enable in-game buttons
    pauseButton.classList.remove('hidden');
    endButton.classList.remove('hidden');
    gameOverScreen.classList.add('hidden'); // Ensure game over screen is hidden
    translateElement(pauseButton); // Ensure pause button text is correct

    // Set initial direction (e.g., right) only if current direction is zero (start of game)
    if (direction.x === 0 && direction.y === 0) {
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
    }

    // Start game loop with current speed
    if (gameLoopInterval) clearInterval(gameLoopInterval); // Clear previous loop if any
    gameLoopInterval = setInterval(gameLoop, currentGameSpeed);
    startTimer(); // Start the timer

    // Start background music
    backgroundMusic.play().catch(e => console.error("播放背景音乐失败:", e));
}

// --- 游戏结束逻辑 ---
function endGame() {
    if (!isGameRunning && !isPaused) return; // Prevent ending if already ended or never started properly

    console.log("Game ended");
    dpadElement.classList.add('hidden'); // Hide D-pad on game over
    isGameOver = true;
    isGameRunning = false;
    isPaused = false; // Ensure not paused

    clearInterval(gameLoopInterval);
    stopTimer();

    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
    pauseButton.classList.add('hidden');
    endButton.classList.add('hidden');
    translateElement(gameOverScreen.querySelector('h2')); // Translate Game Over title
    translateElement(gameOverScreen.querySelector('[data-lang-key="finalScoreLabel"]')); // Correctly translate only the label span
    translateElement(restartButton); // Translate Return to Menu button

    // Record score to backend
    // Pass the difficulty level that was active when the game ended
    recordScore(currentPlayerName, score, currentDifficultyLevel); // Now async

    // Play sound and stop music
    gameOverSound.play().catch(e => console.error("播放 gameover 音效失败:", e));
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

// --- 清空画布 ---
function clearCanvas() {
    ctx.fillStyle = '#000'; // Use the base background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Optional: Redraw grid if needed (can impact performance)
    // drawGrid();
}

// Optional: Function to draw grid lines
// function drawGrid() {
//     ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'; // Grid color
//     ctx.lineWidth = 1;
//     for (let x = 0; x < canvas.width; x += gridSize) {
//         ctx.beginPath();
//         ctx.moveTo(x, 0);
//         ctx.lineTo(x, canvas.height);
//         ctx.stroke();
//     }
//     for (let y = 0; y < canvas.height; y += gridSize) {
//         ctx.beginPath();
//         ctx.moveTo(0, y);
//         ctx.lineTo(canvas.width, y);
//         ctx.stroke();
//     }
// }


// --- 绘制元素 ---
function drawSnake() {
    // Draw body segments first
    ctx.fillStyle = '#00cc00'; // Slightly darker green for body
    for (let i = 1; i < snake.length; i++) {
        ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 1, gridSize - 1); // Leave 1px gap
    }
    // Draw head last (on top) with brighter color and effect
    if (snake.length > 0) {
        const head = snake[0];
        ctx.fillStyle = '#00ff00'; // Bright green for head
        ctx.shadowBlur = 5;
        ctx.shadowColor = "#00ff00";
        ctx.fillRect(head.x * gridSize, head.y * gridSize, gridSize - 1, gridSize - 1);
        ctx.shadowBlur = 0; // Reset shadow
    }
}

function drawFood() {
    ctx.fillStyle = '#ff00ff'; // Neon pink
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ff00ff";
    // Draw slightly smaller than grid size for better visual separation
    const offset = 2;
    ctx.fillRect(food.x * gridSize + offset / 2, food.y * gridSize + offset / 2, gridSize - offset, gridSize - offset);
    ctx.shadowBlur = 0; // Reset shadow
}

// --- 食物生成与检查 ---
function generateFood() {
    let newFoodPosition;
    let attempts = 0;
    const maxAttempts = tileCount * tileCount; // Prevent infinite loop if snake fills screen
    do {
        newFoodPosition = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        attempts++;
    } while (isFoodOnSnake(newFoodPosition) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
        console.error("Could not place food, board might be full.");
        // Handle game end or other logic if food can't be placed
        endGame();
    } else {
        food = newFoodPosition;
    }
}

function isFoodOnSnake(position) {
    return snake.some(segment => segment.x === position.x && segment.y === position.y);
}

// --- 碰撞检测 ---
function checkCollision(head) {
    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        console.log("撞墙了!");
        return true;
    }
    // Self collision (check against segments from index 1 onwards)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            console.log("撞到自己了!");
            return true;
        }
    }
    return false;
}

// --- 游戏主循环 ---
function gameLoop() {
    if (isGameOver || !isGameRunning || isPaused) return; // Exit if game state doesn't allow update

    // Update direction based on queued input
    direction = nextDirection;

    // Calculate new head position
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Check for collisions
    if (checkCollision(head)) {
        endGame();
        return; // Stop loop execution after game over
    }

    // Move snake: Add new head
    snake.unshift(head);

    // Check for food collision
    if (head.x === food.x && head.y === food.y) {
        // Increase score
        const currentFoodScore = Math.floor(baseFoodScore * scoreMultiplier);
        score += currentFoodScore;
        scoreElement.textContent = score;

        // Generate new food
        generateFood();

        // Increase score multiplier every 5 food items eaten
        if (snake.length % 5 === 0) { // Check length *after* adding head
             scoreMultiplier += 0.1;
             console.log("分数倍率提升至:", scoreMultiplier.toFixed(1));
        }

        // Play sound
        eatSound.play().catch(e => console.error("播放 eat 音效失败:", e));
        console.log("吃到食物! 当前得分:", score);
        // Don't pop tail when food is eaten (snake grows)
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }

    // Re-draw the game state
    clearCanvas();
    drawFood();
    drawSnake();

    // Speed increase is now handled by the timer interval function (checkSpeedIncrease)
}


// --- 控制处理函数 ---
function handleKeyPress(event) {
    if (!isGameRunning || isGameOver || isPaused) return; // Ignore input if not in active play

    const key = event.key;
    let requestedDirection = null; // Use null to indicate no valid key pressed initially

    switch (key) {
        case 'ArrowUp':
        case 'w': // Add WASD support
            if (direction.y === 0) requestedDirection = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 's':
            if (direction.y === 0) requestedDirection = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'a':
            if (direction.x === 0) requestedDirection = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
            if (direction.x === 0) requestedDirection = { x: 1, y: 0 };
            break;
        case ' ': // Space bar for pause/resume
             togglePause();
             return; // Don't change direction on pause
        default:
            return; // Ignore other keys
    }

    // Queue the next direction if a valid key was pressed
    if (requestedDirection) {
        nextDirection = requestedDirection;
    }
}

// --- D-pad 处理函数 ---
function handleDPadInput(dx, dy) {
    if (!isGameRunning || isGameOver || isPaused) return; // Ignore input if not in active play

    // Prevent moving directly opposite
    if (dx !== 0 && direction.x === -dx) return;
    if (dy !== 0 && direction.y === -dy) return;

    nextDirection = { x: dx, y: dy };
}


function handleTouchStart(event) {
    // Prevent page scroll on touch devices
    event.preventDefault();
    // Only record start if one touch detected
    if (event.touches.length === 1) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchEndX = touchStartX; // Initialize end coordinates
        touchEndY = touchStartY;
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    // Update end coordinates on move
    if (event.touches.length === 1) {
        touchEndX = event.touches[0].clientX;
        touchEndY = event.touches[0].clientY;
    }
}

function handleTouchEnd(event) {
    event.preventDefault();
    if (!isGameRunning || isGameOver || isPaused) return; // Ignore input if not in active play

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Determine if the swipe was significant enough
    const swipeThreshold = 30; // Minimum pixels swiped

    if (Math.abs(deltaX) < swipeThreshold && Math.abs(deltaY) < swipeThreshold) {
        // If it's more like a tap, consider pausing/resuming
        // togglePause(); // Optional: Tap to pause
        return; // Not a significant swipe
    }

    let requestedDirection = null;

    // Determine dominant direction (horizontal vs vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && direction.x === 0) requestedDirection = { x: 1, y: 0 }; // Right
        else if (deltaX < 0 && direction.x === 0) requestedDirection = { x: -1, y: 0 }; // Left
    } else {
        // Vertical swipe
        if (deltaY > 0 && direction.y === 0) requestedDirection = { x: 0, y: 1 }; // Down
        else if (deltaY < 0 && direction.y === 0) requestedDirection = { x: 0, y: -1 }; // Up
    }

    // Queue the next direction if a valid swipe occurred
    if (requestedDirection) {
        nextDirection = requestedDirection;
    }
}

// --- 暂停/恢复函数 ---
function togglePause() {
    if (!isGameRunning || isGameOver) return; // Can't pause if game isn't running or is over

    isPaused = !isPaused;
    if (isPaused) {
        pauseButton.textContent = getTranslation('resume'); // Update button text
        backgroundMusic.pause();
        stopTimer(); // Stop game timer
        console.log("游戏已暂停");
        // Optional: Show pause overlay
        // showPauseOverlay();
    } else {
        pauseButton.textContent = getTranslation('pause'); // Update button text
        backgroundMusic.play().catch(e => console.error("恢复背景音乐失败:", e));
        startTimer(); // Resume game timer
        // Need to restart the game loop interval as well, as it was stopped by timer
        // No, gameLoop interval continues, it just returns early if paused. Timer handles time/speed.
        console.log("游戏已恢复");
        // Optional: Hide pause overlay
        // hidePauseOverlay();
    }
}

// --- 窗口大小调整处理 ---
function handleResize() {
    // Only re-initialize layout if not currently playing
    // Re-initializing during gameplay would reset the game state
    if (!isGameRunning) {
        // Re-calculate canvas size based on new parent width
        const containerWidth = canvas.parentElement.clientWidth - 4; // Adjust for border/padding
        canvasSize = Math.floor(containerWidth / gridSize) * gridSize;
        canvasSize = Math.max(canvasSize, gridSize * 10); // Ensure minimum size
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        tileCount = canvasSize / gridSize;

        // Re-draw elements that depend on canvas size if needed
        if (!startScreenElement.classList.contains('hidden')) {
             // If start screen is visible, redraw leaderboard
             renderGlobalLeaderboardPreview();
        } else if (!gameContainerElement.classList.contains('hidden') && isGameOver) {
             // If game container is visible AND game is over, redraw static elements
             clearCanvas();
             // Don't draw food/snake if game over, just clear
             // drawFood(); // Draw last food position? Maybe not needed.
             // drawSnake(); // Draw final snake position? Maybe not needed.
        } else if (!gameContainerElement.classList.contains('hidden') && !isGameRunning) {
             // If game container is visible but game hasn't started (e.g., after resize before start)
             initializeNewGame(); // Re-initialize to draw initial state correctly
        }
        console.log("Resized while not playing. Canvas updated.");
        applyTranslations(); // Re-apply translations after potential element changes
    } else {
        // Optionally handle resize during gameplay (more complex, might pause game)
        console.log("Resize detected during gameplay. Layout not updated to preserve state.");
    }
}


// --- 页面加载完成后初始化 App ---
document.addEventListener('DOMContentLoaded', initializeApp);
