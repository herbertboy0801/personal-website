// 工具函数

/**
 * 生成指定范围内的随机整数
 * @param {number} min 最小值（包含）
 * @param {number} max 最大值（包含）
 * @returns {number}
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 角度转弧度
 * @param {number} degrees 角度
 * @returns {number} 弧度
 */
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * 弧度转角度
 * @param {number} radians 弧度
 * @returns {number} 角度
 */
function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

// 可以在这里添加更多通用工具函数，例如：
// - 向量操作
// - 边界碰撞检测
// - 简单的颜色转换等