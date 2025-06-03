const { getStore } = require("@netlify/blobs");

// 定义存储分数的 Blob key (与 score.js 保持一致)
const SCORES_KEY = "scores";

exports.handler = async (event, context) => {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let topScores = [];
    try {
        const store = getStore("gameState"); // Use the same store name

        // 获取当前分数数据 (JSON 格式)
        let allScoresData = {};
        try {
            allScoresData = await store.getJSON(SCORES_KEY) || {};
        } catch (error) {
             console.warn(`Could not get or parse scores from blob store (key: ${SCORES_KEY}). Returning empty leaderboard. Error:`, error);
            allScoresData = {};
        }

        // 聚合所有玩家的分数
        let allScoresList = [];
        for (const playerName in allScoresData) {
            if (Object.hasOwnProperty.call(allScoresData, playerName)) {
                 allScoresData[playerName].forEach(entry => {
                    if (entry && typeof entry.score === 'number' && !isNaN(entry.score)) {
                        // 添加玩家名字到每个条目
                        allScoresList.push({
                            name: playerName,
                            score: entry.score,
                            difficulty: entry.difficulty,
                            timestamp: entry.timestamp
                        });
                    }
                 });
            }
        }

        // 按分数降序排序
        allScoresList.sort((a, b) => b.score - a.score);

        // 取前 5 名
        topScores = allScoresList.slice(0, 5);

        console.log("Leaderboard function invoked, top scores:", topScores);

    } catch (error) {
        console.error("Error generating leaderboard:", error);
        // 返回空列表但记录错误
        topScores = [];
    }

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Allow requests from any origin
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify(topScores), // 返回排行榜数据
    };
};