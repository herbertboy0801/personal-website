// morning-journal-view.js - Fetch API version

document.addEventListener('DOMContentLoaded', async () => {
    const datepickerInput = document.getElementById('datepicker');
    const prevDayBtn = document.getElementById('prev-day-btn');
    const nextDayBtn = document.getElementById('next-day-btn');
    const journalContentDiv = document.getElementById('journal-content');
    const dateDayCountDisplay = document.getElementById('date-day-count-display');
    const goalTargetDaysDisplay = document.getElementById('goal-target-days-display');
    const goalRewardDisplay = document.getElementById('goal-reward-display');

    let flatpickrInstance = null;
    let currentSelectedDate = null;
    let journalData = [];
    let settings = {
        referenceDate: '2025-06-03',
        referenceStreak: 81,
        goalDays: 365,
        goalReward: '出一本书',
    };

    // Load data from API
    try {
        const [journalRes, settingsRes] = await Promise.all([
            fetch('/api/journal'),
            fetch('/api/journal-settings')
        ]);

        if (journalRes.ok) {
            journalData = await journalRes.json();
        }
        if (settingsRes.ok) {
            const s = await settingsRes.json();
            settings.referenceDate = s.referenceDate || settings.referenceDate;
            settings.referenceStreak = s.referenceStreak || settings.referenceStreak;
            settings.goalDays = s.goalDays || settings.goalDays;
            settings.goalReward = s.goalReward || settings.goalReward;
        }
    } catch (e) {
        journalContentDiv.innerHTML = '<div class="no-entry">数据加载失败，请稍后再试</div>';
        return;
    }

    function formatDate(date) {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            const today = new Date();
            return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function parseDate(dateString) {
        if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;
        const parts = dateString.split('-');
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }

    function findEntryByDate(dateString) {
        return journalData.find(entry => entry.id === dateString);
    }

    function calculateCurrentDayNumber(currentDate) {
        try {
            const refDate = parseDate(settings.referenceDate);
            const currDate = new Date(currentDate);
            currDate.setHours(0, 0, 0, 0);
            if (!refDate || isNaN(refDate.getTime()) || isNaN(currDate.getTime())) return settings.referenceStreak;
            const diffDays = Math.round((currDate - refDate) / (1000 * 60 * 60 * 24));
            return settings.referenceStreak + diffDays;
        } catch { return settings.referenceStreak; }
    }

    function displayJournalEntry(date) {
        if (!journalContentDiv || !date || !(date instanceof Date) || isNaN(date.getTime())) {
            date = new Date();
            currentSelectedDate = date;
        }

        const dateString = formatDate(date);
        const entry = findEntryByDate(dateString);
        const calculatedDayNumber = calculateCurrentDayNumber(date);

        if (dateDayCountDisplay) {
            dateDayCountDisplay.textContent = `今天是 ${date.getMonth() + 1}月${date.getDate()}日 日更复盘第 ${calculatedDayNumber} 天`;
        }
        if (goalTargetDaysDisplay) goalTargetDaysDisplay.textContent = settings.goalDays;
        if (goalRewardDisplay) goalRewardDisplay.textContent = settings.goalReward || 'XXX';

        const clean = typeof DOMPurify !== 'undefined'
            ? (html) => DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'div', 'span'], ALLOWED_ATTR: ['href', 'target', 'rel', 'class'] })
            : (html) => html;

        if (entry) {
            journalContentDiv.innerHTML = `
                <section class="diary-block"><h3 class="section-title"><span class="icon">⚙️</span> 今日收获：</h3><div class="section-content">${clean(entry.harvest || '<em>未填写</em>')}</div></section>
                <section class="diary-block"><h3 class="section-title"><span class="icon">📝</span> 后续计划：</h3><div class="section-content">${clean(entry.plan || '<em>未填写</em>')}</div></section>
                <section class="diary-block"><h3 class="section-title"><span class="icon">💖</span> 感恩：</h3><div class="section-content">${clean(entry.gratitude || '<em>未填写</em>')}</div></section>
                <section class="diary-block"><h3 class="section-title"><span class="icon">📈</span> 定投：</h3><div class="section-content">${clean(entry.investment || '<em>未填写</em>')}</div></section>
                <section class="diary-block"><h3 class="section-title"><span class="icon">🔗</span> 与我链接：</h3><div class="section-content">${clean(entry.connect || '<em>未填写</em>')}</div></section>
            `;
        } else {
            journalContentDiv.innerHTML = `<div class="no-entry">日期 ${dateString} 没有日记记录。</div>`;
        }
        updatePaginationButtons(date);
    }

    function changeDate(newDate) {
        if (!newDate || !(newDate instanceof Date) || isNaN(newDate.getTime())) return;
        currentSelectedDate = newDate;
        if (flatpickrInstance) flatpickrInstance.setDate(currentSelectedDate, false);
        displayJournalEntry(currentSelectedDate);
    }

    function updatePaginationButtons(currentDate) {
        if (!prevDayBtn || !nextDayBtn || !currentDate) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDayStart = new Date(currentDate);
        currentDayStart.setHours(0, 0, 0, 0);
        nextDayBtn.disabled = currentDayStart >= today;
        prevDayBtn.disabled = false;
    }

    // Initialize Flatpickr
    if (datepickerInput) {
        flatpickrInstance = flatpickr(datepickerInput, {
            dateFormat: "Y-m-d",
            defaultDate: "today",
            locale: "zh",
            onChange: function(selectedDates) {
                if (selectedDates.length > 0) {
                    const newDate = selectedDates[0];
                    if (!currentSelectedDate || formatDate(newDate) !== formatDate(currentSelectedDate)) {
                        changeDate(newDate);
                    }
                }
            },
            onDayCreate: function(dObj, dStr, fp, dayElem) {
                if (findEntryByDate(formatDate(dayElem.dateObj))) {
                    dayElem.classList.add("has-journal-entry");
                    dayElem.title = "有日记记录";
                }
            }
        });
        currentSelectedDate = flatpickrInstance.selectedDates[0] || new Date();
        displayJournalEntry(currentSelectedDate);
    } else {
        currentSelectedDate = new Date();
        displayJournalEntry(currentSelectedDate);
    }

    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', () => {
            if (currentSelectedDate) {
                const prevDate = new Date(currentSelectedDate);
                prevDate.setDate(prevDate.getDate() - 1);
                changeDate(prevDate);
            }
        });
    }

    if (nextDayBtn) {
        nextDayBtn.addEventListener('click', () => {
            if (currentSelectedDate) {
                const nextDate = new Date(currentSelectedDate);
                nextDate.setDate(nextDate.getDate() + 1);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (nextDate <= today) changeDate(nextDate);
            }
        });
    }
});
