// personal-website/morning-journal-view.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const datepickerInput = document.getElementById('datepicker');
    const prevDayBtn = document.getElementById('prev-day-btn');
    const nextDayBtn = document.getElementById('next-day-btn');
    const journalContentDiv = document.getElementById('journal-content');
    // Goal Banner Elements
    const dateDayCountDisplay = document.getElementById('date-day-count-display');
    const goalTargetDaysDisplay = document.getElementById('goal-target-days-display');
    const goalRewardDisplay = document.getElementById('goal-reward-display');

    // Global State
    let flatpickrInstance = null;
    let currentSelectedDate = null;
    let journalData = []; // Holds entries from window.morningJournalEntries
    let settings = { // Holds settings from window.journalSettings
        referenceDate: '2024-01-01', // Default reference date (matches settings file)
        referenceStreak: 0,          // Default reference day number (matches settings file)
        goalDays: 100,               // Default target days (matches settings file)
        goalReward: '去旅行',        // Default reward (matches settings file)
        // reminderTime is not used in this script currently
    };

    // --- Helper Functions ---

    // Format date object to YYYY-MM-DD string
    function formatDate(date) {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
             console.error("Invalid date object received in formatDate:", date);
             // Attempt to create a valid date for today as fallback
             const today = new Date();
             const year = today.getFullYear();
             const month = String(today.getMonth() + 1).padStart(2, '0');
             const day = String(today.getDate()).padStart(2, '0');
             console.warn("Falling back to today's date:", `${year}-${month}-${day}`);
             return `${year}-${month}-${day}`;
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Get date object from YYYY-MM-DD string
    function parseDate(dateString) {
        if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return null;
        }
        const parts = dateString.split('-');
        // Note: Month is 0-indexed in JavaScript Date constructor
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }

    // Find journal entry by date string (YYYY-MM-DD)
    function findEntryByDate(dateString) {
        // Ensure journalData is loaded
        if (!journalData || journalData.length === 0) {
            if (window.morningJournalEntries && Array.isArray(window.morningJournalEntries)) {
                journalData = window.morningJournalEntries;
                console.log(`Loaded ${journalData.length} entries from window.morningJournalEntries.`);
            } else {
                console.error("window.morningJournalEntries is not available or not an array.");
                return null;
            }
        }
        return journalData.find(entry => entry.id === dateString);
    }

    // Load settings from window.journalSettings
    function loadSettings() {
        if (window.journalSettings && typeof window.journalSettings === 'object') {
            settings.referenceDate = window.journalSettings.referenceDate || settings.referenceDate;
            // Use correct property names from journal-settings.js
            settings.referenceStreak = window.journalSettings.referenceStreak || settings.referenceStreak;
            settings.goalDays = window.journalSettings.goalDays || settings.goalDays;
            settings.goalReward = window.journalSettings.goalReward || settings.goalReward;
            console.log("Loaded settings:", settings);
        } else {
            console.warn("window.journalSettings not found or invalid. Using default settings.");
        }
    }

    // Calculate the day number for a given date based on reference settings
    function calculateCurrentDayNumber(currentDate) {
        try {
            const refDate = parseDate(settings.referenceDate); // Use settings referenceDate
            const currDate = new Date(currentDate); // currentDate should be a Date object
            currDate.setHours(0, 0, 0, 0); // Ensure comparison is date-only

            if (!refDate || isNaN(refDate.getTime()) || isNaN(currDate.getTime())) {
                console.error("Invalid date for calculation:", settings.referenceDate, currentDate);
                return settings.referenceStreak; // Return reference streak as fallback
            }

            // Calculate difference in milliseconds and convert to days
            const diffTime = currDate - refDate;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            return settings.referenceStreak + diffDays; // Use referenceStreak
        } catch (e) {
            console.error("Error calculating day number:", e);
            return settings.referenceStreak; // Return reference streak on error
        }
    }

    // Render the journal entry content and update goal banner
    function displayJournalEntry(date) { // Accept Date object
        if (!journalContentDiv || !date || !(date instanceof Date) || isNaN(date.getTime())) {
             console.error("Invalid arguments for displayJournalEntry", journalContentDiv, date);
             // Attempt to recover by using today's date
             date = new Date();
             currentSelectedDate = date; // Update state if recovering
             if (flatpickrInstance) {
                  flatpickrInstance.setDate(currentSelectedDate, false);
             }
             console.warn("displayJournalEntry recovered using today's date.");
        }

        const dateString = formatDate(date);
        const entry = findEntryByDate(dateString);

        // --- Update Goal Banner ---
        const calculatedDayNumber = calculateCurrentDayNumber(date);
        if (dateDayCountDisplay) {
            const month = date.getMonth() + 1;
            const day = date.getDate();
            dateDayCountDisplay.textContent = `今天是 ${month}月${day}日 日更复盘第 ${calculatedDayNumber} 天`;
        }
        if (goalTargetDaysDisplay) {
            goalTargetDaysDisplay.textContent = settings.goalDays; // Use settings.goalDays
        }
        if (goalRewardDisplay) {
            goalRewardDisplay.textContent = settings.goalReward || 'XXX'; // Use settings.goalReward
        }

        // --- Render Journal Content ---
        if (entry) {
            // Render using the block structure like drawing-app
            journalContentDiv.innerHTML = `
                <section class="diary-block">
                    <h3 class="section-title"><span class="icon">⚙️</span> 今日收获：</h3>
                    <div class="section-content">${entry.harvest || '<em>未填写</em>'}</div>
                </section>
                <section class="diary-block">
                    <h3 class="section-title"><span class="icon">📝</span> 后续计划：</h3>
                    <div class="section-content">${entry.plan || '<em>未填写</em>'}</div>
                </section>
                <section class="diary-block">
                    <h3 class="section-title"><span class="icon">💖</span> 感恩：</h3>
                    <div class="section-content">${entry.gratitude || '<em>未填写</em>'}</div>
                </section>
                <section class="diary-block">
                    <h3 class="section-title"><span class="icon">📈</span> 定投：</h3>
                    <div class="section-content">${entry.investment || '<em>未填写</em>'}</div>
                </section>
                <section class="diary-block">
                    <h3 class="section-title"><span class="icon">🔗</span> 与我链接：</h3>
                    <div class="section-content">${entry.connect || '<em>未填写</em>'}</div>
                </section>
            `;
        } else {
            journalContentDiv.innerHTML = `<div class="no-entry">日期 ${dateString} 没有日记记录。</div>`;
        }
         // Update pagination buttons based on the new date
         updatePaginationButtons(date);
    }

    // Update the datepicker and display the corresponding entry
    function changeDate(newDate) {
        if (!newDate || !(newDate instanceof Date) || isNaN(newDate.getTime())) {
            console.error("Invalid date provided to changeDate:", newDate);
            return;
        }
        currentSelectedDate = newDate;

        // Update flatpickr without triggering its onChange event again
        if (flatpickrInstance) {
            flatpickrInstance.setDate(currentSelectedDate, false);
        }

        displayJournalEntry(currentSelectedDate); // Pass the Date object
    }

    // Update pagination button states
    function updatePaginationButtons(currentDate) {
        if (!prevDayBtn || !nextDayBtn || !currentDate || !(currentDate instanceof Date) || isNaN(currentDate.getTime())) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDayStart = new Date(currentDate);
        currentDayStart.setHours(0, 0, 0, 0);

        // Disable "next" if the current date is today or later
        nextDayBtn.disabled = currentDayStart >= today;

        // Disable "prev" if the calculated day number is 0 or less (optional)
        // const currentCalculatedDay = calculateCurrentDayNumber(currentDate);
        // prevDayBtn.disabled = currentCalculatedDay <= 0;
        // Or simply always enable "prev" unless specific logic requires otherwise
        prevDayBtn.disabled = false;
    }


    // --- Initialization ---

    function initialize() {
        loadSettings(); // Load settings first

        // Load journal data (corrected variable name)
        if (window.morningJournalEntries && Array.isArray(window.morningJournalEntries)) {
            journalData = window.morningJournalEntries;
            console.log(`Successfully pre-loaded ${journalData.length} journal entries.`);
        } else {
            console.warn("window.morningJournalEntries not found on initial load.");
            journalContentDiv.innerHTML = `<div class="no-entry">错误：无法加载日记数据。</div>`;
            // Disable date picker if data loading failed
            if (datepickerInput) datepickerInput.disabled = true;
            if (prevDayBtn) prevDayBtn.disabled = true;
            if (nextDayBtn) nextDayBtn.disabled = true;
            return; // Stop initialization if data is missing
        }


        // Initialize Flatpickr
        if (datepickerInput) {
            flatpickrInstance = flatpickr(datepickerInput, {
                dateFormat: "Y-m-d",
                defaultDate: "today",
                locale: "zh",
                onChange: function(selectedDates, dateStr, instance) {
                    if (selectedDates.length > 0) {
                        const newDate = selectedDates[0];
                        // Check if date actually changed to prevent infinite loops
                        if (!currentSelectedDate || formatDate(newDate) !== formatDate(currentSelectedDate)) {
                            console.log("Flatpickr onChange triggered:", dateStr);
                            changeDate(newDate);
                        }
                    }
                },
                onDayCreate: function(dObj, dStr, fp, dayElem) {
                    const dateString = formatDate(dayElem.dateObj);
                    if (findEntryByDate(dateString)) {
                        dayElem.classList.add("has-journal-entry");
                        dayElem.title = "有日记记录";
                    }
                }
            });

            // Set initial date and display
            currentSelectedDate = flatpickrInstance.selectedDates[0] || new Date();
            displayJournalEntry(currentSelectedDate); // Initial display

        } else {
            console.error("Datepicker input not found.");
            // Fallback: Show today's entry without datepicker functionality
            currentSelectedDate = new Date();
            displayJournalEntry(currentSelectedDate);
            if (prevDayBtn) prevDayBtn.disabled = true;
            if (nextDayBtn) nextDayBtn.disabled = true;
        }

        // Add button listeners
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
                    // Prevent going past today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (nextDate <= today) {
                        changeDate(nextDate);
                    }
                }
            });
        }
    }

    // Run initialization
    initialize();

});