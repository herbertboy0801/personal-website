// assetLoader.js

/**
 * 加载图像资源
 * @param {string[]} assetUrls - 包含图像 URL 的数组
 * @returns {Promise<Object>} - 一个 Promise，解析为一个包含已加载图像的对象，键为 URL
 */
function loadAssets(assetUrls) {
    return new Promise((resolve, reject) => {
        const loadedAssets = {};
        let assetsToLoad = assetUrls.length;

        if (assetsToLoad === 0) {
            resolve(loadedAssets);
            return;
        }

        assetUrls.forEach(url => {
            const img = new Image();
            img.onload = () => {
                console.log(`Asset loaded: ${url}`);
                loadedAssets[url] = img;
                assetsToLoad--;
                if (assetsToLoad === 0) {
                    console.log('All assets loaded successfully.');
                    resolve(loadedAssets);
                }
            };
            img.onerror = (err) => {
                console.error(`Failed to load asset: ${url}`, err);
                // 即使部分失败也尝试继续，或者直接 reject
                assetsToLoad--;
                 if (assetsToLoad === 0) {
                     // 可以选择即使部分失败也 resolve，让游戏尝试运行
                     console.warn('Some assets failed to load, continuing...');
                     resolve(loadedAssets);
                 }
                 // 或者直接 reject 整个 Promise
                 // reject(new Error(`Failed to load asset: ${url}`));
            };
            img.src = url;
        });
    });
}

// 如果需要加载音频等其他资源，可以在此扩展