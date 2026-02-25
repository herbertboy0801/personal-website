const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
    // Handle OPTIONS request for CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Allow requests from any origin
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

    let newPlayCount = 0;
    try {
        const store = getStore("gameState"); // Use the same store name
        const currentCountStr = await store.get("playCount");
        const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
        newPlayCount = currentCount + 1;

        await store.set("playCount", newPlayCount.toString()); // Store as string
        console.log("Play POST function invoked, new count:", newPlayCount);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "游玩次数已增加", playCount: newPlayCount }),
        };
    } catch (error) {
        console.error('Error incrementing play count in blob store:', error);
         return {
            statusCode: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: '增加游玩次数失败' }),
        };
    }
};