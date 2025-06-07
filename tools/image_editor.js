const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
// 新增控件引用
const resizeModePercentRadio = document.getElementById('resizeModePercent');
const resizeModePixelRadio = document.getElementById('resizeModePixel');
const percentOptionsDiv = document.getElementById('percentOptions');
const pixelOptionsDiv = document.getElementById('pixelOptions');
const percentInput = document.getElementById('percentInput');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const keepAspectRatioCheckbox = document.getElementById('keepAspectRatio');

let originalImage = null; // 存储原始 Image 对象
let originalWidth = 0;
let originalHeight = 0;
let currentWidth = 0; // 当前画布/图片宽度
let currentHeight = 0; // 当前画布/图片高度

// --- 图片加载 ---
imageLoader.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'image/png') {
        alert('请选择一个 PNG 格式的图片文件。');
        imageLoader.value = ''; // 清空选择，以便可以再次选择相同文件
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        originalImage = new Image();
        originalImage.onload = () => {
            // 记录原始尺寸
            originalWidth = originalImage.width;
            originalWidth = originalImage.width;
            originalHeight = originalImage.height;
            currentWidth = originalWidth; // 初始时当前尺寸等于原始尺寸
            currentHeight = originalHeight;

            // 初始化控件值
            percentInput.value = 100;
            widthInput.value = originalWidth;
            heightInput.value = originalHeight;
            keepAspectRatioCheckbox.checked = true; // 默认保持比例
            resizeModePercentRadio.checked = true; // 默认百分比模式
            percentOptionsDiv.style.display = 'block';
            pixelOptionsDiv.style.display = 'none';

            // 绘制初始图片
            drawImageScaled(originalWidth, originalHeight);
        };
        originalImage.onerror = () => {
            alert('无法加载图片。');
            originalImage = null;
        };
        originalImage.src = e.target.result;
    };

    reader.onerror = () => {
        alert('读取文件时出错。');
        originalImage = null;
    };

    reader.readAsDataURL(file);
});

// --- 模式切换 ---
resizeModePercentRadio.addEventListener('change', () => {
    if (resizeModePercentRadio.checked) {
        percentOptionsDiv.style.display = 'block';
        pixelOptionsDiv.style.display = 'none';
        // 从当前像素值反推百分比
        if (originalWidth > 0) {
            percentInput.value = Math.round((currentWidth / originalWidth) * 100);
        }
    }
});

resizeModePixelRadio.addEventListener('change', () => {
    if (resizeModePixelRadio.checked) {
        percentOptionsDiv.style.display = 'none';
        pixelOptionsDiv.style.display = 'block';
        // 设置像素输入框为当前尺寸
        widthInput.value = Math.round(currentWidth);
        heightInput.value = Math.round(currentHeight);
    }
});

// --- 按百分比调整 ---
percentInput.addEventListener('input', () => {
    if (!originalImage) return;
    const percent = parseInt(percentInput.value, 10);
    if (isNaN(percent) || percent < 1) return;

    const scale = percent / 100;
    currentWidth = originalWidth * scale;
    currentHeight = originalHeight * scale;
    drawImageScaled(currentWidth, currentHeight);
    // 更新像素输入框（如果可见）
    if (resizeModePixelRadio.checked) {
        widthInput.value = Math.round(currentWidth);
        heightInput.value = Math.round(currentHeight);
    }
});

// --- 按像素调整 ---
widthInput.addEventListener('input', handlePixelInput);
heightInput.addEventListener('input', handlePixelInput);
keepAspectRatioCheckbox.addEventListener('change', handlePixelInput); // 切换比例保持时也需重新计算

function handlePixelInput() {
    if (!originalImage || !resizeModePixelRadio.checked) return;

    const targetWidth = parseInt(widthInput.value, 10);
    const targetHeight = parseInt(heightInput.value, 10);
    const keepRatio = keepAspectRatioCheckbox.checked;
    const aspectRatio = originalWidth / originalHeight;

    // 确定哪个输入框是最后修改的（或哪个是有效的）
    // 简单处理：优先响应宽度输入，如果保持比例则计算高度；否则独立处理
    // 更复杂的逻辑可以跟踪最后修改的输入框

    if (!isNaN(targetWidth) && targetWidth > 0) {
        currentWidth = targetWidth;
        if (keepRatio) {
            currentHeight = Math.round(targetWidth / aspectRatio);
            heightInput.value = currentHeight; // 更新另一个输入框
        } else if (!isNaN(targetHeight) && targetHeight > 0) {
            currentHeight = targetHeight;
        } else {
             // 如果高度无效且不保持比例，则根据宽度和原始比例计算高度
             currentHeight = Math.round(targetWidth / aspectRatio);
        }
    } else if (!isNaN(targetHeight) && targetHeight > 0) {
        // 如果宽度无效，但高度有效
        currentHeight = targetHeight;
        if (keepRatio) {
            currentWidth = Math.round(targetHeight * aspectRatio);
            widthInput.value = currentWidth; // 更新另一个输入框
        } else {
            // 如果宽度无效且不保持比例，则根据高度和原始比例计算宽度
            currentWidth = Math.round(targetHeight * aspectRatio);
        }
    } else {
        // 两个输入都无效，不做处理
        return;
    }

    // 确保尺寸不为0
    currentWidth = Math.max(1, Math.round(currentWidth));
    currentHeight = Math.max(1, Math.round(currentHeight));

    drawImageScaled(currentWidth, currentHeight);

    // 更新百分比输入框（如果可见）
    if (resizeModePercentRadio.checked) {
         percentInput.value = Math.round((currentWidth / originalWidth) * 100);
    }
}


// --- 绘制缩放后的图片到 Canvas (接收目标宽高) ---
function drawImageScaled(targetWidth, targetHeight) {
    if (!originalImage) return;

    // 确保宽高是有效的正数
    targetWidth = Math.max(1, Math.round(targetWidth));
    targetHeight = Math.max(1, Math.round(targetHeight));

    // 更新全局变量
    currentWidth = targetWidth;
    currentHeight = targetHeight;

    // 设置 canvas 尺寸以匹配目标图片尺寸
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 清除可能存在的旧内容
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 将原始图片绘制到调整了尺寸的 canvas 上
    ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);
}

// --- 自由选区预览 ---
let isSelecting = false;
let startX, startY;

canvas.addEventListener('mousedown', (e) => {
    if (!originalImage) return; // 没有图片则不处理
    isSelecting = true;
    // 获取鼠标相对于 canvas 的坐标
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    // 可选：立即重绘一次以清除旧选框（如果存在）
    // drawImageScaled();
});

canvas.addEventListener('mousemove', (e) => {
    if (!isSelecting || !originalImage) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // 1. 先重绘当前缩放的图片，清除上一次的矩形
    drawImageScaled();

    // 2. 绘制新的预览矩形
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'; // 半透明红色
    ctx.lineWidth = 1;
    ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
});

canvas.addEventListener('mouseup', (e) => {
    if (!isSelecting) return;
    isSelecting = false;

    // 可以在这里获取最终选区坐标 (startX, startY, currentX, currentY)
    // 但根据需求，我们只预览，所以这里不需要做额外操作
    // 最后的矩形会留在画布上，直到下一次绘制（如缩放或开始新选区）
});

// 添加 mouseleave 事件，以防止鼠标移出 canvas 时选区状态未重置
canvas.addEventListener('mouseleave', (e) => {
    if (isSelecting) {
        isSelecting = false;
        // 移出时清除选框，重绘图片
        drawImageScaled();
    }
});