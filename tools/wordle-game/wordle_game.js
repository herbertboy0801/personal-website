// 单词库
const wordLists = {
    'en-4': ['acid', 'bake', 'calf', 'dark', 'earn', 'face', 'gain', 'halt', 'idle', 'joke', 'kite', 'lava', 'maze', 'navy', 'opal', 'pace', 'quiz', 'race', 'safe', 'tale', 'unit', 'vast', 'wake', 'xray', 'yawn', 'zero'],
    'en-5': ['apple', 'baker', 'candy', 'dream', 'eagle', 'flame', 'grape', 'house', 'igloo', 'jolly', 'knife', 'lemon', 'mango', 'night', 'ocean', 'piano', 'queen', 'river', 'snake', 'table', 'umbra', 'vivid', 'whale', 'xerox', 'yacht', 'zebra', 'gross'],
    'en-6': ['abacus', 'banana', 'cactus', 'danger', 'editor', 'fabric', 'garden', 'hazard', 'island', 'jungle', 'kettle', 'ladder', 'magnet', 'needle', 'orange', 'pencil', 'quiver', 'rabbit', 'saddle', 'tablet', 'unison', 'vortex', 'window', 'xylene', 'yellow', 'zodiac'],
    'en-7': ['abandon', 'balance', 'capture', 'develop', 'elegant', 'fantasy', 'gravity', 'harmony', 'imagine', 'journey', 'kingdom', 'lantern', 'mystery', 'natural', 'operate', 'perfect', 'quality', 'rainbow', 'science', 'thunder', 'uniform', 'venture', 'whisper', 'xylitol', 'younger', 'zealous'],
    'zh-chengyu': ['画蛇添足', '守株待兔', '亡羊补牢', '刻舟求剑', '掩耳盗铃', '拔苗助长', '对牛弹琴', '狐假虎威', '井底之蛙', '滥竽充数', '买椟还珠', '南辕北辙', '杞人忧天', '塞翁失马', '愚公移山', '自相矛盾', '叶公好龙', '朝三暮四', '杯弓蛇影', '东施效颦']
};

// 游戏配置
let gameConfig = {
    language: 'en', // 'en' or 'zh'
    wordLength: 5, // 4, 5, 6, 7 (for English)
    theme: 'general', // 'general', 'animals', 'countries' (TODO: 实现主题选择)
    maxAttempts: 6,
    currentAttempt: 0,
    currentGuess: [],
    targetWord: '',
    gameEnded: false,
    highContrastMode: false
};

// 游戏统计数据
let gameStats = {
    played: 0,
    won: 0,
    guessDistribution: {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
    },
    currentStreak: 0,
    maxStreak: 0
};

// DOM 元素
const gameGrid = document.getElementById('game-grid');
const keyboard = document.getElementById('keyboard');
const newGameBtn = document.getElementById('new-game-btn');
const settingsBtn = document.getElementById('settings-btn');
const statsBtn = document.getElementById('stats-btn');
const rulesBtn = document.getElementById('rules-btn');
const hintBtn = document.getElementById('hint-btn'); // 新增提示按钮
const modalOverlay = document.getElementById('modal-overlay');
const settingsModal = document.getElementById('settings-modal');
const statsModal = document.getElementById('stats-modal');
const rulesModal = document.getElementById('rules-modal');
const resultModal = document.getElementById('result-modal');
const resultMessage = document.getElementById('result-message');
const correctWordDisplay = document.getElementById('correct-word');
const shareBtn = document.getElementById('share-btn');
const firstLetterHint = document.getElementById('first-letter-hint'); // 新增首字母提示元素

const languageSelect = document.getElementById('language-select');
const wordLengthSelect = document.getElementById('word-length-select');
const highContrastToggle = document.getElementById('high-contrast-toggle');
const gamesPlayedSpan = document.getElementById('games-played');
const gamesWonSpan = document.getElementById('games-won');
const winRateSpan = document.getElementById('win-rate');
const guessDistributionDiv = document.getElementById('guess-distribution');

