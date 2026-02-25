const express = require('express');
const cors = require('cors');
const fs = require('fs').promises; // 使用 Promise 版本的 fs
const path = require('path');

const app = express();
const port = 3000; // 您可以根据需要更改端口
const dataFilePath = path.join(__dirname, 'data.json');

// --- 中间件 ---
app.use(cors()); // 允许所有来源的跨域请求 (在生产环境中可能需要更严格的配置)
app.use(express.json()); // 解析 JSON 请求体

// --- 辅助函数：读取数据文件 ---
async function readData() {
    try {
        const data = await fs.readFile(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // 如果文件不存在或读取错误，返回初始结构
        if (error.code === 'ENOENT') {
            console.log('Data file not found, returning initial structure.');
            return { scores: {}, playCount: 0 };
        }
        console.error('Error reading data file:', error);
        // 抛出错误，让调用者处理
        throw new Error('Could not read data file');
    }
}

// --- 辅助函数：写入数据文件 ---
async function writeData(data) {
    try {
        await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8'); // 使用 null, 2 美化 JSON 输出
    } catch (error) {
        console.error('Error writing data file:', error);
        // 抛出错误，让调用者处理
        throw new Error('Could not write data file');
    }
}

// --- API 路由 ---

// GET /api/leaderboard - 获取排行榜数据
app.get('/api/leaderboard', async (req, res) => {
    try {
        const data = await readData();
        // TODO: 实现排行榜逻辑 (聚合所有玩家分数，排序，取前 N 名)
        let allScores = [];
        for (const playerName in data.scores) {
            if (Object.hasOwnProperty.call(data.scores, playerName)) {
                 data.scores[playerName].forEach(entry => {
                    if (entry && typeof entry.score === 'number' && !isNaN(entry.score)) {
                        allScores.push({ name: playerName, score: entry.score, difficulty: entry.difficulty, timestamp: entry.timestamp });
                    }
                 });
            }
        }
        allScores.sort((a, b) => b.score - a.score); // 按分数降序
        const topScores = allScores.slice(0, 5); // 取前5名

        res.json(topScores);
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({ message: '获取排行榜数据失败' });
    }
});

// POST /api/score - 记录玩家得分
app.post('/api/score', async (req, res) => {
    const { playerName, score, difficulty } = req.body;

    // 基本验证
    if (!playerName || typeof score !== 'number' || isNaN(score) || score < 0) {
        return res.status(400).json({ message: '无效的玩家名称或分数' });
    }

    try {
        const data = await readData();

        // 获取或初始化该玩家的分数列表
        const playerScores = data.scores[playerName] || [];

        // 添加新分数记录
        playerScores.push({
            score: score,
            difficulty: difficulty || 'N/A', // 如果前端没传难度，给个默认值
            timestamp: Date.now()
        });

        // 可选：排序或限制每个玩家存储的分数数量
        playerScores.sort((a, b) => b.score - a.score);
        // playerScores = playerScores.slice(0, 20); // 例如，只保留前20条

        data.scores[playerName] = playerScores;

        await writeData(data);
        console.log(`Score recorded for ${playerName}: ${score}, Difficulty: ${difficulty}`);
        res.status(201).json({ message: '分数记录成功' });

    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ message: '记录分数失败' });
    }
});

// GET /api/playcount - 获取总游玩次数
app.get('/api/playcount', async (req, res) => {
     try {
        const data = await readData();
        res.json({ playCount: data.playCount || 0 });
    } catch (error) {
        console.error('Error getting play count:', error);
        res.status(500).json({ message: '获取游玩次数失败' });
    }
});

// POST /api/play - 增加游玩次数
app.post('/api/play', async (req, res) => {
    try {
        const data = await readData();
        data.playCount = (data.playCount || 0) + 1;
        await writeData(data);
        console.log(`Play count incremented to: ${data.playCount}`);
        res.status(200).json({ message: '游玩次数已增加', playCount: data.playCount });
    } catch (error) {
        console.error('Error incrementing play count:', error);
        res.status(500).json({ message: '增加游玩次数失败' });
    }
});


// --- 启动服务器 ---
app.listen(port, () => {
    console.log(`CyberSnake server listening at http://localhost:${port}`);
});

// --- 基本错误处理 ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('服务器发生错误!');
});