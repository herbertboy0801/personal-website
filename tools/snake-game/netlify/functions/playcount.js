const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let currentPlayCount = 0;
    try {
        const store = getStore("gameState"); // Use a consistent store name
        const count = await store.get("playCount");
        currentPlayCount = count ? parseInt(count, 10) : 0; // Default to 0 if not found
        console.log("Playcount GET function invoked, count:", currentPlayCount);

    } catch (error) {
        console.error("Error getting play count from blob store:", error);
        // Return 0 but log the error, don't crash the function
        currentPlayCount = 0;
    }

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Allow requests from any origin
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ playCount: currentPlayCount }),
    };
};