// 单词定义 (简化版，实际可扩展)
const wordDefinitions = {
    'APPLE': '一种常见的水果。',
    'BAKER': '制作面包和糕点的人。',
    'CANDY': '糖果。',
    'DREAM': '睡眠时在大脑中产生的图像、声音或感觉。',
    'EAGLE': '一种大型猛禽。',
    'FLAME': '燃烧时发出的光和热。',
    'GRAPE': '一种常见的水果，通常成串生长。',
    'HOUSE': '供人居住的建筑物。',
    'IGLOO': '用冰雪块建造的圆顶形房屋。',
    'JOLLY': '快乐的，愉快的。',
    'KNIFE': '用于切割的工具。',
    'LEMON': '一种酸味的水果。',
    'MANGO': '一种热带水果。',
    'NIGHT': '白天和早晨之间的黑暗时期。',
    'OCEAN': '地球上广阔的咸水体。',
    'PIANO': '一种大型键盘乐器。',
    'QUEEN': '女王，或扑克牌中的Q。',
    'RIVER': '自然流动的淡水体。',
    'SNAKE': '一种无腿爬行动物。',
    'TABLE': '有平坦顶部和腿的家具。',
    'UMBRA': '本影，完全阴影区域。',
    'VIVID': '生动的，鲜明的。',
    'WHALE': '一种大型海洋哺乳动物。',
    'XEROX': '复印机品牌，也指复印。',
    'YACHT': '游艇。',
    'ZEBRA': '斑马。',
    'GROSS': '总的，全部的；粗俗的。', // 添加gross的定义
    '画蛇添足': '比喻做了多余的事，反而不恰当。',
    '守株待兔': '比喻死守经验，不知变通。',
    '亡羊补牢': '比喻出了问题及时补救，可以避免更大的损失。',
    '刻舟求剑': '比喻拘泥成例，不知道变通。',
    '掩耳盗铃': '比喻自己欺骗自己。',
    '拔苗助长': '比喻违反事物发展的规律，急于求成，反而坏事。',
    '对牛弹琴': '比喻对不懂道理的人讲道理，白费力气。',
    '狐假虎威': '比喻依仗别人的势力欺压人。',
    '井底之蛙': '比喻见识短浅的人。',
    '滥竽充数': '比喻没有真才实学的人混在行家里面充数。',
    '买椟还珠': '比喻没有眼力，取舍不当。',
    '南辕北辙': '比喻行动和目的正好相反。',
    '杞人忧天': '比喻不必要的或缺乏根据的忧虑。',
    '塞翁失马': '比喻坏事可以引出好的结果，好事也可以引出坏的结果。',
    '愚公移山': '比喻坚持不懈地改造自然和克服困难。',
    '自相矛盾': '比喻言行前后抵触。',
    '叶公好龙': '比喻口头上说爱好某事物，实际上却并非真正爱好。',
    '朝三暮四': '比喻反复无常，也比喻玩弄手法欺骗人。',
    '杯弓蛇影': '比喻疑神疑鬼，自相惊扰。',
    '东施效颦': '比喻胡乱模仿，效果很坏。'
};


// 初始化游戏
function initializeGame() {
    gameConfig.currentAttempt = 0;
    gameConfig.currentGuess = []; // 确保清空当前猜测
    gameConfig.gameEnded = false;
    gameGrid.innerHTML = '';
    keyboard.innerHTML = '';
    resetKeyboardColors();
    loadGameConfig(); // 加载配置
    loadGameStats(); // 加载统计
    selectTargetWord();
    // 设置CSS变量，用于动态调整方块宽度
    document.documentElement.style.setProperty('--word-length', gameConfig.targetWord.length);
    createGrid();
    createKeyboard();
    updateGrid(); // 确保初始网格显示正确
    hideAllModals();
    updateFirstLetterHint(); // 更新首字母提示
}

// 加载游戏配置
function loadGameConfig() {
    const savedConfig = JSON.parse(localStorage.getItem('wordleGameConfig')) || {};
    // 仅加载与游戏配置相关的设置，不包括当前猜测状态
    gameConfig.language = savedConfig.language || gameConfig.language;
    gameConfig.wordLength = savedConfig.wordLength || gameConfig.wordLength;
    gameConfig.highContrastMode = savedConfig.highContrastMode || gameConfig.highContrastMode;

    languageSelect.value = gameConfig.language;
    wordLengthSelect.value = gameConfig.wordLength;
    highContrastToggle.checked = gameConfig.highContrastMode;
    applyHighContrastMode(gameConfig.highContrastMode);

    // 根据语言模式禁用或启用单词长度选择
    wordLengthSelect.disabled = gameConfig.language === 'zh';
}

// 保存游戏配置
function saveGameConfig() {
    localStorage.setItem('wordleGameConfig', JSON.stringify(gameConfig));
}

// 加载游戏统计
function loadGameStats() {
    const savedStats = JSON.parse(localStorage.getItem('wordleGameStats')) || {};
    gameStats = { ...gameStats, ...savedStats };
    updateStatsDisplay();
}

// 保存游戏统计
function saveGameStats() {
    localStorage.setItem('wordleGameStats', JSON.stringify(gameStats));
}

