// --- 全局变量 ---
let diaryData = {}; // 全局存储日记内容 { 'YYYY-MM-DD': { harvest: '...', plan: '...' } }
// let manualCurrentDay = 1; // 不再使用，改为基于参考日期计算
let referenceDate = '2025-06-04'; // 全局存储参考日期
let referenceDayNumber = 80; // 全局存储参考日期对应的日更天数
let goals = { targetDays: 30, reward: '一次旅行' }; // 全局目标
let reminderTime = null; // 全局存储用户设置的提醒时间 'HH:MM'
let countdownInterval = null; // 全局存储倒计时定时器
let historyCalendarInstance = null; // 全局 Flatpickr 实例
let isLocked = true; // 新增：编辑锁定状态，默认为 true (锁定)
const unlockPassword = "123456"; // 新增：解锁密码 (非常不安全)

// --- 全局函数 ---

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
    if (!(date instanceof Date)) {
        try {
            date = new Date(date); // 尝试转换
        } catch (e) {
             console.error("Invalid date object received in formatDate:", date, e);
             return null;
        }
    }
    // 再次检查转换后的日期是否有效
    if (isNaN(date.getTime())) {
        console.error("Invalid date after conversion in formatDate:", date);
        return null;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 打开历史回顾模态框
function openHistoryModal() {
    const historyModal = document.getElementById('history-modal');
    const historyCalendarContainer = document.getElementById('history-calendar-container');
    if (!historyModal || !historyCalendarContainer) return; // 确保元素存在

    // 使用全局 diaryData
    const sortedHistoryDates = Object.keys(diaryData).sort((a, b) => new Date(b) - new Date(a));
    const todayDateString = formatDate(new Date()); // 使用全局 formatDate
    let initialIndex = 0;

    const todayIndex = sortedHistoryDates.indexOf(todayDateString);
    if (todayIndex !== -1) {
        initialIndex = todayIndex;
    } else if (sortedHistoryDates.length === 0) {
        // 处理无历史记录的情况
        const historyModalDateElem = document.getElementById('history-modal-date');
        const historyModalContentElem = document.getElementById('history-modal-content');
        const prevBtn = document.getElementById('history-prev-page');
        const nextBtn = document.getElementById('history-next-page');
        const indicator = document.getElementById('history-page-indicator');
        const bookContainer = historyModal.querySelector('.book'); // 获取书本容器以便清空

        // 清空可能存在的旧页面
        if(bookContainer) bookContainer.innerHTML = '';

        // 更新显示内容
        const noHistoryPage = document.createElement('div');
        noHistoryPage.classList.add('page'); // 保持页面结构
        noHistoryPage.style.opacity = '1'; // 直接可见
        noHistoryPage.innerHTML = `
            <h4 id="history-modal-date">无历史记录</h4>
            <div id="history-modal-content-container">
                <div id="history-modal-content"><p>您还没有保存任何日记。</p></div>
            </div>`;
        if(bookContainer) bookContainer.appendChild(noHistoryPage);


        // if(historyModalDateElem) historyModalDateElem.textContent = '无历史记录'; // 不再需要，内容在页面内
        // if(historyModalContentElem) historyModalContentElem.innerHTML = '<p>您还没有保存任何日记。</p>'; // 不再需要

        if(prevBtn) prevBtn.disabled = true;
        if(nextBtn) nextBtn.disabled = true;
        if(indicator) indicator.textContent = '0 / 0';

        if (historyCalendarInstance) historyCalendarInstance.destroy();
        historyCalendarInstance = flatpickr(historyCalendarContainer, {
            inline: true,
            locale: 'zh',
            enable: [],
            defaultDate: new Date(),
            onDayCreate: function(dObj, dStr, fp, dayElem) {
                if (formatDate(dayElem.dateObj) === todayDateString) { // 使用全局 formatDate
                    dayElem.classList.add("today-in-history");
                }
            }
        });
        historyModal.classList.add('modal-visible');
        historyModal.dataset.sortedDates = JSON.stringify([]);
        historyModal.dataset.currentIndex = -1;
        return;
    }

    // 显示初始页面
    displayHistoryPage(initialIndex, sortedHistoryDates, null); // 使用全局 displayHistoryPage

    // 初始化 Flatpickr
    if (historyCalendarInstance) historyCalendarInstance.destroy();
    historyCalendarInstance = flatpickr(historyCalendarContainer, {
        inline: true,
        locale: 'zh',
        enable: Object.keys(diaryData), // 使用全局 diaryData
        defaultDate: sortedHistoryDates[initialIndex],
        onDayCreate: function(dObj, dStr, fp, dayElem) {
            const dateStr = formatDate(dayElem.dateObj); // 使用全局 formatDate
            if (diaryData[dateStr]) { // 使用全局 diaryData
                dayElem.classList.add("has-diary");
            }
        },
        onChange: function(selectedDates, dateStr, instance) {
            const selectedDateStr = formatDate(selectedDates[0]); // 使用全局 formatDate
            const newIndex = sortedHistoryDates.indexOf(selectedDateStr);
            if (newIndex !== -1) {
                // 获取当前索引判断翻页方向
                const historyModal = document.getElementById('history-modal');
                const currentIndex = parseInt(historyModal?.dataset.currentIndex || '0', 10);
                const direction = newIndex > currentIndex ? 'prev' : (newIndex < currentIndex ? 'next' : null);
                displayHistoryPage(newIndex, sortedHistoryDates, direction); // 使用全局 displayHistoryPage
            }
        }
    });

    historyModal.classList.add('modal-visible');
    historyModal.dataset.sortedDates = JSON.stringify(sortedHistoryDates);
    historyModal.dataset.currentIndex = initialIndex;

    // 更新弹窗内的目标进度显示 - 稍后在 updateGoalProgress 中处理天数计算
    updateGoalProgress();

    // 动态绑定翻页按钮事件 (确保每次打开都重新绑定到最新按钮)
    const prevBtn = document.getElementById('history-prev-page');
    const nextBtn = document.getElementById('history-next-page');
    // 移除旧监听器（通过克隆替换）
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    // 添加新监听器
    newPrevBtn.addEventListener('click', showPreviousHistoryPage); // 使用全局 showPreviousHistoryPage
    newNextBtn.addEventListener('click', showNextHistoryPage); // 使用全局 showNextHistoryPage
}

// 关闭历史回顾模态框
function closeHistoryModal() {
    const historyModal = document.getElementById('history-modal');
    if (historyModal) {
        historyModal.classList.remove('modal-visible');
        delete historyModal.dataset.sortedDates;
        delete historyModal.dataset.currentIndex;
    }
    if (historyCalendarInstance) {
        historyCalendarInstance.destroy();
        historyCalendarInstance = null;
    }
}

// 显示指定索引的历史日记页面，并处理动画
function displayHistoryPage(index, sortedDates, direction = null) {
    const historyModal = document.getElementById('history-modal');
    const bookContainer = historyModal?.querySelector('.book'); // 安全访问
    if (!historyModal || !bookContainer || !sortedDates || index < 0 || index >= sortedDates.length) return;

    const dateString = sortedDates[index];
    const entry = diaryData[dateString]; // 使用全局 diaryData

    const oldPage = bookContainer.querySelector('.page');

    const newPage = document.createElement('div');
    newPage.classList.add('page');
    if (direction === 'prev') {
        newPage.classList.add('hidden-right');
        newPage.style.transformOrigin = 'left center';
    } else if (direction === 'next') {
        newPage.classList.add('hidden-left');
        newPage.style.transformOrigin = 'right center';
    } else {
        newPage.style.opacity = '1';
        newPage.style.transform = 'rotateY(0deg)';
    }

    const dateObj = new Date(dateString + 'T00:00:00'); // 确保时间部分为0
    const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;

    let contentHtml = `<h4 id="history-modal-date">${formattedDate}</h4>`;
    contentHtml += `<div id="history-modal-content-container"><div id="history-modal-content">`;
    if (entry && typeof entry === 'object') {
        contentHtml += `<h3><span class="icon">⚙️</span> 今日收获：</h3><div>${entry.harvest || ''}</div>`;
        contentHtml += `<h3><span class="icon">📝</span> 后续计划：</h3><div>${entry.plan || ''}</div>`;
        contentHtml += `<h3><span class="icon">💖</span> 感恩：</h3><div>${entry.gratitude || ''}</div>`;
        contentHtml += `<h3><span class="icon">📈</span> 定投：</h3><div>${entry.investment || ''}</div>`;
        contentHtml += `<h3><span class="icon">🔗</span> 与我链接：</h3><div>${entry.connect || ''}</div>`;
    } else {
        contentHtml += '<p>该日期无内容。</p>';
    }
    contentHtml += `</div></div>`;
    newPage.innerHTML = contentHtml;

    // --- 处理旧页面动画和移除 ---
    if (oldPage && direction) {
        // 正在翻页，为旧页面添加 'out' 动画
        if (direction === 'prev') {
            oldPage.style.transformOrigin = 'left center';
            oldPage.classList.add('page-turning-out-left');
        } else {
            oldPage.style.transformOrigin = 'right center';
            oldPage.classList.add('page-turning-out-right');
        }
        // 动画结束后移除旧页面
        oldPage.addEventListener('transitionend', () => {
            // 再次检查父节点，防止重复移除或移除已不存在的节点
            if (oldPage.parentNode === bookContainer) {
                bookContainer.removeChild(oldPage);
            }
        }, { once: true });
    } else if (oldPage) {
        // 初始加载或无方向时，如果存在旧页面，直接移除
        bookContainer.removeChild(oldPage);
    }


    // --- 添加新页面并启动进入动画 ---
    bookContainer.appendChild(newPage);

    if (direction) {
        // 强制浏览器重绘，确保初始状态生效
        void newPage.offsetHeight;
        // 移除 hidden 类，触发进入动画
        if (direction === 'prev') {
            newPage.classList.remove('hidden-right');
        } else {
            newPage.classList.remove('hidden-left');
        }
    }

    // --- 更新导航和状态 ---
    const historyPrevPageBtn = document.getElementById('history-prev-page');
    const historyNextPageBtn = document.getElementById('history-next-page');
    const historyPageIndicator = document.getElementById('history-page-indicator');

    if(historyPageIndicator) historyPageIndicator.textContent = `${index + 1} / ${sortedDates.length}`;
    if(historyPrevPageBtn) historyPrevPageBtn.disabled = index >= sortedDates.length - 1; // 到达最旧的
    if(historyNextPageBtn) historyNextPageBtn.disabled = index <= 0; // 到达最新的
    if(historyModal) historyModal.dataset.currentIndex = index;

    if (historyCalendarInstance) {
        historyCalendarInstance.setDate(dateString, false); // false 表示不触发 onChange
    }
}

// 显示上一页历史日记 (更早的日期)
function showPreviousHistoryPage() {
    const historyModal = document.getElementById('history-modal');
    if (!historyModal || !historyModal.dataset.sortedDates || historyModal.dataset.currentIndex === undefined) return;

    let currentIndex = parseInt(historyModal.dataset.currentIndex, 10);
    const sortedDates = JSON.parse(historyModal.dataset.sortedDates);

    if (!isNaN(currentIndex) && currentIndex < sortedDates.length - 1) {
        currentIndex++;
        displayHistoryPage(currentIndex, sortedDates, 'prev'); // 使用全局 displayHistoryPage
    }
}

// 显示下一页历史日记 (更新的日期)
function showNextHistoryPage() {
    const historyModal = document.getElementById('history-modal');
    if (!historyModal || !historyModal.dataset.sortedDates || historyModal.dataset.currentIndex === undefined) return;

    let currentIndex = parseInt(historyModal.dataset.currentIndex, 10);
    const sortedDates = JSON.parse(historyModal.dataset.sortedDates);

    if (!isNaN(currentIndex) && currentIndex > 0) {
        currentIndex--;
        displayHistoryPage(currentIndex, sortedDates, 'next'); // 使用全局 displayHistoryPage
    }
}


// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素获取 ---
    // const diaryTitleDate = document.getElementById('diary-title-date'); // 已移除，改为 dateDayCountDisplay
    const dateDayCountDisplay = document.getElementById('date-day-count-display'); // 新增，用于横幅中的日期/天数
    const goalProgress = document.getElementById('goal-progress'); // 这个 ID 似乎不再使用，但保留以防万一
    const sectionHarvest = document.getElementById('section-harvest');
    const sectionPlan = document.getElementById('section-plan');
    const sectionGratitude = document.getElementById('section-gratitude');
    const sectionInvestment = document.getElementById('section-investment');
    const sectionConnect = document.getElementById('section-connect');
    const boldBtn = document.getElementById('bold-btn');
    const colorBtn = document.getElementById('color-btn');
    const colorPicker = document.getElementById('color-picker');
    const saveBtn = document.getElementById('save-diary');
    const copyContentBtn = document.getElementById('copy-diary-content-btn');
    const pasteContentBtn = document.getElementById('paste-diary-content-btn');
    const saveStatus = document.getElementById('save-status');
    // 更新 ID 以匹配页脚中的元素
    const targetDaysInput = document.getElementById('target-days-footer');
    const rewardInput = document.getElementById('reward-footer');
    const saveGoalBtn = document.getElementById('save-goal-footer');
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    const reminderTimeInput = document.getElementById('reminder-time-input');
    const saveReminderTimeBtn = document.getElementById('save-reminder-time');
    const setReminderTimeDisplay = document.getElementById('set-reminder-time-display');
    const reminderCountdownSpan = document.getElementById('reminder-countdown');
    // 移除旧的日更天数设置元素引用
    // const currentDayInput = document.getElementById('current-day-input');
    // const saveCurrentDayBtn = document.getElementById('save-current-day');
    // 新增：获取参考日期和天数设置元素 (假设 HTML 中已添加)
    const referenceDateInput = document.getElementById('reference-date-input');
    const referenceDayNumberInput = document.getElementById('reference-day-number-input');
    const saveReferenceDateBtn = document.getElementById('save-reference-date-btn');
    const importDiaryJsonBtn = document.getElementById('import-diary-json-btn'); // 新增：获取导入按钮
    const importFileInput = document.getElementById('import-file-input'); // 新增：获取文件输入框
    const exportDiaryJsonBtn = document.getElementById('export-diary-json-btn');
    const exportDiaryTxtBtn = document.getElementById('export-diary-txt-btn');
    const historyReviewBtn = document.getElementById('history-review-btn'); // 获取按钮
    const modalCloseBtn = document.getElementById('modal-close-btn'); // 获取历史模态框关闭按钮
    const historyModal = document.getElementById('history-modal'); // 获取历史模态框
    // 新增：获取设置按钮和模态框元素
    const settingsOutputBtn = document.getElementById('settings-output-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsModalCloseBtn = document.getElementById('settings-modal-close-btn'); // 获取设置模态框关闭按钮
const unlockButton = document.getElementById('unlock-btn'); // 新增：获取解锁按钮 (修正变量名)

    // --- 状态变量 ---
    let currentDiaryDate = new Date(); // 当前编辑/查看的日记日期，默认为今天

    // --- 初始化 ---
    loadGoals();
    loadDiaryData();
    loadReferenceDateSetting(); // 修改：加载新的设置
    loadReminderTime();
    displayDiaryForDate(currentDiaryDate); // 初始显示
    setupEventListeners();
    updateGoalProgress();
    setupReminder();

    // --- 函数定义 (在 DOMContentLoaded 内) ---

    function setupEventListeners() {
        if (boldBtn) boldBtn.addEventListener('click', () => {
            document.execCommand('bold');
            const activeSection = document.activeElement.closest('.section-content') || sectionHarvest;
            if (activeSection) activeSection.focus();
        });

        if (colorBtn) colorBtn.addEventListener('click', () => colorPicker?.click());
        if (colorPicker) colorPicker.addEventListener('input', (event) => {
            document.execCommand('foreColor', false, event.target.value);
            const activeSection = document.activeElement.closest('.section-content') || sectionHarvest;
            if (activeSection) activeSection.focus();
        });

        if (saveBtn) saveBtn.addEventListener('click', saveCurrentDiary);
        if (copyContentBtn) copyContentBtn.addEventListener('click', copyCurrentDiaryContent);
        if (pasteContentBtn) pasteContentBtn.addEventListener('click', pasteDiaryContent);
        if (saveGoalBtn) saveGoalBtn.addEventListener('click', (event) => saveGoals(event)); // 传递 event
        // 主界面的翻页按钮绑定到全局函数
        if (prevDayBtn) prevDayBtn.addEventListener('click', mainShowPreviousDayDiary);
        if (nextDayBtn) nextDayBtn.addEventListener('click', mainShowNextDayDiary);
        if (saveReminderTimeBtn) saveReminderTimeBtn.addEventListener('click', (event) => saveReminderTime(event)); // 传递 event
        // if (saveCurrentDayBtn) saveCurrentDayBtn.addEventListener('click', saveCurrentDaySetting); // 移除旧监听器
        if (saveReferenceDateBtn) saveReferenceDateBtn.addEventListener('click', (event) => saveReferenceDateSetting(event)); // 传递 event
        if (importDiaryJsonBtn) importDiaryJsonBtn.addEventListener('click', (event) => { // 传递 event 并阻止冒泡
            event.stopPropagation();
            importFileInput?.click();
        });
        if (importFileInput) importFileInput.addEventListener('change', handleJsonFileImport); // change 事件通常不需要阻止冒泡来关闭模态框
        if (exportDiaryJsonBtn) exportDiaryJsonBtn.addEventListener('click', (event) => exportDiaryDataAsJson(event)); // 传递 event
        if (exportDiaryTxtBtn) exportDiaryTxtBtn.addEventListener('click', (event) => exportDiaryDataAsTxt(event)); // 传递 event
        if (unlockButton) unlockButton.addEventListener('click', checkPasswordAndUnlock); // 这个不在模态框内，无需修改

        [sectionHarvest, sectionPlan, sectionGratitude, sectionInvestment, sectionConnect].forEach(section => {
            section?.addEventListener('input', () => { // 安全访问
                if(saveStatus) saveStatus.textContent = '';
            });
        });

        // History Review Event Listeners (绑定到全局函数)
        if (historyReviewBtn) historyReviewBtn.addEventListener('click', openHistoryModal);
        if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeHistoryModal);
        if (historyModal) {
             historyModal.addEventListener('click', (event) => {
                 // 点击模态框背景关闭
                 if (event.target === historyModal) {
                     closeHistoryModal();
                 }
             });
        }
        // 新增：设置模态框事件监听
        if (settingsOutputBtn) settingsOutputBtn.addEventListener('click', openSettingsModal);
        if (settingsModalCloseBtn) settingsModalCloseBtn.addEventListener('click', closeSettingsModal);
        if (settingsModal) {
            settingsModal.addEventListener('click', (event) => {
                // 点击模态框背景关闭
                if (event.target === settingsModal) {
                    closeSettingsModal();
                }
            });
        }
    }

    // --- 新增：打开和关闭设置模态框的函数 ---
    function openSettingsModal() {
        if (settingsModal) {
            settingsModal.classList.add('modal-visible');
        }
    }

    function closeSettingsModal() {
        if (settingsModal) {
            settingsModal.classList.remove('modal-visible');
        }
    }
    // --- 新增结束 ---

    function loadGoals() {
        const savedGoals = localStorage.getItem('diaryGoals');
        if (savedGoals) {
            try {
                goals = JSON.parse(savedGoals); // 更新全局 goals
            } catch (e) {
                console.error("Failed to parse goals from localStorage", e);
                // 保留默认值
            }
        }
        if (targetDaysInput) targetDaysInput.value = goals.targetDays;
        if (rewardInput) rewardInput.value = goals.reward;
    }

    function saveGoals(event) { // 接收 event
        event.stopPropagation(); // 阻止事件冒泡
        if (isLocked) { alert('请先解锁后再进行操作。'); return; } // 修正：只检查锁定状态，不重新锁定
        goals.targetDays = parseInt(targetDaysInput?.value) || 30; // 使用全局 goals
        goals.reward = rewardInput?.value || '一个惊喜'; // 使用全局 goals
        localStorage.setItem('diaryGoals', JSON.stringify(goals));

        // --- 直接更新顶部横幅显示 (冗余修复) ---
        const targetDaysDisplay = document.getElementById('goal-target-days-display');
        const rewardDisplay = document.getElementById('goal-reward-display');
        if (targetDaysDisplay) {
            targetDaysDisplay.textContent = goals.targetDays;
        }
        if (rewardDisplay) {
            rewardDisplay.textContent = goals.reward || 'XXX';
        }
        // --- 冗余修复结束 ---

        updateGoalProgress(); // 仍然调用以更新其他地方（如模态框）- 天数在内部计算
        // alert('目标已保存！'); // 移除 alert，避免阻塞和测试问题
        // 添加非阻塞状态提示
        const saveGoalButton = document.getElementById('save-goal-footer'); // 确保使用页脚按钮 ID
        if (saveGoalButton) {
            const originalText = saveGoalButton.textContent;
            saveGoalButton.textContent = '已保存!';
            saveGoalButton.disabled = true; // 暂时禁用按钮
            setTimeout(() => {
                saveGoalButton.textContent = originalText;
                saveGoalButton.disabled = false; // 恢复按钮
            }, 1500); // 1.5秒后恢复
        }
    }

    // 修改：加载参考日期和天数设置
    function loadReferenceDateSetting() {
        const savedRefDate = localStorage.getItem('diaryReferenceDate');
        const savedRefDayNum = localStorage.getItem('diaryReferenceDayNumber');

        if (savedRefDate) {
            referenceDate = savedRefDate; // 更新全局 referenceDate
        } else {
            referenceDate = '2025-06-04'; // 默认参考日期
            localStorage.setItem('diaryReferenceDate', referenceDate);
        }

        if (savedRefDayNum) {
            referenceDayNumber = parseInt(savedRefDayNum, 10); // 更新全局 referenceDayNumber
        } else {
            referenceDayNumber = 80; // 默认参考天数
            localStorage.setItem('diaryReferenceDayNumber', referenceDayNumber);
        }

        // 更新 HTML 输入框的值 (假设元素存在)
        const referenceDateInput = document.getElementById('reference-date-input');
        const referenceDayNumberInput = document.getElementById('reference-day-number-input');
        if (referenceDateInput) {
            referenceDateInput.value = referenceDate;
        }
        if (referenceDayNumberInput) {
            referenceDayNumberInput.value = referenceDayNumber;
        }
    }

    // 修改：保存参考日期和天数设置
    function saveReferenceDateSetting(event) { // 接收 event
        event.stopPropagation(); // 阻止事件冒泡
        if (isLocked) { alert('请先解锁后再进行操作。'); return; } // 修正：只检查锁定状态，不重新锁定
        const referenceDateInput = document.getElementById('reference-date-input');
        const referenceDayNumberInput = document.getElementById('reference-day-number-input');

        const newRefDateStr = referenceDateInput?.value;
        const newRefDayNumStr = referenceDayNumberInput?.value;

        // 验证日期格式 (简单验证 YYYY-MM-DD)
        if (!newRefDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(newRefDateStr)) {
            alert('请输入有效的参考日期 (格式 YYYY-MM-DD)。');
            return;
        }
        // 尝试创建日期对象以进一步验证
        try {
            new Date(newRefDateStr + 'T00:00:00');
        } catch (e) {
            alert('输入的参考日期无效。');
            return;
        }

        // 验证天数
        const newRefDayNum = parseInt(newRefDayNumStr, 10);
        if (isNaN(newRefDayNum) || newRefDayNum < 0) {
            alert('请输入有效的非负整数作为参考日更天数。');
            return;
        }

        // 保存到全局变量和 localStorage
        referenceDate = newRefDateStr;
        referenceDayNumber = newRefDayNum;
        localStorage.setItem('diaryReferenceDate', referenceDate);
        localStorage.setItem('diaryReferenceDayNumber', referenceDayNumber);

        alert(`参考日期和天数已更新：${referenceDate} 为第 ${referenceDayNumber} 天。`);
        displayDiaryForDate(currentDiaryDate); // 更新显示以反映新设置
    }

    function loadReminderTime() {
        const savedTime = localStorage.getItem('diaryReminderTime');
        if (savedTime) {
            reminderTime = savedTime; // 更新全局 reminderTime
            if (reminderTimeInput) reminderTimeInput.value = savedTime;
            updateNextReminderTimeDisplay();
        } else {
            if (setReminderTimeDisplay) setReminderTimeDisplay.textContent = '未设置';
            if (reminderCountdownSpan) reminderCountdownSpan.textContent = '--:--:--';
        }
    }

    function saveReminderTime(event) { // 接收 event
        event.stopPropagation(); // 阻止事件冒泡
        if (isLocked) { alert('请先解锁后再进行操作。'); return; } // 修正：只检查锁定状态，不重新锁定
        const timeValue = reminderTimeInput?.value;
        if (timeValue) {
            reminderTime = timeValue; // 更新全局 reminderTime
            localStorage.setItem('diaryReminderTime', reminderTime);
            alert('提醒时间已保存！');
            updateNextReminderTimeDisplay();
            if (countdownInterval) clearInterval(countdownInterval); // 使用全局 countdownInterval
            startCountdownTimer(); // 调用全局函数
            requestNotificationPermission(); // 调用全局函数
        } else {
            alert('请输入有效的提醒时间。');
        }
    }

    function updateNextReminderTimeDisplay() {
        if (reminderTime && setReminderTimeDisplay) { // 使用全局 reminderTime
            const nextReminder = calculateNextReminderDateTime(); // 调用全局函数
            if (!nextReminder) return; // 如果时间无效则退出
            const [hours, minutes] = reminderTime.split(':');
            const period = parseInt(hours) < 12 ? '早上' : (parseInt(hours) < 18 ? '下午' : '晚上');
            const displayHours = parseInt(hours) % 12 === 0 ? 12 : parseInt(hours) % 12;
            const formattedTime = `${period} ${displayHours}:${minutes}`;
            setReminderTimeDisplay.textContent = formattedTime;
        } else if (setReminderTimeDisplay) {
            setReminderTimeDisplay.textContent = '未设置';
        }
    }

    function loadDiaryData() {
        const savedData = localStorage.getItem('diaryEntries');
        if (savedData) {
            try {
                diaryData = JSON.parse(savedData); // 更新全局 diaryData
            } catch (e) {
                console.error("Failed to parse diary data from localStorage", e);
                diaryData = {}; // 解析失败则重置
            }
        }
    }

    function saveCurrentDiary() {
        if (isLocked) { alert('请先解锁后再进行操作。'); return; } // 修正：只检查锁定状态，不重新锁定
        const dateString = formatDate(currentDiaryDate); // 使用全局 formatDate
        if (!dateString) return; // 如果日期无效则退出

        const currentContent = {
            harvest: sectionHarvest?.innerHTML || '',
            plan: sectionPlan?.innerHTML || '',
            gratitude: sectionGratitude?.innerHTML || '',
            investment: sectionInvestment?.innerHTML || '',
            connect: sectionConnect?.innerHTML || ''
        };
        diaryData[dateString] = currentContent; // 更新全局 diaryData
        localStorage.setItem('diaryEntries', JSON.stringify(diaryData));

        if(saveStatus) saveStatus.textContent = '已保存！';
        setTimeout(() => { if(saveStatus) saveStatus.textContent = ''; }, 2000);
        updateGoalProgress();

        if (historyCalendarInstance) { // 使用全局 historyCalendarInstance
            historyCalendarInstance.set('enable', Object.keys(diaryData)); // 使用全局 diaryData
            historyCalendarInstance.redraw();
        }
    }

    // 新增：计算指定日期的日更天数
    function calculateCurrentDayNumber(currentDate) {
        try {
            const refDate = new Date(referenceDate + 'T00:00:00');
            const currDate = new Date(currentDate); // currentDate 已经是 Date 对象
            currDate.setHours(0, 0, 0, 0); // 确保比较的是日期部分

            if (isNaN(refDate.getTime()) || isNaN(currDate.getTime())) {
                console.error("Invalid date for calculation:", referenceDate, currentDate);
                return referenceDayNumber; // 返回参考天数作为备用
            }

            // 计算毫秒差并转换为天数差
            const diffTime = currDate - refDate;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // 使用 Math.round 处理时区和夏令时可能的小偏差

            return referenceDayNumber + diffDays;
        } catch (e) {
            console.error("Error calculating day number:", e);
            return referenceDayNumber; // 出错时返回参考天数
        }
    }

    function displayDiaryForDate(date) {
        currentDiaryDate = date; // 更新当前编辑日期
        const dateString = formatDate(date); // 使用全局 formatDate
        if (!dateString) return; // 如果日期无效则退出

        // --- 计算并更新日更天数 ---
        const calculatedDayNumber = calculateCurrentDayNumber(date);

        // 更新合并后的横幅显示
        if(dateDayCountDisplay) { // 使用新的 ID
            const month = date.getMonth() + 1;
            const day = date.getDate();
            dateDayCountDisplay.textContent = `今天是 ${month}月${day}日 日更复盘第 ${calculatedDayNumber} 天`; // 使用计算出的天数
        }

        // 移除对旧输入框的更新
        // if (currentDayInput) {
        //      currentDayInput.value = manualCurrentDay;
        // }

        // 更新主页面的目标进度条和弹窗内的目标显示
        updateGoalProgress(); // 不再传递天数，内部会计算

        const savedContent = diaryData[dateString]; // 使用全局 diaryData
        if (savedContent && typeof savedContent === 'object') {
            if(sectionHarvest) sectionHarvest.innerHTML = savedContent.harvest || '<p></p>';
            if(sectionPlan) sectionPlan.innerHTML = savedContent.plan || '<p></p>';
            if(sectionGratitude) sectionGratitude.innerHTML = savedContent.gratitude || '<p></p>';
            if(sectionInvestment) sectionInvestment.innerHTML = savedContent.investment || '<p></p>';
            if(sectionConnect) sectionConnect.innerHTML = savedContent.connect || '<p></p>';
        } else {
            // 清空模板
            if(sectionHarvest) sectionHarvest.innerHTML = '<p></p>';
            if(sectionPlan) sectionPlan.innerHTML = '<p></p>';
            if(sectionGratitude) sectionGratitude.innerHTML = '<p></p>';
            if(sectionInvestment) sectionInvestment.innerHTML = '<p></p>';
            if(sectionConnect) sectionConnect.innerHTML = '<p></p>';
        }
        if(saveStatus) saveStatus.textContent = '';

        updatePaginationButtons();
    }

    // 修改：移除参数，内部计算天数
    function updateGoalProgress() {
        // --- 计算当前日期的日更天数 ---
        const currentDay = calculateCurrentDayNumber(currentDiaryDate);

        // 直接获取并更新主页面目标显示
        const targetDaysDisplay = document.getElementById('goal-target-days-display');
        const rewardDisplay = document.getElementById('goal-reward-display');
        if (targetDaysDisplay) {
            targetDaysDisplay.textContent = goals.targetDays;
        }
        if (rewardDisplay) {
            rewardDisplay.textContent = goals.reward || 'XXX';
        }

        // 更新历史回顾弹窗中的目标进度
        const modalCurrentDays = document.getElementById('modal-current-days');
        const modalReward = document.getElementById('modal-reward');
        if (modalCurrentDays) {
            modalCurrentDays.textContent = currentDay;
        }
        if (modalReward) {
            modalReward.textContent = goals.reward || 'XX';
        }

        // 确保旧元素隐藏
        const oldGoalProgress = document.getElementById('goal-progress');
        if (oldGoalProgress) {
            oldGoalProgress.style.display = 'none';
        }
    }

    function requestNotificationPermission() {
        if (!("Notification" in window)) {
            console.warn("此浏览器不支持桌面通知");
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    console.log("通知权限已授予。");
                } else {
                    console.log("通知权限被拒绝。");
                }
            });
        }
    }

    function setupReminder() {
        // loadReminderTime(); // 已在初始化时调用
        requestNotificationPermission(); // 调用全局函数
        startCountdownTimer(); // 调用全局函数
    }

    function startCountdownTimer() {
        if (countdownInterval) clearInterval(countdownInterval); // 使用全局 countdownInterval
        if (reminderTime) { // 使用全局 reminderTime
            countdownInterval = setInterval(updateCountdown, 1000); // 更新全局 countdownInterval
            updateCountdown(); // 立即执行一次
        } else {
            if (reminderCountdownSpan) reminderCountdownSpan.textContent = '--:--:--';
        }
    }

    function calculateNextReminderDateTime() {
        if (!reminderTime) return null; // 使用全局 reminderTime
        const [hours, minutes] = reminderTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return null;
        const now = new Date();
        let nextReminder = new Date();
        nextReminder.setHours(hours, minutes, 0, 0);
        if (nextReminder <= now) {
            nextReminder.setDate(now.getDate() + 1);
        }
        return nextReminder;
    }

    function updateCountdown() {
        const nextReminder = calculateNextReminderDateTime(); // 调用全局函数
        if (!nextReminder) {
            if (reminderCountdownSpan) reminderCountdownSpan.textContent = '无效时间';
            return;
        }
        const now = new Date();
        const diff = nextReminder - now;
        if (diff <= 0) {
            if (reminderCountdownSpan) reminderCountdownSpan.textContent = "00:00:00";
            // 避免重复触发通知，可以在 showNotification 内部处理
            showNotification(); // 调用全局函数
            // 倒计时结束后，可能需要重新计算第二天的提醒时间并更新显示
            // updateNextReminderTimeDisplay(); // 可以在这里调用，或者等待下一次 startCountdownTimer
        } else {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            if (reminderCountdownSpan) {
                reminderCountdownSpan.textContent =
                    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }
    }

    let notificationShownToday = false; // 防止重复通知的状态变量
    function showNotification() {
        const todayStr = formatDate(new Date()); // 使用全局 formatDate
        if (notificationShownToday === todayStr) return; // 今天已经通知过了

        if (!("Notification" in window)) {
            console.warn("此浏览器不支持桌面通知");
            return;
        }
        if (Notification.permission === "granted") {
            const notification = new Notification("晨间日记提醒", {
                body: "是时候记录今天的想法和计划啦！",
                // icon: "logo.png" // 可选
            });
            notification.onclick = () => {
                window.focus();
            };
            notificationShownToday = todayStr; // 标记今天已通知
        } else if (Notification.permission !== "denied") {
            requestNotificationPermission(); // 调用全局函数
        }
    }

    // 主界面的翻页逻辑 (修改：移除 manualCurrentDay 操作)
    function mainShowPreviousDayDiary() {
        if (!prevDayBtn || prevDayBtn.disabled) return;
        const prevDate = new Date(currentDiaryDate);
        prevDate.setDate(currentDiaryDate.getDate() - 1);
        // 不再手动修改天数，displayDiaryForDate 会自动计算
        displayDiaryForDate(prevDate); // 更新主界面显示
    }

    function mainShowNextDayDiary() {
        if (!nextDayBtn || nextDayBtn.disabled) return;
        const nextDate = new Date(currentDiaryDate);
        nextDate.setDate(currentDiaryDate.getDate() + 1);
        // 不再手动修改天数，displayDiaryForDate 会自动计算
        displayDiaryForDate(nextDate); // 更新主界面显示
    }


    function updatePaginationButtons() {
        if (!prevDayBtn || !nextDayBtn) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDayStart = new Date(currentDiaryDate);
        currentDayStart.setHours(0, 0, 0, 0);

        // 检查是否可以向后翻页（不能超过今天）
        nextDayBtn.disabled = currentDayStart >= today;

        // 检查是否可以向前翻页（基于计算出的天数，允许到第1天或第0天，取决于需求）
        const currentCalculatedDay = calculateCurrentDayNumber(currentDiaryDate);
        prevDayBtn.disabled = currentCalculatedDay <= 0; // 允许翻到第0天
    }

    function exportDiaryDataAsJson(event) { // 接收 event
        event.stopPropagation(); // 阻止事件冒泡
        if (Object.keys(diaryData).length === 0) { // 使用全局 diaryData
            alert('没有日记数据可导出。');
            return;
        }
        const exportData = {
            exportTimestamp: new Date().toISOString(),
            diaryEntries: diaryData, // 使用全局 diaryData
            settings: {
                reminderTime: reminderTime, // 使用全局 reminderTime
                // manualCurrentDay: manualCurrentDay, // 移除旧设置
                referenceDate: referenceDate, // 添加新设置
                referenceDayNumber: referenceDayNumber, // 添加新设置
                goals: goals // 使用全局 goals
            }
        };
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `heber_diary_export_${formatDate(new Date())}.json`; // 使用全局 formatDate
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('日记已导出为 JSON 文件！');
    }

    function exportDiaryDataAsTxt(event) { // 接收 event
        event.stopPropagation(); // 阻止事件冒泡
        if (Object.keys(diaryData).length === 0) { // 使用全局 diaryData
            alert('没有日记数据可导出。');
            return;
        }
        let txtContent = `贺伯晨间日记 - 导出时间: ${new Date().toLocaleString()}\n`;
        txtContent += "========================================\n\n";
        const sortedDates = Object.keys(diaryData).sort(); // 使用全局 diaryData
        sortedDates.forEach(dateString => {
            const entry = diaryData[dateString]; // 使用全局 diaryData
            if (entry && typeof entry === 'object') {
                const dateObj = new Date(dateString + 'T00:00:00');
                const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
                txtContent += `【${formattedDate}】\n`;
                txtContent += "--------------------\n";
                txtContent += "【收获】\n";
                txtContent += htmlToPlainText(entry.harvest) + "\n\n"; // 调用全局函数
                txtContent += "【后续计划】\n";
                txtContent += htmlToPlainText(entry.plan) + "\n\n"; // 调用全局函数
                txtContent += "【感恩】\n";
                txtContent += htmlToPlainText(entry.gratitude) + "\n\n"; // 调用全局函数
                txtContent += "【定投】\n";
                txtContent += htmlToPlainText(entry.investment) + "\n\n"; // 调用全局函数
                txtContent += "【与我链接】\n";
                txtContent += htmlToPlainText(entry.connect) + "\n\n"; // 调用全局函数
                txtContent += "========================================\n\n";
            }
        });
        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `heber_diary_export_${formatDate(new Date())}.txt`; // 使用全局 formatDate
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('日记已导出为 TXT 文件！');
    }

    function htmlToPlainText(html) {
        if (!html) return '';
        const tempDiv = document.createElement('div');
        // 替换 <br> 为换行符
        html = html.replace(/<br\s*\/?>/gi, '\n');
        // 尝试在块级元素后添加换行符
        html = html.replace(/<\/p>/gi, '\n');
        html = html.replace(/<\/div>/gi, '\n');
        html = html.replace(/<\/h[1-6]>/gi, '\n');
        // 处理列表项
        html = html.replace(/<li>/gi, '\n- ');
        // 移除所有其他 HTML 标签
        tempDiv.innerHTML = html;
        let text = tempDiv.textContent || tempDiv.innerText || "";
        // 移除多余的空行
        text = text.replace(/(\n\s*){2,}/g, '\n\n');
        return text.trim();
    }


    function copyCurrentDiaryContent() {
        const dateString = formatDate(currentDiaryDate); // 使用全局 formatDate
        if (!dateString) return;
        const entry = diaryData[dateString]; // 使用全局 diaryData
        if (!entry || typeof entry !== 'object') {
            alert('当前日期没有内容可复制。');
            return;
        }
        const dateObj = new Date(dateString + 'T00:00:00');
        const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
        let textToCopy = `【${formattedDate} - 贺伯晨间日记】\n`;
        textToCopy += "--------------------\n\n";
        textToCopy += "【收获】\n";
        textToCopy += htmlToPlainText(entry.harvest) + "\n\n"; // 调用全局函数
        textToCopy += "【后续计划】\n";
        textToCopy += htmlToPlainText(entry.plan) + "\n\n"; // 调用全局函数
        textToCopy += "【感恩】\n";
        textToCopy += htmlToPlainText(entry.gratitude) + "\n\n"; // 调用全局函数
        textToCopy += "【定投】\n";
        textToCopy += htmlToPlainText(entry.investment) + "\n\n"; // 调用全局函数
        textToCopy += "【与我链接】\n";
        textToCopy += htmlToPlainText(entry.connect) + "\n\n"; // 调用全局函数
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyContentBtn?.textContent;
            if(copyContentBtn) {
                copyContentBtn.textContent = '已复制!';
                copyContentBtn.style.backgroundColor = '#28a745';
                setTimeout(() => {
                    copyContentBtn.textContent = originalText;
                    copyContentBtn.style.backgroundColor = '';
                }, 2000);
            }
        }).catch(err => {
            console.error('无法复制内容: ', err);
            alert('复制失败，请检查浏览器权限或手动复制。');
        });
    }

    async function pasteDiaryContent() {
        if (isLocked) { alert('请先解锁后再进行操作。'); return; } // 修正：只检查锁定状态，不重新锁定
        try {
            const text = await navigator.clipboard.readText();
            if (!text) {
                 alert('粘贴失败：剪贴板内容为空。');
                 return;
            }

            const sections = {};
            const lines = text.split('\n');
            let currentSection = null;
            let contentBuffer = '';
            const sectionKeywords = ['收获', '后续计划', '感恩', '定投', '与我链接'];

            lines.forEach(line => {
                const trimmedLine = line.trim();
                let isSectionHeader = false;
                for (const keyword of sectionKeywords) {
                    if (trimmedLine === `【${keyword}】`) {
                        if (currentSection && contentBuffer) {
                            sections[currentSection] = contentBuffer.trim().replace(/\n/g, '<br>');
                        }
                        currentSection = keyword;
                        contentBuffer = '';
                        isSectionHeader = true;
                        break;
                    }
                }

                if (!isSectionHeader && currentSection && trimmedLine !== '--------------------' && !trimmedLine.startsWith('【') && !trimmedLine.endsWith('】')) {
                    contentBuffer += line + '\n';
                }
            });

            if (currentSection && contentBuffer) {
                sections[currentSection] = contentBuffer.trim().replace(/\n/g, '<br>');
            }

            if (sections['收获'] && sectionHarvest) sectionHarvest.innerHTML = `<p>${sections['收获']}</p>`;
            if (sections['后续计划'] && sectionPlan) sectionPlan.innerHTML = `<p>${sections['后续计划']}</p>`;
            if (sections['感恩'] && sectionGratitude) sectionGratitude.innerHTML = `<p>${sections['感恩']}</p>`;
            if (sections['定投'] && sectionInvestment) sectionInvestment.innerHTML = `<p>${sections['定投']}</p>`;
            if (sections['与我链接'] && sectionConnect) sectionConnect.innerHTML = `<p>${sections['与我链接']}</p>`;

            const originalText = pasteContentBtn?.textContent;
            if(pasteContentBtn) {
                pasteContentBtn.textContent = '已粘贴!';
                pasteContentBtn.style.backgroundColor = '#28a745';
                setTimeout(() => {
                    pasteContentBtn.textContent = originalText;
                    pasteContentBtn.style.backgroundColor = '';
                }, 2000);
            }
            if(saveStatus) saveStatus.textContent = '';

        } catch (err) {
            console.error('无法粘贴内容: ', err);
            if (err.name === 'NotAllowedError' || err.message.includes('Read permission denied')) {
                 alert('粘贴失败：需要授予读取剪贴板的权限。请点击地址栏旁边的图标进行授权。');
            } else if (err.name === 'NotFoundError') {
                 alert('粘贴失败：剪贴板为空或浏览器不支持读取。');
            } else {
                 alert('粘贴失败：发生未知错误。');
            }
        }
    }

   // --- 新增：处理 JSON 文件导入 ---
   function handleJsonFileImport(event) {
        // 导入操作本身需要解锁
        if (isLocked) {
            alert('请先解锁后再进行操作。');
            event.target.value = null; // 清空文件选择
            return;
        } // 修正：只检查锁定状态，不重新锁定

        const file = event.target.files?.[0];
        if (!file) {
            return; // 没有选择文件
       }

       if (file.type !== 'application/json') {
           alert('请选择有效的 JSON 文件 (.json)。');
           // 清空文件输入框，以便可以再次选择相同的文件
           event.target.value = null;
           return;
       }

       const reader = new FileReader();

       reader.onload = function(e) {
           try {
               const content = e.target?.result;
               if (typeof content !== 'string') {
                   throw new Error('无法读取文件内容。');
               }
               const importedData = JSON.parse(content);

               // --- 数据验证 ---
               if (typeof importedData !== 'object' || importedData === null) {
                   throw new Error('导入的文件不是有效的 JSON 对象。');
               }
               if (typeof importedData.diaryEntries !== 'object' || importedData.diaryEntries === null) {
                   throw new Error('导入的数据缺少有效的 "diaryEntries" 对象。');
               }
               if (typeof importedData.settings !== 'object' || importedData.settings === null) {
                   throw new Error('导入的数据缺少有效的 "settings" 对象。');
               }

               // --- 确认覆盖 ---
               if (!confirm('这将覆盖当前的日记数据和设置，确定要导入吗？')) {
                   // 清空文件输入框
                   event.target.value = null;
                   return;
               }

               // --- 更新全局数据 ---
               diaryData = importedData.diaryEntries;

               // 更新设置 (提供默认值以防导入数据不完整)
               const settings = importedData.settings;
               goals = settings.goals || { targetDays: 30, reward: '一次旅行' };
               reminderTime = settings.reminderTime || null;
               referenceDate = settings.referenceDate || '2025-06-04';
               referenceDayNumber = settings.referenceDayNumber || 80;
               // 移除旧的 manualCurrentDay (如果存在)
               // manualCurrentDay = settings.manualCurrentDay || 1; // 不再需要

               // --- 保存到 localStorage ---
               localStorage.setItem('diaryEntries', JSON.stringify(diaryData));
               localStorage.setItem('diaryGoals', JSON.stringify(goals));
               localStorage.setItem('diaryReminderTime', reminderTime || ''); // 保存空字符串如果为 null
               localStorage.setItem('diaryReferenceDate', referenceDate);
               localStorage.setItem('diaryReferenceDayNumber', referenceDayNumber);
               // localStorage.removeItem('manualDiaryDayCount'); // 移除旧的存储项

               // --- 刷新界面 ---
               loadGoals(); // 重新加载目标到输入框
               loadReferenceDateSetting(); // 重新加载参考设置到输入框
               loadReminderTime(); // 重新加载提醒时间
               displayDiaryForDate(currentDiaryDate); // 重新显示当前日期的日记
               updateGoalProgress(); // 更新进度显示
               setupReminder(); // 重新设置提醒

               alert('数据导入成功！');

           } catch (error) {
               console.error('导入 JSON 文件时出错:', error);
               alert(`导入失败：${error.message}`);
           } finally {
               // 清空文件输入框，以便可以再次选择相同的文件
               event.target.value = null;
           }
       };

       reader.onerror = function(e) {
           console.error('读取文件时出错:', e);
           alert('读取文件失败。');
           // 清空文件输入框
           event.target.value = null;
       };

       reader.readAsText(file); // 以文本形式读取文件
   }
   // --- 新增结束 ---

  // --- 新增：锁定/解锁相关函数 ---
  function setEditableState(locked) {
      isLocked = locked;
      const editableContents = document.querySelectorAll('.section-content');
      const saveButton = document.getElementById('save-diary');
      const pasteButton = document.getElementById('paste-diary-content-btn');
      const saveGoalButton = document.getElementById('save-goal-footer');
      const saveRefButton = document.getElementById('save-reference-date-btn');
      const saveReminderButton = document.getElementById('save-reminder-time');
      const importButton = document.getElementById('import-diary-json-btn');
      const unlockButton = document.getElementById('unlock-btn');
      const unlockLabel = unlockButton?.nextElementSibling; // 获取按钮旁边的标签

      editableContents.forEach(el => {
          el.contentEditable = !locked;
          if (locked) {
              el.classList.add('locked');
          } else {
              el.classList.remove('locked');
          }
      });

      const buttonsToToggle = [
          saveButton, pasteButton, saveGoalButton,
          saveRefButton, saveReminderButton, importButton
      ];
      buttonsToToggle.forEach(btn => {
          if (btn) btn.disabled = locked;
      });

      // 更新解锁按钮图标和标签
      if (unlockButton) {
          unlockButton.innerHTML = locked ? '🔒' : '🔓';
          unlockButton.title = locked ? '解锁编辑' : '锁定编辑';
      }
      if (unlockLabel) {
          unlockLabel.textContent = locked ? '解锁' : '锁定';
      }
  }

  function checkPasswordAndUnlock() {
      if (!isLocked) {
          // 如果已经解锁，再次点击则锁定
          setEditableState(true);
          return false; // 返回 false 表示当前是锁定操作，阻止后续的修改行为
      }

      const enteredPassword = prompt('请输入密码以解锁编辑：');
      if (enteredPassword === null) {
          // 用户取消输入
          return false;
      }
      if (enteredPassword === unlockPassword) {
          setEditableState(false); // 解锁
          return true; // 解锁成功
      } else {
          alert('密码错误！');
          return false; // 密码错误
      }
  }
  // --- 新增结束 ---
setEditableState(isLocked); // 确保初始加载时应用锁定状态

}); // 主 DOMContentLoaded 监听器结束