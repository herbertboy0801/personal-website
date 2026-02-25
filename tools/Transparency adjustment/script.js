document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素获取 ---
    const uploadInfoSection = document.getElementById('uploadInfoSection');
    const uploadButton = document.getElementById('uploadButton'); // New upload button
    const fileInput = document.getElementById('fileInput');
    const globalSettingsSection = document.getElementById('globalSettings');
    const globalOpacitySlider = document.getElementById('globalOpacitySlider');
    const globalOpacityValue = document.getElementById('globalOpacityValue');

    const transparencyModeTabs = document.querySelectorAll('.tabs .tab-button');
    const transparencyModeInput = document.getElementById('transparencyMode');
    const opacityInput = document.getElementById('opacityInput');
    const opacitySlider = document.getElementById('opacitySlider');
    const linearOptions = document.getElementById('linearOptions');
    const radialOptions = document.getElementById('radialOptions');
    const linearAngleInput = document.getElementById('linearAngle');
    const radialCenterXInput = document.getElementById('radialCenterX');
    const radialCenterYInput = document.getElementById('radialCenterY');
    const radialRadiusInput = document.getElementById('radialRadius');

    const applyImageRadio = document.getElementById('applyImage');
    const applySelectionRadio = document.getElementById('applySelection');
    const selectionInputsContainer = document.getElementById('selectionInputs');
    const selectionHint = document.getElementById('selectionHint');
    const selectXInput = document.getElementById('selectX');
    const selectYInput = document.getElementById('selectY');
    const selectWInput = document.getElementById('selectW');
    const selectHInput = document.getElementById('selectH');

    const previewBgButtons = document.querySelectorAll('.preview-controls .btn');
    const canvasWrapper = document.getElementById('canvasWrapper');
    const canvasContainer = document.getElementById('canvasContainer');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const selectionBox = document.getElementById('selectionBox');
    // Placeholder text removed from HTML, no longer needed
    // const placeholderText = document.getElementById('placeholderText');

    // const applyButton = document.getElementById('applyButton'); // Removed as effects apply automatically
    const downloadButton = document.getElementById('downloadButton');
    const resetButton = document.getElementById('resetButton');

    // --- 状态变量 ---
    let originalImage = null;
    let originalImageData = null;
    let isDraggingSelection = false;
    let startX, startY;
    let selection = { x: 0, y: 0, w: 0, h: 0 };
    let currentPreviewImageData = null;
    let applyEffectsTimeout = null;
    let hasDragged = false; // Flag to track if user has started dragging a selection

    // --- 初始化 ---
    function initializeApp() {
        resetEditor();
        addEventListeners();
        console.log("图像透明度调节工具已初始化 (v7 - Final Polish)");
    }

    // --- 事件监听器 ---
    function addEventListeners() {
        // 图片上传
        uploadButton.addEventListener('click', () => fileInput.click()); // Connect button
        fileInput.addEventListener('change', handleFileSelect);
        canvasWrapper.addEventListener('dragover', handleDragOver);
        canvasWrapper.addEventListener('dragleave', handleDragLeave);
        canvasWrapper.addEventListener('drop', handleDrop);
        document.addEventListener('paste', handlePaste);
        // Removed placeholder click listener

        // 全局设置
        globalOpacitySlider.addEventListener('input', handleGlobalOpacityChange);

        // 参数控制
        transparencyModeTabs.forEach(tab => tab.addEventListener('click', handleTabClick));
        opacityInput.addEventListener('input', handleOpacityInputChange);
        opacitySlider.addEventListener('input', handleOpacitySliderChange);
        applyImageRadio.addEventListener('change', handleScopeChange);
        applySelectionRadio.addEventListener('change', handleScopeChange);

        // 选区手动输入
        [selectXInput, selectYInput, selectWInput, selectHInput].forEach(input => {
            input.addEventListener('input', handleManualSelectionInput);
        });

        // 预览区域交互
        canvas.addEventListener('mousedown', handleCanvasMouseDown);
        canvas.addEventListener('mousemove', handleCanvasMouseMove);
        canvas.addEventListener('mouseup', handleCanvasMouseUp);
        canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
        window.addEventListener('mouseup', handleWindowMouseUp);
        canvas.addEventListener('click', handleCanvasClick);

        // 预览背景
        previewBgButtons.forEach(button => button.addEventListener('click', handlePreviewBgChange));

        // 操作按钮
        // applyButton.addEventListener('click', applyEffects); // Removed as effects apply automatically
        downloadButton.addEventListener('click', downloadImage);
        resetButton.addEventListener('click', handleReset);
    }

    // --- 图片上传与处理 ---
    function handleDragOver(e) { e.preventDefault(); e.stopPropagation(); canvasWrapper.style.backgroundColor = '#eef2ff'; /* Show hover effect */ }
    function handleDragLeave(e) { e.preventDefault(); e.stopPropagation(); canvasWrapper.style.backgroundColor = ''; /* Reset background */ }
    function handleDrop(e) { e.preventDefault(); e.stopPropagation(); canvasWrapper.style.backgroundColor = ''; const files = e.dataTransfer.files; if (files.length > 0) { handleFile(files[0]); } else { handleDragLeave(e); } }
    function handlePaste(e) { const items = (e.clipboardData || e.originalEvent.clipboardData).items; for (let item of items) { if (item.kind === 'file' && item.type.startsWith('image/')) { handleFile(item.getAsFile()); break; } } }
    function handleFileSelect(e) { const files = e.target.files; if (files.length > 0) { handleFile(files[0]); } e.target.value = null; }
    function handleFile(file) { if (!file || !file.type.startsWith('image/')) { alert('请上传有效的图片文件！'); return; } const reader = new FileReader(); reader.onload = (e) => { const isFirstLoad = !originalImage; originalImage = new Image(); originalImage.onload = () => { if (isFirstLoad) { editorReady(); } resetCanvasAndControls(); applyEffects(); }; originalImage.onerror = () => { alert('图片加载失败！'); if (!isFirstLoad) { /* Keep editor state */ } else { resetEditor(); } }; originalImage.src = e.target.result; }; reader.onerror = () => { alert('文件读取失败！'); if (!originalImage) { resetEditor(); } }; reader.readAsDataURL(file); }


    // --- 编辑器状态切换 ---
    function editorReady() {
        uploadInfoSection.style.display = 'none';
        globalSettingsSection.style.display = 'block';
        canvasWrapper.style.cursor = 'default';
    }

    function resetEditor() {
        originalImage = null;
        originalImageData = null;
        currentPreviewImageData = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        uploadInfoSection.style.display = 'block'; // Show upload section
        globalSettingsSection.style.display = 'none';
        fileInput.value = '';
        canvasWrapper.classList.remove('has-image');
        canvasWrapper.style.cursor = 'default'; // Wrapper not clickable by default
        resetControls();
        hideSelectionBox();
        resetPreviewBackground();
        hasDragged = false; // Reset drag flag
    }

    // --- 画布与控件重置 ---
    function resetCanvasAndControls() {
        if (!originalImage) return;
        canvas.width = originalImage.naturalWidth;
        canvas.height = originalImage.naturalHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hideSelectionBox(); // Ensure box is hidden initially
        ctx.drawImage(originalImage, 0, 0);
        try {
            originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            currentPreviewImageData = new ImageData( new Uint8ClampedArray(originalImageData.data), originalImageData.width, originalImageData.height );
        } catch (e) { console.error("获取 ImageData 失败:", e); alert("无法处理此图片。"); if (originalImage) { canvasWrapper.classList.add('has-image'); } else { resetEditor(); } return; }
        selection = { x: 0, y: 0, w: 0, h: 0 }; // **Initialize selection as empty**
        updateManualSelectionInputs(); // Update inputs to reflect empty selection
        resetControls();
        canvasWrapper.classList.add('has-image');
        hasDragged = false; // Reset drag flag on new image/reset
    }

    function resetControls() {
        globalOpacitySlider.value = 100;
        globalOpacityValue.textContent = '100%';
        transparencyModeTabs.forEach((tab, index) => tab.classList.toggle('active', index === 0));
        transparencyModeInput.value = 'solid';
        opacityInput.value = 100;
        opacitySlider.value = 100;
        linearAngleInput.value = 0;
        radialCenterXInput.value = '';
        radialCenterYInput.value = '';
        radialRadiusInput.value = '';
        applyImageRadio.checked = true; // Default to '整图'
        applySelectionRadio.checked = false;
        toggleModeOptionsVisibility();
        toggleSelectionOptionsVisibility(); // Handles visibility of manual inputs and hint
        // Update manual inputs based on the current (now empty) selection state
        updateManualSelectionInputs();
    }

    // --- 全局透明度处理 ---
    function handleGlobalOpacityChange() {
        globalOpacityValue.textContent = `${globalOpacitySlider.value}%`;
        applyEffects();
    }

    // --- 参数控制交互 ---
    function handleTabClick(e) {
        transparencyModeTabs.forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');
        transparencyModeInput.value = e.target.dataset.mode;
        toggleModeOptionsVisibility();
        applyEffects();
    }

    function toggleModeOptionsVisibility() {
        const mode = transparencyModeInput.value;
        const showOptions = !applySelectionRadio.checked;
        linearOptions.style.display = showOptions && mode === 'linear' ? 'block' : 'none';
        radialOptions.style.display = showOptions && mode === 'radial' ? 'block' : 'none';
    }

    function handleOpacityInputChange() {
        let value = parseInt(opacityInput.value, 10);
        if (isNaN(value)) value = 0;
        value = Math.max(0, Math.min(100, value));
        opacityInput.value = value;
        opacitySlider.value = value;
        applyEffects();
    }

    function handleOpacitySliderChange() {
        opacityInput.value = opacitySlider.value;
        applyEffects();
    }

    function handleScopeChange() {
        toggleSelectionOptionsVisibility();
        toggleModeOptionsVisibility();
        applyEffects();
    }

    function toggleSelectionOptionsVisibility() {
        const showSelection = applySelectionRadio.checked;
        selectionInputsContainer.style.display = showSelection ? 'block' : 'none';
        selectionHint.style.display = showSelection ? 'block' : 'none';
        if (showSelection) {
            // **Only show selection box if user has dragged**
            if (hasDragged && selection.w > 0 && selection.h > 0) {
                updateSelectionBoxVisibility();
            } else {
                hideSelectionBox(); // Keep hidden initially or if selection is invalid
            }
            canvas.style.cursor = 'crosshair';
        } else {
            hideSelectionBox(); // Hide box when switching to 'image' scope
            canvas.style.cursor = 'default';
        }
    }

    // --- 选区绘制与处理 ---
    function handleCanvasMouseDown(e) {
        if (!originalImage || !applySelectionRadio.checked) return;
        isDraggingSelection = true;
        hasDragged = true; // **Set flag indicating user has started interaction**
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        startX = Math.round((e.clientX - rect.left) * scaleX);
        startY = Math.round((e.clientY - rect.top) * scaleY);
        startX = Math.max(0, Math.min(startX, canvas.width));
        startY = Math.max(0, Math.min(startY, canvas.height));
        selection = { x: startX, y: startY, w: 0, h: 0 };
        // **Show selection box immediately on mousedown**
        selectionBox.style.left = `${(startX / scaleX) + canvas.offsetLeft - canvasContainer.offsetLeft}px`;
        selectionBox.style.top = `${(startY / scaleY) + canvas.offsetTop - canvasContainer.offsetTop}px`;
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
    }

    function handleCanvasMouseMove(e) {
        if (!isDraggingSelection) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const currentX = Math.round((e.clientX - rect.left) * scaleX);
        const currentY = Math.round((e.clientY - rect.top) * scaleY);
        const constrainedX = Math.max(0, Math.min(currentX, canvas.width));
        const constrainedY = Math.max(0, Math.min(currentY, canvas.height));
        const boxX = Math.min(startX, constrainedX);
        const boxY = Math.min(startY, constrainedY);
        const boxW = Math.abs(constrainedX - startX);
        const boxH = Math.abs(constrainedY - startY);
        selection = { x: boxX, y: boxY, w: boxW, h: boxH };
        selectionBox.style.left = `${(boxX / scaleX) + canvas.offsetLeft - canvasContainer.offsetLeft}px`;
        selectionBox.style.top = `${(boxY / scaleY) + canvas.offsetTop - canvasContainer.offsetTop}px`;
        selectionBox.style.width = `${boxW / scaleX}px`;
        selectionBox.style.height = `${boxH / scaleY}px`;
        updateManualSelectionInputs();
    }

    function handleCanvasMouseUp() {
        if (!isDraggingSelection) return;
        isDraggingSelection = false;
        if (selection.w < 1 || selection.h < 1) {
            hideSelectionBox();
            selection = { x: 0, y: 0, w: 0, h: 0 }; // Reset if invalid drag
            hasDragged = false; // Reset drag flag if selection was invalid
        }
        updateManualSelectionInputs();
        applyEffects();
    }
    function handleCanvasMouseLeave() { if (isDraggingSelection) handleCanvasMouseUp(); }
    function handleWindowMouseUp() { if (isDraggingSelection) handleCanvasMouseUp(); }

    function handleCanvasClick(e) {
        if (!originalImage || isDraggingSelection) return;
        if (transparencyModeInput.value === 'radial' && !applySelectionRadio.checked) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const clickX = Math.round((e.clientX - rect.left) * scaleX);
            const clickY = Math.round((e.clientY - rect.top) * scaleY);
            radialCenterXInput.value = Math.max(0, Math.min(clickX, canvas.width));
            radialCenterYInput.value = Math.max(0, Math.min(clickY, canvas.height));
            if (!radialRadiusInput.value) { radialRadiusInput.value = Math.round(Math.min(canvas.width, canvas.height) / 4); }
            applyEffects();
        }
    }

    function hideSelectionBox() {
        selectionBox.style.display = 'none';
    }

    function updateSelectionBoxVisibility() {
        // Now also checks hasDragged flag
        if (applySelectionRadio.checked && hasDragged && selection.w > 0 && selection.h > 0) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            selectionBox.style.left = `${(selection.x / scaleX) + canvas.offsetLeft - canvasContainer.offsetLeft}px`;
            selectionBox.style.top = `${(selection.y / scaleY) + canvas.offsetTop - canvasContainer.offsetTop}px`;
            selectionBox.style.width = `${selection.w / scaleX}px`;
            selectionBox.style.height = `${selection.h / scaleY}px`;
            selectionBox.style.display = 'block';
        } else {
            hideSelectionBox();
        }
    }

    function updateManualSelectionInputs() {
        selectXInput.value = selection.x;
        selectYInput.value = selection.y;
        selectWInput.value = selection.w;
        selectHInput.value = selection.h;
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    const debouncedApplyEffects = debounce(applyEffects, 300);

    function handleManualSelectionInput() {
        if (!originalImage) return;
        const x = parseInt(selectXInput.value, 10) || 0;
        const y = parseInt(selectYInput.value, 10) || 0;
        const w = parseInt(selectWInput.value, 10) || 0;
        const h = parseInt(selectHInput.value, 10) || 0;
        const validX = Math.max(0, Math.min(x, canvas.width));
        const validY = Math.max(0, Math.min(y, canvas.height));
        const validW = Math.max(1, Math.min(w, canvas.width - validX));
        const validH = Math.max(1, Math.min(h, canvas.height - validY));
        if (w >= 1 && h >= 1) {
             selection = { x: validX, y: validY, w: validW, h: validH };
             hasDragged = true; // Consider manual input as interaction
             updateSelectionBoxVisibility();
             debouncedApplyEffects();
        } else {
             // If manual input makes selection invalid, hide box and potentially reset state
             hideSelectionBox();
             selection = { x: 0, y: 0, w: 0, h: 0 }; // Reset internal state too
             hasDragged = false;
             // Optionally apply effects immediately to show full image if selection becomes invalid
             // applyEffects();
        }
    }

    // --- 预览背景切换 ---
    function handlePreviewBgChange(e) { previewBgButtons.forEach(button => button.classList.remove('active')); e.target.classList.add('active'); const bgType = e.target.dataset.bg; canvasWrapper.classList.remove('checkerboard', 'white', 'black'); if (bgType !== 'default') { canvasWrapper.classList.add(bgType); } }
    function resetPreviewBackground() { previewBgButtons.forEach((button, index) => button.classList.toggle('active', index === 0)); canvasWrapper.classList.remove('checkerboard', 'white', 'black'); canvasWrapper.classList.add('checkerboard'); }

    // --- 核心透明度处理逻辑 ---
    function applyEffects() {
        if (!originalImageData) { console.warn("applyEffects called but originalImageData is null."); return; }
        console.log("Applying effects (Masking Selection Logic)...");

        currentPreviewImageData = new ImageData( new Uint8ClampedArray(originalImageData.data), originalImageData.width, originalImageData.height );
        const data = currentPreviewImageData.data;
        const width = currentPreviewImageData.width;
        const height = currentPreviewImageData.height;
        const paramOpacity = parseInt(opacityInput.value, 10) / 100;
        const mode = transparencyModeInput.value;
        const applyToSelection = applySelectionRadio.checked;

        let areaStartX = 0, areaStartY = 0, areaEndX = width, areaEndY = height;

        // Use the validated internal `selection` state
        if (applyToSelection) {
            const selX = Number(selection.x) || 0;
            const selY = Number(selection.y) || 0;
            const selW = Number(selection.w) || 0;
            const selH = Number(selection.h) || 0;

            // **Only apply masking if a valid selection exists (w & h >= 1)**
            if (selW >= 1 && selH >= 1 && selX >= 0 && selY >= 0 && selX + selW <= width && selY + selH <= height) {
                console.log("Applying MASKING to selection area.");
                areaStartX = selX;
                areaStartY = selY;
                areaEndX = selX + selW;
                areaEndY = selY + selH;

                for (let y = areaStartY; y < areaEndY; y++) {
                    for (let x = areaStartX; x < areaEndX; x++) {
                        const index = (y * width + x) * 4;
                        if (index + 3 < data.length) {
                            data[index + 3] = Math.round(data[index + 3] * paramOpacity);
                        }
                    }
                }
                 console.log(`Mask applied to: x=${areaStartX}, y=${areaStartY}, w=${selW}, h=${selH} with opacity ${paramOpacity}`);
            } else {
                // If selection scope is active but selection is invalid (e.g., initial load), do nothing to the data yet.
                console.log("Selection scope active, but no valid selection drawn/input yet.");
            }

        } else {
            // **FULL IMAGE SCOPE (Apply Transparency Effect)**
            console.log(`Applying effect (${mode}) to full image.`);
            try {
                if (mode === 'solid') {
                    applySolidTransparencyToData(data, width, areaStartX, areaStartY, areaEndX, areaEndY, paramOpacity);
                } else if (mode === 'linear') {
                    const angle = parseInt(linearAngleInput.value, 10);
                    if (isNaN(angle)) { console.error("Invalid linear angle"); return; }
                    applyLinearGradientTransparencyToData(data, width, height, areaStartX, areaStartY, areaEndX, areaEndY, paramOpacity, angle);
                } else if (mode === 'radial') {
                    const cx = parseInt(radialCenterXInput.value, 10);
                    const cy = parseInt(radialCenterYInput.value, 10);
                    let radius = parseInt(radialRadiusInput.value, 10);
                    if (isNaN(cx) || isNaN(cy)) { console.error("Invalid radial center"); return; }
                    if (isNaN(radius) || radius < 1) {
                        const areaW = areaEndX - areaStartX; const areaH = areaEndY - areaStartY;
                        const relativeCx = cx - areaStartX; const relativeCy = cy - areaStartY;
                        const dist1 = Math.sqrt(relativeCx**2 + relativeCy**2); const dist2 = Math.sqrt((areaW - relativeCx)**2 + relativeCy**2);
                        const dist3 = Math.sqrt(relativeCx**2 + (areaH - relativeCy)**2); const dist4 = Math.sqrt((areaW - relativeCx)**2 + (areaH - relativeCy)**2);
                        radius = Math.max(dist1, dist2, dist3, dist4, 1); radialRadiusInput.value = Math.round(radius);
                    }
                    const relativeCx = cx - areaStartX; const relativeCy = cy - areaStartY;
                    applyRadialGradientTransparencyToData(data, width, areaStartX, areaStartY, areaEndX, areaEndY, paramOpacity, relativeCx, relativeCy, radius);
                }
            } catch (error) { console.error("Error applying transparency effect:", error); alert("应用透明效果时出错，请检查参数。"); return; }
        }

        // --- Apply global opacity ---
        const globalOpacity = parseInt(globalOpacitySlider.value, 10) / 100;
        if (globalOpacity < 1.0) {
             console.log(`Applying global opacity: ${globalOpacity}`);
             for (let i = 3; i < data.length; i += 4) {
                 data[i] = Math.round(data[i] * globalOpacity);
             }
        }

        // Update Canvas display
        ctx.putImageData(currentPreviewImageData, 0, 0);
        console.log("Effects applied and canvas updated.");
    }

    // --- Specific Transparency Functions ---
    function applySolidTransparencyToData(data, width, startX, startY, endX, endY, opacity) { const originalAlphaData = originalImageData.data; for (let y = startY; y < endY; y++) { for (let x = startX; x < endX; x++) { const index = (y * width + x) * 4; if (index + 3 < originalAlphaData.length) { data[index + 3] = Math.round(originalAlphaData[index + 3] * opacity); } } } }
    function applyLinearGradientTransparencyToData(data, width, height, startX, startY, endX, endY, maxOpacity, angle) { const originalAlphaData = originalImageData.data; const rad = angle * Math.PI / 180; const cos = Math.cos(rad); const sin = Math.sin(rad); const regionW = endX - startX; const regionH = endY - startY; const centerX = startX + regionW / 2; const centerY = startY + regionH / 2; let minProj = Infinity, maxProj = -Infinity; const corners = [ {x: startX, y: startY}, {x: endX, y: startY}, {x: startX, y: endY}, {x: endX, y: endY} ]; corners.forEach(p => { const proj = (p.x - centerX) * cos + (p.y - centerY) * sin; minProj = Math.min(minProj, proj); maxProj = Math.max(maxProj, proj); }); const range = maxProj - minProj; if (range <= 0) { applySolidTransparencyToData(data, width, startX, startY, endX, endY, maxOpacity); return; } for (let y = startY; y < endY; y++) { for (let x = startX; x < endX; x++) { const index = (y * width + x) * 4; if (index + 3 < originalAlphaData.length) { const proj = (x - centerX) * cos + (y - centerY) * sin; const normalizedProj = range === 0 ? 0.5 : (proj - minProj) / range; const currentOpacity = normalizedProj * maxOpacity; data[index + 3] = Math.round(originalAlphaData[index + 3] * Math.max(0, Math.min(1, currentOpacity))); } } } }
    function applyRadialGradientTransparencyToData(data, width, startX, startY, endX, endY, maxOpacity, cx, cy, radius) { const originalAlphaData = originalImageData.data; const radiusSq = radius * radius; if (radiusSq <= 0) return; for (let y = startY; y < endY; y++) { for (let x = startX; x < endX; x++) { const index = (y * width + x) * 4; if (index + 3 < originalAlphaData.length) { const dx = (x - startX) - cx; const dy = (y - startY) - cy; const distSq = dx * dx + dy * dy; let opacityRatio = 0; if (distSq < radiusSq) { opacityRatio = 1 - Math.sqrt(distSq) / radius; } const currentOpacity = opacityRatio * maxOpacity; data[index + 3] = Math.round(originalAlphaData[index + 3] * Math.max(0, Math.min(1, currentOpacity))); } } } }

    // --- 操作按钮功能 ---
    function downloadImage() { if (!currentPreviewImageData) { alert("没有可下载的图片。"); return; } const tempCanvas = document.createElement('canvas'); const tempCtx = tempCanvas.getContext('2d'); tempCanvas.width = currentPreviewImageData.width; tempCanvas.height = currentPreviewImageData.height; tempCtx.putImageData(currentPreviewImageData, 0, 0); const link = document.createElement('a'); link.download = 'transparent_image.png'; try { link.href = tempCanvas.toDataURL('image/png'); link.click(); } catch (e) { console.error("导出 PNG 失败:", e); alert("导出 PNG 失败。错误: " + e.message); } }
    function handleReset() { if (originalImage) { resetCanvasAndControls(); applyEffects(); } else { resetEditor(); } }

    // --- 启动应用 ---
    initializeApp();
});