// 更新统计显示
function updateStatsDisplay() {
    gamesPlayedSpan.textContent = gameStats.played;
    gamesWonSpan.textContent = gameStats.won;
    const winRate = gameStats.played === 0 ? 0 : ((gameStats.won / gameStats.played) * 100).toFixed(1);
    winRateSpan.textContent = `${winRate}%`;

    guessDistributionDiv.innerHTML = '';
    for (let i = 1; i <= gameConfig.maxAttempts; i++) {
        const count = gameStats.guessDistribution[i] || 0;
        const totalGuesses = Object.values(gameStats.guessDistribution).reduce((sum, val) => sum + val, 0);
        const percentage = totalGuesses === 0 ? 0 : (count / totalGuesses) * 100;

        const barContainer = document.createElement('div');
        barContainer.classList.add('guess-bar-container');
        barContainer.innerHTML = `
            <div class="guess-label">${i}</div>
            <div class="guess-bar">
                <div class="guess-fill" style="width: ${percentage}%;"></div>
            </div>
            <div class="guess-count">${count}</div>
        `;
        guessDistributionDiv.appendChild(barContainer);
    }
}

// 选择目标单词
function selectTargetWord() {
    let words;
    if (gameConfig.language === 'en') {
        words = wordLists[`en-${gameConfig.wordLength}`];
    } else {
        words = wordLists['zh-chengyu'];
    }
    gameConfig.targetWord = words[Math.floor(Math.random() * words.length)].toUpperCase();
    console.log('目标单词:', gameConfig.targetWord); // 方便调试
    updateFirstLetterHint(); // 更新首字母提示
}

// 创建游戏网格
function createGrid() {
    gameGrid.style.gridTemplateColumns = `repeat(${gameConfig.targetWord.length}, 1fr)`;
    for (let i = 0; i < gameConfig.maxAttempts; i++) {
        const row = document.createElement('div');
        row.classList.add('row');
        for (let j = 0; j < gameConfig.targetWord.length; j++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            row.appendChild(tile);
        }
        gameGrid.appendChild(row);
    }
}

// 创建虚拟键盘
function createKeyboard() {
    const keyboardLayout = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];

    // 中文键盘布局 (简化版，可扩展为拼音或手写输入)
    const chineseKeyboardLayout = [
        ['画', '守', '亡', '刻', '掩', '拔', '对', '狐', '井', '滥'],
        ['买', '南', '杞', '塞', '愚', '自', '叶', '朝', '杯', '东'],
        ['ENTER', '添', '株', '牢', '求', '盗', '助', '弹', '假', '底', 'BACKSPACE']
    ];

    const currentKeyboardLayout = gameConfig.language === 'en' ? keyboardLayout : chineseKeyboardLayout;

    keyboard.innerHTML = ''; // 清空现有键盘
    currentKeyboardLayout.forEach(rowKeys => {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('keyboard-row');
        rowKeys.forEach(keyText => {
            const keyButton = document.createElement('button');
            keyButton.classList.add('key');
            keyButton.textContent = keyText;
            if (keyText === 'ENTER' || keyText === 'BACKSPACE') {
                keyButton.classList.add('large');
            }
            keyButton.addEventListener('click', () => handleKeyPress(keyText));
            rowDiv.appendChild(keyButton);
        });
        keyboard.appendChild(rowDiv);
    });
}

// 重置键盘颜色
function resetKeyboardColors() {
    const keys = keyboard.querySelectorAll('.key');
    keys.forEach(key => {
        key.classList.remove('correct', 'present', 'absent');
    });
}

// 处理按键输入
function handleKeyPress(key) {
    if (gameConfig.gameEnded) return;

    if (key === 'ENTER') {
        if (gameConfig.currentGuess.length === gameConfig.targetWord.length) {
            checkGuess();
        } else {
            showMessage('单词长度不足！');
        }
    } else if (key === 'BACKSPACE') {
        gameConfig.currentGuess.pop();
        updateGrid();
    } else if (gameConfig.currentGuess.length < gameConfig.targetWord.length) {
        gameConfig.currentGuess.push(key);
        updateGrid();
    }
}

// 更新网格显示
function updateGrid() {
    const currentRow = gameGrid.children[gameConfig.currentAttempt];
    for (let i = 0; i < gameConfig.targetWord.length; i++) {
        const tile = currentRow.children[i];
        tile.textContent = gameConfig.currentGuess[i] || '';
    }
}

