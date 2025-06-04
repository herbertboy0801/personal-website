const { getStore } = require("@netlify/blobs");

// 定义存储分数的 Blob key
const SCORES_KEY = "scores";

exports.handler = async (event, context) => {
    // Handle OPTIONS request for CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: '',
        };
    }

    // Handle POST request
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { playerName, score, difficulty } = body;

        // Basic validation
        if (!playerName || typeof score !== 'number' || isNaN(score) || score < 0) {
             return {
                statusCode: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ message: '无效的玩家名称或分数' })
             };
        }

        const store = getStore("gameState"); // Use the same store name

        // 获取当前分数数据 (JSON 格式)
        let allScoresData = {};
        try {
            // Netlify Blobs store JSON directly if you use setJSON/getJSON
            allScoresData = await store.getJSON(SCORES_KEY) || {};
        } catch (error) {
            // If key doesn't exist or data is invalid JSON, start fresh
            console.warn(`Could not get or parse scores from blob store (key: ${SCORES_KEY}). Initializing. Error:`, error);
            allScoresData = {};
        }


        // 获取或初始化该玩家的分数列表
        const playerScores = allScoresData[playerName] || [];

        // 添加新分数记录
        playerScores.push({
            score: score,
            difficulty: difficulty || 'N/A',
            timestamp: Date.now()
        });

        // 可选：排序或限制每个玩家存储的分数数量
        playerScores.sort((a, b) => b.score - a.score);
        // playerScores = playerScores.slice(0, 20); // 例如，只保留前20条

        allScoresData[playerName] = playerScores;

        // 将更新后的完整分数数据写回 Blob Store
        await store.setJSON(SCORES_KEY, allScoresData);

        console.log(`Score function invoked for ${playerName}: ${score}, Difficulty: ${difficulty}. Scores saved.`);

        return {
            statusCode: 201, // Created
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "分数记录成功" }),
        };
    } catch (error) {
        console.error('Error processing score request:', error);
         return {
            statusCode: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: '记录分数失败' }),
        };
    }
};