// 检查猜测
function checkGuess() {
    const guessWord = gameConfig.currentGuess.join('');
    const targetWord = gameConfig.targetWord;
    const currentRowTiles = gameGrid.children[gameConfig.currentAttempt].children;

    const letterStatus = Array(targetWord.length).fill(''); // 'correct', 'present', 'absent'
    const targetLetters = targetWord.split('');
    const guessLetters = guessWord.split('');

    // 第一次遍历：找出正确位置的字母 (绿色)
    for (let i = 0; i < targetWord.length; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            letterStatus[i] = 'correct';
            targetLetters[i] = null; // 标记已匹配
            guessLetters[i] = null; // 标记已匹配
        }
    }

    // 第二次遍历：找出包含但位置不正确的字母 (黄色)
    for (let i = 0; i < targetWord.length; i++) {
        if (guessLetters[i] !== null) {
            const targetIndex = targetLetters.indexOf(guessLetters[i]);
            if (targetIndex !== -1) {
                letterStatus[i] = 'present';
                targetLetters[targetIndex] = null; // 标记已匹配
            } else {
                letterStatus[i] = 'absent'; // 不包含该字母 (灰色)
            }
        }
    }

    // 更新网格和键盘颜色，并添加翻转动画
    for (let i = 0; i < targetWord.length; i++) {
        const tile = currentRowTiles[i];
        tile.textContent = gameConfig.currentGuess[i]; // 先设置文本
        // 添加翻转动画
        setTimeout(() => {
            tile.classList.add('flip-in');
            tile.classList.add(letterStatus[i]); // 动画结束后添加颜色
            updateKeyboardColor(gameConfig.currentGuess[i], letterStatus[i]); // 恢复键盘颜色更新
        }, i * 100); // 错开动画时间
    }

    // 在动画结束后检查是否为有效单词
    setTimeout(() => {
        if (!isValidWord(guessWord)) {
            showMessage('不是一个有效单词！');
            // 不返回，继续游戏流程，只是给出提示
        }

        if (guessWord === targetWord) {
            gameEnded(true);
        } else if (gameConfig.currentAttempt === gameConfig.maxAttempts - 1) {
            gameEnded(false);
        } else {
            gameConfig.currentAttempt++;
            gameConfig.currentGuess = [];
        }
    }, targetWord.length * 100 + 300); // 等待动画完成
}

// 验证单词是否有效
function isValidWord(word) {
    let words;
    if (gameConfig.language === 'en') {
        words = wordLists[`en-${gameConfig.wordLength}`];
        return words.includes(word.toLowerCase()); // 英文单词库是小写，输入也转小写
    } else {
        words = wordLists['zh-chengyu'];
        return words.includes(word); // 中文成语库是原样，输入也原样
    }
}

// 更新键盘颜色
function updateKeyboardColor(key, status) {
    // 查找包含特定文本的按键，这里需要更健壮的查找方式
    // 因为 Element.prototype.contains 是非标准的
    const keyButton = Array.from(keyboard.querySelectorAll('.key')).find(btn => btn.textContent === key);

    if (keyButton) {
        // 优先级：正确 > 存在 > 不存在
        // 如果当前按键已经是绿色，则不更新
        if (keyButton.classList.contains('correct')) {
            return;
        }
        // 如果当前按键是黄色，且新状态不是绿色，则不更新
        if (keyButton.classList.contains('present') && status !== 'correct') {
            return;
        }

        keyButton.classList.remove('correct', 'present', 'absent');
        keyButton.classList.add(status);
    }
}

// 游戏结束
function gameEnded(isWin) {
    gameConfig.gameEnded = true;
    gameStats.played++;
    if (isWin) {
        gameStats.won++;
        gameStats.currentStreak++;
        if (gameStats.currentStreak > gameStats.maxStreak) {
            gameStats.maxStreak = gameStats.currentStreak;
        }
        gameStats.guessDistribution[gameConfig.currentAttempt + 1]++; // 记录猜测次数
        resultMessage.textContent = '恭喜你，猜对了！';
    } else {
        gameStats.currentStreak = 0;
        resultMessage.textContent = '游戏结束，很遗憾！';
    }
    correctWordDisplay.textContent = `正确答案是：${gameConfig.targetWord}。`;
    if (wordDefinitions[gameConfig.targetWord]) {
        correctWordDisplay.textContent += ` 定义：${wordDefinitions[gameConfig.targetWord]}`;
    }
    saveGameStats();
    updateStatsDisplay();
    showModal(resultModal);
}

// 显示消息提示 (例如：单词长度不足，不是有效单词)
function showMessage(msg) {
    // TODO: 实现更友好的消息提示，例如短暂的Toast通知
    alert(msg);
}

// 模态框控制
function showModal(modalElement) {
    modalOverlay.classList.add('visible');
    modalElement.classList.add('visible');
}

function hideModal(modalElement) {
    modalElement.classList.remove('visible');
    modalOverlay.classList.remove('visible');
}

function hideAllModals() {
    settingsModal.classList.remove('visible');
    statsModal.classList.remove('visible');
    rulesModal.classList.remove('visible');
    resultModal.classList.remove('visible');
    modalOverlay.classList.remove('visible');
}

// 应用高对比度模式
function applyHighContrastMode(enable) {
    if (enable) {
        document.body.classList.add('high-contrast');
    } else {
        document.body.classList.remove('high-contrast');
    }
}

// 更新首字母提示
function updateFirstLetterHint() {
    if (gameConfig.language === 'en') {
        firstLetterHint.textContent = `首字母: ${gameConfig.targetWord.charAt(0)}`;
    } else {
        firstLetterHint.textContent = `首字: ${gameConfig.targetWord.charAt(0)}`;
    }
}

// 提示功能
function provideHint() {
    if (gameConfig.gameEnded) return;

    const currentRowTiles = gameGrid.children[gameConfig.currentAttempt].children;
    const targetWord = gameConfig.targetWord;
    let currentGuessLetters = [...gameConfig.currentGuess]; // 使用副本，避免直接修改

    // 找到一个未猜对的字母位置
    let hintIndex = -1;
    const availableIndices = [];
    for (let i = 0; i < targetWord.length; i++) {
        // 只有当当前格子为空或不正确时才提供提示
        if (!currentGuessLetters[i] || currentGuessLetters[i] !== targetWord[i]) {
            availableIndices.push(i);
        }
    }

    if (availableIndices.length > 0) {
        hintIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        
        // 填充提示字母
        gameConfig.currentGuess[hintIndex] = targetWord[hintIndex];
        updateGrid();
        showMessage(`提示：第 ${hintIndex + 1} 个字母是 '${targetWord[hintIndex]}'`);
    } else {
        showMessage('没有可用的提示了！');
    }
}

// 绑定事件
newGameBtn.addEventListener('click', initializeGame);

settingsBtn.addEventListener('click', () => showModal(settingsModal));
statsBtn.addEventListener('click', () => showModal(statsModal));
rulesBtn.addEventListener('click', () => showModal(rulesModal));
hintBtn.addEventListener('click', provideHint); // 绑定提示按钮事件

modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
        hideAllModals();
    }
});

document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', hideAllModals);
});

languageSelect.addEventListener('change', (event) => {
    gameConfig.language = event.target.value;
    wordLengthSelect.disabled = gameConfig.language === 'zh';
    saveGameConfig();
    initializeGame();
});

wordLengthSelect.addEventListener('change', (event) => {
    gameConfig.wordLength = parseInt(event.target.value);
    saveGameConfig();
    initializeGame();
});

highContrastToggle.addEventListener('change', (event) => {
    gameConfig.highContrastMode = event.target.checked;
    applyHighContrastMode(gameConfig.highContrastMode);
    saveGameConfig();
});

shareBtn.addEventListener('click', () => {
    const shareText = `我刚刚在单词拼图游戏中猜出了单词 "${gameConfig.targetWord}"！\n我在第 ${gameConfig.currentAttempt + 1} 次尝试中成功。\n快来挑战吧！`;
    navigator.clipboard.writeText(shareText).then(() => {
        showMessage('结果已复制到剪贴板！');
    }).catch(err => {
        console.error('复制失败:', err);
        showMessage('复制失败，请手动复制。');
    });
});


document.addEventListener('keydown', (event) => {
    if (gameConfig.gameEnded && event.key !== 'Escape') return; // 游戏结束只允许Esc关闭模态框

    if (modalOverlay.classList.contains('visible') && event.key === 'Escape') {
        hideAllModals();
        return;
    }

    const key = event.key.toUpperCase();
    // 允许英文或中文输入
    const isEnglishLetter = key.length === 1 && key >= 'A' && key <= 'Z';
    const isChineseChar = gameConfig.language === 'zh' && key.length === 1 && wordLists['zh-chengyu'].some(word => word.includes(key)); // 简单判断是否为中文成语中的字

    if (isEnglishLetter || isChineseChar) {
        handleKeyPress(key);
    } else if (key === 'ENTER') {
        handleKeyPress('ENTER');
    } else if (key === 'BACKSPACE') {
        handleKeyPress('BACKSPACE');
    }
});

// 初始加载
initializeGame();

// 辅助函数：用于querySelector查找包含特定文本的元素
// 注意：Element.prototype.contains 是非标准的，已替换为更健壮的查找方式
// 移除旧的非标准辅助函数