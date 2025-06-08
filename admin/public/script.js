// personal-website/admin/public/script.js

const API_BASE_URL = 'http://localhost:3000/api'; // Assuming backend runs on port 3000

// Global variable for copy/paste
let copiedJournalData = null;

// DOM Elements
const featuredWorksList = document.getElementById('featured-works-list');
const featuredWorksForm = document.getElementById('featured-works-form');
const cancelEditWorkBtn = document.getElementById('cancel-edit-work');
const addWorkButton = document.getElementById('add-work-button'); // Added

const blogList = document.getElementById('blog-list');
const blogForm = document.getElementById('blog-form');
const cancelEditBlogBtn = document.getElementById('cancel-edit-blog');
const addBlogButton = document.getElementById('add-blog-button'); // Added
const updateFeaturedBlogButton = document.getElementById('update-featured-blog-button'); // Added

// Tool Library Elements
const toolsList = document.getElementById('tools-list');
const toolForm = document.getElementById('tool-form');
const addToolButton = document.getElementById('add-tool-button'); // Button to show the form
const cancelEditToolBtn = document.getElementById('cancel-tool-edit');

// Morning Journal Elements (Refactored)
const morningJournalSection = document.getElementById('morning-journal-management'); // Section container
// const journalHistoryBtn = document.getElementById('journal-history-button'); // Removed
const journalSettingsBtn = document.getElementById('journal-settings-button');
const importJournalBtn = document.getElementById('import-journal-button'); // Changed to file import trigger
const journalFileInput = document.getElementById('journal-file-input'); // Added file input reference
const journalSaveBtn = document.getElementById('journal-save-button');
// const journalClearBtn = document.getElementById('journal-clear-button'); // Removed
// const journalCurrentDateDiv = document.getElementById('journal-current-date'); // Removed from HTML
const journalEditIdInput = document.getElementById('journal-edit-id'); // Hidden input for ID

// Editor Fields
const journalFieldHarvest = document.getElementById('journal-field-harvest');
const journalFieldPlan = document.getElementById('journal-field-plan');
const journalFieldGratitude = document.getElementById('journal-field-gratitude');
const journalFieldInvestment = document.getElementById('journal-field-investment');
const journalFieldConnect = document.getElementById('journal-field-connect');
const journalEditableFields = [ // Array for easier iteration
    journalFieldHarvest, journalFieldPlan, journalFieldGratitude, journalFieldInvestment, journalFieldConnect
];

// Morning Journal List Container
const morningJournalListContainer = document.getElementById('morning-journal-list');
const journalDateSelector = document.getElementById('journal-date-selector'); // Added: Date selector input

// Modals
// const journalHistoryModal = document.getElementById('journal-history-modal'); // Removed
const journalSettingsModal = document.getElementById('journal-settings-modal');
// const journalHistoryContent = document.getElementById('journal-history-content'); // Removed
const journalSettingsContent = document.getElementById('journal-settings-content');
// const journalHistoryDatepicker = document.getElementById('journal-history-datepicker'); // Removed
// const journalHistoryEntriesDiv = document.getElementById('journal-history-entries'); // Removed
const exportJournalJsonBtn = document.getElementById('export-journal-json'); // Button in settings modal
const exportJournalTxtBtn = document.getElementById('export-journal-txt'); // New TXT Export button
const importJournalSettingsBtn = document.getElementById('import-journal-settings-button'); // New Settings Import button

// Settings Modal Form Elements
const settingReferenceDateInput = document.getElementById('setting-reference-date');
const settingReferenceStreakInput = document.getElementById('setting-reference-streak');
const settingGoalDaysInput = document.getElementById('setting-goal-days');
const settingGoalRewardInput = document.getElementById('setting-goal-reward');
const settingReminderTimeInput = document.getElementById('setting-reminder-time');
const saveReferenceSettingsBtn = document.getElementById('save-reference-settings');
const saveGoalSettingsBtn = document.getElementById('save-goal-settings');
const saveReminderSettingsBtn = document.getElementById('save-reminder-settings');


// Global Elements
const gitStatusDiv = document.getElementById('git-status');
const updateBackupButton = document.getElementById('update-backup-button');
const adminNav = document.getElementById('admin-nav');
const adminSections = document.querySelectorAll('.admin-section');


// --- Data Fetching ---

async function fetchData(type) {
    try {
        const response = await fetch(`${API_BASE_URL}/${type}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        return []; // Return empty array on error
    }
}

async function postData(type, data, id = null) {
    try {
        const url = id ? `${API_BASE_URL}/${type}/${id}` : `${API_BASE_URL}/${type}`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error posting ${type}:`, error);
        alert(`保存 ${type} 数据时出错: ${error.message}`);
        return null;
    }
}

async function deleteData(type, id) {
     try {
        const response = await fetch(`${API_BASE_URL}/${type}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return true; // Indicate success
    } catch (error) {
        console.error(`Error deleting ${type} with id ${id}:`, error);
        alert(`删除 ${type} 数据时出错: ${error.message}`);
        return false;
    }
}


// --- Rendering ---

function renderList(type, data) {
    let listContainer;
    let renderItemFunction;

    switch (type) {
        case 'works':
            listContainer = featuredWorksList;
            renderItemFunction = renderWorkItem;
            break;
        case 'blog':
            listContainer = blogList;
            renderItemFunction = renderBlogItem;
            break;
        case 'tools':
            listContainer = toolsList;
            renderItemFunction = renderToolItem;
            break;
        // case 'morning-journal': // Removed - Journal uses editor view now
        //     listContainer = morningJournalList;
        //     renderItemFunction = renderMorningJournalItem;
        //     break;
        default:
            console.error('Unknown type for rendering:', type);
            return;
    }

    listContainer.innerHTML = ''; // Clear previous content
    if (!data || data.length === 0) { // Added check for null/undefined data
        listContainer.innerHTML = '<p>暂无数据。</p>';
        return;
    }

    // // Sort morning journal entries by date descending before rendering (Moved to specific load function)
    // if (type === 'morning-journal') {
    //     data.sort((a, b) => new Date(b.date) - new Date(a.date));
    // }


    data.forEach((item) => {
        // Ensure item has an ID, if not, log an error or skip
        if (!item || typeof item.id === 'undefined') {
             console.error(`Item is missing or has no ID for type ${type}:`, item);
             return; // Skip rendering this item
        }
        const itemElement = renderItemFunction(item, item.id);
        listContainer.appendChild(itemElement);
    });
}

function renderWorkItem(item, id) {
    const div = document.createElement('div');
    div.classList.add('list-item');
    div.innerHTML = `
        <div class="item-content">
            <strong>${item.title || '无标题'}</strong> (${item.tag || '无标签'}) - ${(item.description || '').substring(0, 50)}...
        </div>
        <div class="item-actions">
            <button onclick="editItem('works', '${id}')">编辑</button>
            <button onclick="deleteItem('works', '${id}')">删除</button>
        </div>
    `;
    div.dataset.itemData = JSON.stringify(item);
    div.dataset.itemId = id;
    return div;
}

function renderBlogItem(item, id) {
    const div = document.createElement('div');
    div.classList.add('list-item');
    const isFeatured = item.featured === true;
    div.innerHTML = `
        <div class="item-content" style="display: flex; align-items: center;">
             <input type="checkbox" class="featured-checkbox" id="featured-${id}" data-id="${id}" style="margin-right: 5px; transform: scale(1.2);" ${isFeatured ? 'checked' : ''}>
             <label for="featured-${id}" style="margin-right: 10px; font-weight: normal; cursor: pointer;">精选</label>
            <span>
                <strong>${item.title || '无标题'}</strong> (${item.source || '无来源'}) - ${(item.summary || '').substring(0, 50)}...
            </span>
        </div>
        <div class="item-actions">
            <button onclick="editItem('blog', '${id}')">编辑</button>
            <button onclick="deleteItem('blog', '${id}')">删除</button>
        </div>
    `;
    div.dataset.itemData = JSON.stringify(item);
     div.dataset.itemId = id;
    return div;
}

function renderToolItem(item, id) {
    const div = document.createElement('div');
    div.classList.add('list-item');
    div.innerHTML = `
        <div class="item-content">
            <strong>${item.name || '无名称'}</strong> (${item.category || '无分类'}) - ${item.url || '无链接'}
        </div>
        <div class="item-actions">
            <button onclick="editItem('tools', '${id}')">编辑</button>
            <button onclick="deleteItem('tools', '${id}')">删除</button>
        </div>
    `;
    div.dataset.itemData = JSON.stringify(item);
    div.dataset.itemId = id;
    return div;
}

// // Removed renderMorningJournalItem function

// --- NEW: Function to render the Morning Journal List ---
function renderJournalList(entries) {
    if (!morningJournalListContainer) {
        console.error("Morning journal list container not found.");
        return;
    }

    // Clear previous list items AND any loading/error messages (p tags)
    const oldContent = morningJournalListContainer.querySelectorAll('.journal-list-item, p');
    oldContent.forEach(item => item.remove());

    // Explicitly remove any paragraph containing "正在加载" just in case
    const loadingParas = Array.from(morningJournalListContainer.querySelectorAll('p')).filter(p => p.textContent.includes('正在加载'));
    loadingParas.forEach(p => p.remove());


    if (!entries || !Array.isArray(entries) || entries.length === 0) {
        // Don't add "暂无历史日记" here anymore, let the empty state be handled by lack of items
        // const noEntriesMsg = document.createElement('p');
        // noEntriesMsg.textContent = '暂无历史日记。';
        // morningJournalListContainer.appendChild(noEntriesMsg);
        return;
    }

    // Sort entries by date descending (most recent first)
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    entries.forEach(entry => {
        if (!entry || !entry.id || !entry.date) {
            console.warn("Skipping invalid journal entry in list:", entry);
            return;
        }
        const div = document.createElement('div');
        div.classList.add('journal-list-item'); // Add a class for styling/selection
        div.dataset.entryId = entry.id; // Store ID for easy access
        div.dataset.entryData = JSON.stringify(entry); // Store full data

        // --- Create preview content ---
        let previewContent = '';
        const fields = ['harvest', 'plan', 'gratitude', 'investment', 'connect'];
        // Optional: Map field names to labels for preview if needed
        const labels = {'harvest': '收获', 'plan': '计划', 'gratitude': '感恩', 'investment': '定投', 'connect': '链接'};
        fields.forEach(field => {
            if (entry[field] && entry[field].trim().length > 0) {
                // Simple preview: field label + first 30 chars, strip HTML
                const previewText = entry[field].replace(/<[^>]*>?/gm, '').substring(0, 30);
                 // Use label from map or fallback to field name
                const fieldLabel = labels[field] || field.charAt(0).toUpperCase() + field.slice(1);
                previewContent += `<div class="journal-preview-field" style="font-size: 0.9em; margin-top: 3px; color: #555;"><strong>${fieldLabel}:</strong> ${previewText}...</div>`;
            }
        });
        // Show placeholder if all fields are empty
        if (!previewContent) {
            previewContent = '<div class="journal-preview-field" style="font-size: 0.9em; margin-top: 3px; color: #888;">(空日记)</div>';
        }
        // --- End Create preview content ---

        div.innerHTML = `
            <div class="journal-list-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span class="journal-list-date" style="font-weight: bold;">${entry.date}</span>
                <div class="journal-list-actions">
                     <!-- Edit button removed -->
                     <button class="journal-list-copy-btn" onclick="copyJournalEntry('${entry.id}')">复制</button>
                </div>
            </div>
            <div class="journal-list-preview">
                ${previewContent}
            </div>
        `;
        morningJournalListContainer.appendChild(div);
    });
}

// --- handleEditJournal function removed as it's no longer needed ---


// --- NEW: Function to copy journal entry content ---
function copyJournalEntry(entryId) {
    console.log(`Attempting to copy journal entry: ${entryId}`);
    if (!morningJournalListContainer) return;

    const itemElement = morningJournalListContainer.querySelector(`.journal-list-item[data-entry-id="${entryId}"]`);
    if (!itemElement || !itemElement.dataset.entryData) {
        console.error(`Could not find data for copying journal entry ID: ${entryId}`);
        alert(`无法找到用于复制的 ID 为 ${entryId} 的日记数据。`);
        return;
    }

    try {
        const entry = JSON.parse(itemElement.dataset.entryData);
        // Store only the content fields, not id or date
        copiedJournalData = {
            harvest: entry.harvest || '',
            plan: entry.plan || '',
            gratitude: entry.gratitude || '',
            investment: entry.investment || '',
            connect: entry.connect || ''
        };
        console.log('Journal entry content copied:', copiedJournalData);
        alert(`已复制日期 ${entry.date} 的日记内容。请切换到目标日期后点击“贴上”。`);

    } catch (error) {
        console.error(`Error parsing or copying journal entry data for ID ${entryId}:`, error);
        copiedJournalData = null; // Clear data on error
        alert(`复制日记内容时出错: ${error.message}`);
    }
}

// --- NEW: Function to paste copied journal entry content ---
function pasteJournalEntry() {
    if (!copiedJournalData) {
        alert("没有可粘贴的日记内容。请先从历史记录中复制。");
        return;
    }

    console.log('Pasting copied journal data into editor:', copiedJournalData);

    // Confirm before overwriting existing content? Maybe not necessary for paste.
    // if (!confirm("确定要用复制的内容覆盖当前编辑器的内容吗？")) {
    //     return;
    // }

    try {
        if (journalFieldHarvest) journalFieldHarvest.innerHTML = copiedJournalData.harvest;
        if (journalFieldPlan) journalFieldPlan.innerHTML = copiedJournalData.plan;
        if (journalFieldGratitude) journalFieldGratitude.innerHTML = copiedJournalData.gratitude;
        if (journalFieldInvestment) journalFieldInvestment.innerHTML = copiedJournalData.investment;
        if (journalFieldConnect) journalFieldConnect.innerHTML = copiedJournalData.connect;

        alert("已将复制的内容粘贴到当前编辑器。");
        // Do not clear copiedJournalData here, allow multiple pastes.
        // Do not change the date or ID.
    } catch (error) {
         console.error("Error pasting journal content:", error);
         alert(`粘贴日记内容时出错: ${error.message}`);
    }
}

// --- Form Handling ---

// Refactored: handleFormSubmit is no longer used for morning journal
async function handleFormSubmit(event, type) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    let data = Object.fromEntries(formData.entries());
    const editIdInput = form.querySelector(`input[type="hidden"]`);
    const editId = editIdInput ? editIdInput.value : null;

    // --- Handle Dropdown "New" Option ---
    if (type === 'blog') {
        const sourceSelect = form.elements['source'];
        const newSourceInput = form.elements['source-new'];
        if (sourceSelect && newSourceInput && sourceSelect.value === '--new--' && newSourceInput.value.trim()) {
            data.source = newSourceInput.value.trim();
        }
        delete data['source-new'];
    } else if (type === 'works') {
        const typeSelect = form.elements['type'];
        const newTypeInput = form.elements['type-new'];
        if (typeSelect && newTypeInput && typeSelect.value === '--new--' && newTypeInput.value.trim()) {
            data.type = newTypeInput.value.trim();
        }
         delete data['type-new'];
    }

    // Special handling for tags
    if ((type === 'tools' || type === 'blog') && data.tags && typeof data.tags === 'string') {
        data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
   }

   // Exclude morning journal from this generic handler
   if (type === 'morning-journal') {
       console.warn('handleFormSubmit called for morning-journal, which should use its own handler.');
       return;
   }

   console.log(`Submitting ${type} data:`, data, "with ID:", editId);

   const result = await postData(type, data, editId);

   if (result) {
        console.log(`${type} saved successfully:`, result);
        alert(`${type} 保存成功! (正在后台尝试推送到 GitHub...)`);
        form.reset();
        if(editIdInput) editIdInput.value = '';
        form.style.display = 'none'; // Hide form after successful save
        const cancelButton = form.querySelector('button[type="button"]'); // Find cancel button within the specific form
        if (cancelButton) cancelButton.style.display = 'none';

        // --- Direct DOM Manipulation for ADD/EDIT ---
        // We'll reload the whole list for simplicity and consistency now
        // loadAllData(); // Reload all data might be too broad, let's reload specific type

        // Reload data for the specific type to update the list
        const updatedData = await fetchData(type);
        renderList(type, updatedData);

        // Start polling for Git status
        pollGitStatus();
    }
}

function editItem(type, id) {
    console.log(`Editing ${type} item with id: ${id}`);
    let form;
    let listContainer;
    let cancelBtn;

     switch (type) {
        case 'works':
            form = featuredWorksForm;
            listContainer = featuredWorksList;
            cancelBtn = cancelEditWorkBtn;
            break;
        case 'blog':
            form = blogForm;
            listContainer = blogList;
            cancelBtn = cancelEditBlogBtn;
            break;
        case 'tools':
            form = toolForm;
            listContainer = toolsList;
            cancelBtn = cancelEditToolBtn;
            break;
        // case 'morning-journal': // Removed - Journal uses editor view now
        //     form = morningJournalForm;
        //     listContainer = morningJournalList;
        //     cancelBtn = cancelEditJournalBtn;
        //     break;
        default: return;
    }

    // Find the item element
    // Find the item element in the correct list
    const itemElement = listContainer ? listContainer.querySelector(`div[data-item-id="${id}"]`) : null;
    if (!itemElement || !itemElement.dataset.itemData) {
        console.error(`Could not find item data for editing ${type} with id: ${id}`);
        return;
    }

    const itemData = JSON.parse(itemElement.dataset.itemData);

    // Populate the form
    for (const key in itemData) {
        // Ensure the form has an element with that name
        if (form.elements[key]) {
            const formElement = form.elements[key];
            // Handle tags array specifically
            if ((type === 'tools' || type === 'blog') && key === 'tags' && Array.isArray(itemData[key])) {
                 formElement.value = itemData[key].join(', ');
            } else if (formElement.tagName === 'SELECT') {
                 // Handle select elements
                 let optionExists = Array.from(formElement.options).some(opt => opt.value === itemData[key]);
                 if (optionExists) {
                     formElement.value = itemData[key];
                     const newTextInput = form.elements[`${key}-new`];
                     if (newTextInput) newTextInput.style.display = 'none';
                 } else if (form.elements[`${key}-new`]) {
                     formElement.value = '--new--';
                     const newTextInput = form.elements[`${key}-new`];
                     newTextInput.value = itemData[key];
                     newTextInput.style.display = 'block';
                 } else {
                      console.warn(`Value "${itemData[key]}" for field "${key}" not found in select options.`);
                      if (formElement.options.length > 0) formElement.selectedIndex = 0;
                 }
            } else if (formElement.type === 'date' && key === 'date') {
                 // Format date correctly for input type="date" (YYYY-MM-DD)
                 try {
                     formElement.value = new Date(itemData[key]).toISOString().split('T')[0];
                 } catch (e) {
                     console.error("Error formatting date for input:", itemData[key], e);
                     formElement.value = ''; // Clear if invalid
                 }
            } else {
                formElement.value = itemData[key];
            }
        }
    }
     // Set the hidden ID field
    const editIdInput = form.querySelector(`input[type="hidden"]`);
    if (editIdInput) {
        editIdInput.value = id;
    }

    // Show the form and cancel button
    form.style.display = 'block';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    form.scrollIntoView({ behavior: 'smooth' });
}

async function deleteItem(type, id) {
    if (confirm(`确定要删除这个 ${type} 条目吗？`)) {
        const success = await deleteData(type, id);
        if (success) {
            alert(`${type} 删除成功!`);

            // --- Direct DOM Manipulation for DELETE ---
            let listContainer;
            if (type === 'works') listContainer = featuredWorksList;
            else if (type === 'blog') listContainer = blogList;
            else if (type === 'tools') listContainer = toolsList;
            // else if (type === 'morning-journal') listContainer = morningJournalList; // Removed

            if (listContainer) {
                const itemElement = listContainer.querySelector(`.list-item[data-item-id="${id}"]`);
                if (itemElement) {
                    itemElement.remove();
                    if (listContainer.children.length === 0) {
                        listContainer.innerHTML = '<p>暂无数据。</p>';
                    }
                }
            }

            // No need to call loadAllData() if DOM is manipulated directly
            // const updatedData = await fetchData(type); // Reload specific type
            // renderList(type, updatedData); // Re-render the list

            pollGitStatus(); // Start polling for Git status
        }
    }
}


function cancelEdit(type) {
     let form;
     let cancelBtn;
     let editIdInput;

      switch (type) {
        case 'works':
            form = featuredWorksForm;
            cancelBtn = cancelEditWorkBtn;
            editIdInput = document.getElementById('work-edit-id');
            break;
        case 'blog':
            form = blogForm;
            cancelBtn = cancelEditBlogBtn;
            editIdInput = document.getElementById('blog-edit-id');
            break;
        case 'tools':
            form = toolForm;
            cancelBtn = cancelEditToolBtn;
            editIdInput = document.getElementById('tool-id');
            break;
        // case 'morning-journal': // Removed
        //     form = morningJournalForm;
        //     cancelBtn = cancelEditJournalBtn;
        //     editIdInput = document.getElementById('journal-edit-id');
        //     break;
        default: return;
    }
    form.reset();
    if (editIdInput) editIdInput.value = '';
    if (cancelBtn) cancelBtn.style.display = 'none';
    form.style.display = 'none'; // Hide the form on cancel
}


// --- Dropdown Population ---

const toolCategories = ['AI 生成', '开发工具', '效率助手', '图像影音处理', '休闲娱乐'];

function populateSelectWithOptions(selectElement, options, includeNewOption = false) {
    if (!selectElement) return; // Guard against null element
    selectElement.innerHTML = '';
    options.forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        selectElement.appendChild(option);
    });
    if (includeNewOption) {
        const newOption = document.createElement('option');
        newOption.value = '--new--';
        newOption.textContent = '新增...';
        selectElement.appendChild(newOption);
    }
}

function setupDynamicSelect(selectElementId, newTextInputId) {
    const selectElement = document.getElementById(selectElementId);
    const newTextInput = document.getElementById(newTextInputId);
    if (selectElement && newTextInput) {
        selectElement.addEventListener('change', () => {
            const isNew = selectElement.value === '--new--';
            newTextInput.style.display = isNew ? 'block' : 'none';
            newTextInput.required = isNew;
            if (!isNew) newTextInput.value = '';
        });
        // Initial state
        const isNewInitially = selectElement.value === '--new--';
        newTextInput.style.display = isNewInitially ? 'block' : 'none';
        newTextInput.required = isNewInitially;
    }
}


// --- Morning Journal Specific Functions ---

// Get current date in YYYY-MM-DD format
function getCurrentDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Update the date selector input value
function updateJournalDateDisplay(dateString) {
    // Update the date selector input
    if (journalDateSelector && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
         journalDateSelector.value = dateString;
    } else if (journalDateSelector) {
         journalDateSelector.value = ''; // Clear if date is invalid or null
         console.warn("updateJournalDateDisplay called with invalid date:", dateString);
    }
    // Removed update for journalCurrentDateDiv as it's deleted from HTML
}

// Clear the editor fields and ID
function clearJournalEditor() {
    journalEditableFields.forEach(field => {
        if (field) field.innerHTML = ''; // Clear content
    });
    if (journalEditIdInput) journalEditIdInput.value = ''; // Clear hidden ID
    updateJournalDateDisplay(getCurrentDateString()); // Reset date display to today
    console.log('Journal editor cleared.');
}

// Load a specific journal entry into the editor
async function loadJournalEntry(dateString) {
    console.log(`Attempting to load journal entry for date: ${dateString}`);
    clearJournalEditor(); // Clear existing content first
    updateJournalDateDisplay(dateString); // Update display to the target date

    try {
        // Fetch all entries first to find the specific one (or implement a specific GET /api/morningJournal/:id endpoint later)
        const allEntries = await fetchData('morningJournal'); // Fix case
        const entry = allEntries.find(item => item.id === dateString);

        if (entry) {
            console.log('Found entry:', entry);
            if (journalFieldHarvest) journalFieldHarvest.innerHTML = entry.harvest || '';
            if (journalFieldPlan) journalFieldPlan.innerHTML = entry.plan || '';
            if (journalFieldGratitude) journalFieldGratitude.innerHTML = entry.gratitude || '';
            if (journalFieldInvestment) journalFieldInvestment.innerHTML = entry.investment || '';
            if (journalFieldConnect) journalFieldConnect.innerHTML = entry.connect || '';
            if (journalEditIdInput) journalEditIdInput.value = entry.id; // Set the hidden ID for potential update
        } else {
            console.log(`No entry found for ${dateString}. Editor remains clear for new entry.`);
            // Keep editor clear, ID empty, date display shows the target date
            if (journalEditIdInput) journalEditIdInput.value = ''; // Ensure ID is cleared
        }
    } catch (error) {
        console.error(`Error loading journal entry for ${dateString}:`, error);
        alert(`加载日期 ${dateString} 的日记时出错。`);
        clearJournalEditor(); // Clear editor on error
    }
}

// Save the current content of the journal editor
async function saveJournalEntry() {
    const entryId = journalEditIdInput ? journalEditIdInput.value : null; // Check if we are editing an existing entry
    const entryDate = journalDateSelector ? journalDateSelector.value : getCurrentDateString(); // Get date from the date selector

    // Basic validation for date
    if (!entryDate || !/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
        alert('无效的日记日期格式。请确保日期显示正确。');
        return;
    }

    const dataToSave = {
        id: entryId || entryDate, // Use existing ID if updating, otherwise use date as ID
        date: entryDate,
        harvest: journalFieldHarvest ? journalFieldHarvest.innerHTML : '',
        plan: journalFieldPlan ? journalFieldPlan.innerHTML : '',
        gratitude: journalFieldGratitude ? journalFieldGratitude.innerHTML : '',
        investment: journalFieldInvestment ? journalFieldInvestment.innerHTML : '',
        connect: journalFieldConnect ? journalFieldConnect.innerHTML : ''
    };

    console.log(`Saving journal entry for date ${entryDate}. Existing ID: ${entryId}. Data:`, dataToSave);

    // Determine if it's POST (new) or PUT (update)
    const method = entryId ? 'PUT' : 'POST';
    const urlId = entryId ? `/${entryId}` : ''; // Append ID for PUT requests

    journalSaveBtn.disabled = true;
    journalSaveBtn.textContent = '保存中...';

    try {
        const result = await postData('morningJournal', dataToSave, entryId); // Fix case, Use postData helper

        if (result) {
            console.log('Journal entry saved successfully:', result);
            alert(`日期 ${entryDate} 的日记保存成功！`);
            // Update the hidden ID field in case it was a new entry
            if (result.item && result.item.id && journalEditIdInput) {
                journalEditIdInput.value = result.item.id;
            }
            pollGitStatus(); // Check Git status after save
            await refreshCalendarHighlights(); // Refresh calendar highlights after save
        } else {
            // Error handling is done within postData, alert was shown there
            console.error('Failed to save journal entry.');
        }
    } catch (error) {
        // This catch might be redundant if postData handles all errors, but good for safety
        console.error('Error during saveJournalEntry:', error);
        alert(`保存日记时发生意外错误: ${error.message}`);
    } finally {
        journalSaveBtn.disabled = false;
        journalSaveBtn.textContent = '保存日记';
    }
}


// --- Modal Handling ---
function openModal(modalElement) {
    if (modalElement) {
        modalElement.classList.add('active');
        // Optional: Add logic when modal opens
        // if (modalElement.id === 'journal-history-modal') { // Removed history logic
        //     loadJournalHistory();
        // }
    }
}

function closeModal(modalElement) {
    if (modalElement) {
        modalElement.classList.remove('active');
    }
}

// --- Morning Journal Import (File-based) & Export ---

// // Removed History related variables and functions...

// --- File Import Logic ---
async function importJournalFromFile(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log("No file selected.");
        return;
    }

    console.log(`Attempting to import from file: ${file.name}, type: ${file.type}`);

    // Basic check for JSON type (can be refined)
    if (file.type !== 'application/json' && !file.name.toLowerCase().endsWith('.json') && file.type !== 'text/plain' && !file.name.toLowerCase().endsWith('.txt')) {
         alert('请选择一个 JSON (.json) 或 TXT (.txt) 文件。');
         event.target.value = null; // Reset file input
         return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
        const fileContent = e.target.result;
        let entriesToImport;

        try {
            // Attempt to parse as JSON first
            if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
                 entriesToImport = JSON.parse(fileContent);
            } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
                // Basic TXT parsing (assuming one entry per line, JSON format per line)
                // This is a simple example, adjust based on actual TXT format if needed
                entriesToImport = fileContent.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0 && line.startsWith('{') && line.endsWith('}')) // Basic check for JSON object line
                    .map(line => JSON.parse(line));
                if (entriesToImport.length === 0 && fileContent.trim().length > 0) {
                     throw new Error("TXT 文件内容无法解析为有效的日记条目行。请确保每行是一个有效的 JSON 对象。");
                }
            } else {
                 throw new Error("不支持的文件类型。");
            }


            if (!Array.isArray(entriesToImport)) {
                throw new Error("文件内容解析后不是一个数组。请确保文件包含一个 JSON 数组或每行一个 JSON 对象 (TXT)。");
            }
            if (entriesToImport.length === 0) {
                 alert('文件中没有找到有效的日记条目。');
                 return;
            }

            // Validate structure of each entry (basic check)
            const validEntries = entriesToImport.filter(item =>
                item && typeof item.id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.id) && item.date === item.id // Ensure date matches ID
                // Add more checks if needed (e.g., check for harvest, plan etc.)
            );

            if (validEntries.length !== entriesToImport.length) {
                console.warn(`Import validation: ${entriesToImport.length - validEntries.length} invalid entries skipped.`);
                alert(`警告：文件中发现 ${entriesToImport.length - validEntries.length} 条格式无效的条目已被跳过。`);
            }

            if (validEntries.length === 0) {
                alert('文件中没有找到任何格式有效的日记条目。请确保条目包含有效的 "id" 和 "date" (YYYY-MM-DD)，且两者相同。');
                return;
            }

            console.log(`Found ${validEntries.length} valid entries in file.`);

            // Confirmation dialog
            if (!confirm(`即将从文件 "${file.name}" 导入 ${validEntries.length} 条日记。\n\n注意：\n- 如果服务器上已存在相同日期的日记，导入的数据将覆盖服务器上的数据。\n\n是否继续？`)) {
                return;
            }

            // --- Call backend import endpoint ---
            importJournalBtn.disabled = true;
            importJournalBtn.textContent = '导入中...';

            try {
                // Reusing the same endpoint as LocalStorage import for now
                const response = await fetch(`${API_BASE_URL}/morningJournal/import-localstorage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(validEntries), // Send only valid entries
                });

                const resultText = await response.text();

                if (!response.ok && response.status !== 207) {
                    let detail = resultText;
                    try { const errorJson = JSON.parse(resultText); detail = errorJson.message || JSON.stringify(errorJson); } catch (e) { /* Ignore */ }
                    if (resultText.includes('<pre>') && resultText.includes('</pre>')) { detail = resultText.split('<pre>')[1].split('</pre>')[0]; }
                    throw new Error(`HTTP error! status: ${response.status}, message: ${detail}`);
                }

                // Handle response (200 OK or 207 Multi-Status)
                let successCount = validEntries.length;
                let failureCount = 0;
                let messages = [];
                if (response.status === 207) {
                    try {
                        const multiStatusResult = JSON.parse(resultText);
                        successCount = multiStatusResult.successCount || 0;
                        failureCount = multiStatusResult.failureCount || 0;
                        messages = multiStatusResult.messages || [];
                        alert(`导入部分完成。\n成功: ${successCount}\n失败: ${failureCount}\n详情:\n${messages.join('\n')}`);
                    } catch (e) {
                        console.error("Error parsing 207 Multi-Status response:", e);
                        alert(`导入完成，但无法解析服务器返回的详细状态: ${resultText}`);
                    }
                } else {
                    try {
                        const okResult = JSON.parse(resultText);
                        alert(`成功从文件导入 ${validEntries.length} 条日记！ (${okResult.message || ''})`);
                    } catch (e) {
                        console.error("Error parsing 200 OK response:", e);
                        alert(`导入完成，但无法解析服务器响应: ${resultText}`);
                    }
                }
                console.log(`File import finished. Success: ${successCount}, Failures: ${failureCount}`);
                loadJournalEntry(journalCurrentDateDiv ? journalCurrentDateDiv.textContent : getCurrentDateString()); // Reload current view

            } catch (error) {
                console.error('Error during file import API call:', error);
                alert(`文件导入过程中发生错误: ${error.message}`);
            } finally {
                importJournalBtn.disabled = false;
                importJournalBtn.textContent = '从文件导入';
            }

        } catch (error) {
            console.error("Error reading or parsing file:", error);
            alert(`读取或解析文件 "${file.name}" 时出错: ${error.message}`);
        } finally {
             event.target.value = null; // Reset file input regardless of success/failure
        }
    };

    reader.onerror = (e) => {
        console.error("Error reading file:", e);
        alert(`读取文件 "${file.name}" 时出错。`);
        event.target.value = null; // Reset file input
    };

    reader.readAsText(file); // Read file as text
}
// --- End File Import Logic ---


// --- File Import Logic ---
async function importJournalFromFile(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log("No file selected.");
        return;
    }

    console.log(`Attempting to import from file: ${file.name}, type: ${file.type}`);

    // Basic check for JSON or TXT type
    if (file.type !== 'application/json' && !file.name.toLowerCase().endsWith('.json') && file.type !== 'text/plain' && !file.name.toLowerCase().endsWith('.txt')) {
         alert('请选择一个 JSON (.json) 或 TXT (.txt) 文件。');
         event.target.value = null; // Reset file input
         return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
        const fileContent = e.target.result;
        let entriesToImport;

        try {
            let parsedData;
            // Attempt to parse based on type/extension
            if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
                 parsedData = JSON.parse(fileContent);
            } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
                // Basic TXT parsing (assuming one entry per line, JSON format per line)
                // This part remains the same, expecting an array-like structure in TXT
                let txtEntries = fileContent.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0 && line.startsWith('{') && line.endsWith('}')) // Basic check
                    .map(line => JSON.parse(line));
                if (txtEntries.length === 0 && fileContent.trim().length > 0) {
                     throw new Error("TXT 文件内容无法解析为有效的日记条目行。请确保每行是一个有效的 JSON 对象。");
                }
                 parsedData = txtEntries; // Treat parsed lines as the data
            } else {
                 throw new Error("不支持的文件类型。");
            }

            let finalEntriesArray;

            // --- NEW: Handle drawing-app export format ---
            if (typeof parsedData === 'object' && parsedData !== null && parsedData.diaryEntries && typeof parsedData.diaryEntries === 'object') {
                console.log("Detected drawing-app export format. Processing diaryEntries object.");
                finalEntriesArray = Object.entries(parsedData.diaryEntries).map(([dateKey, entryData]) => {
                    // Validate dateKey format
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
                        console.warn(`Skipping entry with invalid date key: ${dateKey}`);
                        return null; // Skip invalid entries
                    }
                    // Construct the entry object in the expected format
                    return {
                        id: dateKey, // Use the date key as the ID
                        date: dateKey, // Add the date field
                        harvest: entryData.harvest || '',
                        plan: entryData.plan || '',
                        gratitude: entryData.gratitude || '',
                        investment: entryData.investment || '',
                        connect: entryData.connect || ''
                        // Add other fields if necessary
                    };
                }).filter(entry => entry !== null); // Remove null entries from skipped invalid keys

                if (finalEntriesArray.length === 0) {
                     alert('在 drawing-app 格式文件中找到了 diaryEntries，但未能提取任何有效日期的条目。');
                     return;
                }
                console.log(`Processed ${finalEntriesArray.length} entries from drawing-app format.`);

            } else if (Array.isArray(parsedData)) {
                 // Handle the original expected format (array of entries)
                 console.log("Detected standard array format.");
                 finalEntriesArray = parsedData;
            } else {
                 // If it's neither the drawing-app format nor an array
                 throw new Error("文件内容解析后既不是预期的数组格式，也不是可识别的 drawing-app 导出对象格式。");
            }
            // --- END drawing-app format handling ---


            if (finalEntriesArray.length === 0) {
                 alert('文件中没有找到有效的日记条目。');
                 return;
            }

            // Validate structure of each entry in the final array (basic check)
            // This validation now applies to both formats after transformation
            const validEntries = finalEntriesArray.filter(item =>
                item && typeof item.id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.id) && item.date === item.id // Ensure date matches ID
                // Add more checks if needed (e.g., check for harvest, plan etc.)
            );

            if (validEntries.length !== finalEntriesArray.length) {
                console.warn(`Import validation: ${finalEntriesArray.length - validEntries.length} invalid entries skipped (missing/mismatched ID or date).`);
                alert(`警告：文件中发现 ${finalEntriesArray.length - validEntries.length} 条格式无效的条目已被跳过 (ID或日期格式错误/不匹配)。`);
            }

            if (validEntries.length === 0) {
                alert('文件中没有找到任何格式有效的日记条目。请确保条目包含有效的 "id" 和 "date" (YYYY-MM-DD)，且两者相同。');
                return;
            }

            console.log(`Found ${validEntries.length} valid entries to import.`);

            // Confirmation dialog
            if (!confirm(`即将从文件 "${file.name}" 导入 ${validEntries.length} 条日记。\n\n注意：\n- 如果服务器上已存在相同日期的日记，导入的数据将覆盖服务器上的数据。\n\n是否继续？`)) {
                return;
            }

            // --- Call backend import endpoint ---
            importJournalBtn.disabled = true;
            importJournalBtn.textContent = '导入中...';

            try {
                // Reusing the same endpoint as LocalStorage import for now
                const response = await fetch(`${API_BASE_URL}/morningJournal/import-localstorage`, { // Corrected API endpoint case
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(validEntries), // Send only valid entries
                });

                const resultText = await response.text();

                if (!response.ok && response.status !== 207) { // Allow 207 Multi-Status
                    let detail = resultText;
                    try { const errorJson = JSON.parse(resultText); detail = errorJson.message || JSON.stringify(errorJson); } catch (e) { /* Ignore */ }
                    if (resultText.includes('<pre>') && resultText.includes('</pre>')) { detail = resultText.split('<pre>')[1].split('</pre>')[0]; }
                    throw new Error(`HTTP error! status: ${response.status}, message: ${detail}`);
                }

                // Handle response (200 OK or 207 Multi-Status)
                let successCount = validEntries.length;
                let failureCount = 0;
                let messages = [];
                if (response.status === 207) {
                    try {
                        const multiStatusResult = JSON.parse(resultText);
                        successCount = multiStatusResult.successCount || 0;
                        failureCount = multiStatusResult.failureCount || 0;
                        messages = multiStatusResult.messages || [];
                        alert(`导入部分完成。\n成功: ${successCount}\n失败: ${failureCount}\n详情:\n${messages.join('\n')}`);
                    } catch (e) {
                        console.error("Error parsing 207 Multi-Status response:", e);
                        alert(`导入完成，但无法解析服务器返回的详细状态: ${resultText}`);
                    }
                } else { // 200 OK
                    try {
                        const okResult = JSON.parse(resultText);
                        alert(`成功从文件导入 ${validEntries.length} 条日记！ (${okResult.message || ''})`);
                    } catch (e) {
                        console.error("Error parsing 200 OK response:", e);
                        alert(`导入完成，但无法解析服务器响应: ${resultText}`);
                    }
                }
                console.log(`File import finished. Success: ${successCount}, Failures: ${failureCount}`);
                await refreshCalendarHighlights(); // Refresh calendar highlights after import

                // --- Reload data, render list, AND display the latest entry after import ---
                try {
                    console.log("Reloading all journal entries after import...");
                    const allEntries = await fetchData('morningJournal'); // Fetch updated data

                    // Render the list with all entries
                    renderJournalList(allEntries);

                    // Load the latest entry into the editor
                    if (allEntries && allEntries.length > 0) {
                        // Sorting is now done in renderJournalList, but we still need it here to find latest
                        const sortedEntries = [...allEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
                        const latestDate = sortedEntries[0].date;
                        console.log(`Loading latest entry from date: ${latestDate} into editor.`);
                        await loadJournalEntry(latestDate); // Load the latest entry into editor
                    } else {
                        console.log("No entries found after import, clearing editor.");
                        clearJournalEditor(); // Clear editor if no entries exist
                    }

                } catch (loadError) {
                    console.error("Error reloading journal entries after import:", loadError);
                    alert("导入成功，但在重新加载日记列表或编辑器时出错。请手动选择日期查看。");
                    // Fallback: Clear editor and list
                    clearJournalEditor();
                    if (morningJournalListContainer) {
                         morningJournalListContainer.innerHTML = '<h4>历史日记列表</h4><p>加载列表时出错。</p>'; // Keep title
                    }
                }
                // --- END Reload/Render Logic ---

            } catch (error) {
                console.error('Error during file import API call:', error);
                alert(`文件导入过程中发生错误: ${error.message}`);
            } finally {
                importJournalBtn.disabled = false;
                importJournalBtn.textContent = '从文件导入';
            }

        } catch (error) {
            console.error("Error reading or parsing file:", error);
            alert(`读取或解析文件 "${file.name}" 时出错: ${error.message}`);
        } finally {
             event.target.value = null; // Reset file input regardless of success/failure
        }
    };

    reader.onerror = (e) => {
        console.error("Error reading file:", e);
        alert(`读取文件 "${file.name}" 时出错。`);
        event.target.value = null; // Reset file input
    };

    reader.readAsText(file); // Read file as text
}
// --- End File Import Logic ---


// Export all journal entries to a JSON file
async function exportJournalToJson() {
    console.log("Exporting journal entries to JSON...");
    if (!exportJournalJsonBtn) return; // Guard clause

    exportJournalJsonBtn.disabled = true;
    exportJournalJsonBtn.textContent = '导出中...';

    try {
        const allEntries = await fetchData('morningJournal'); // Fix case, Fetch latest data
        if (!allEntries || allEntries.length === 0) {
            alert('没有日记条目可供导出。');
            return;
        }

        // Sort entries by date ascending for the export file
        allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

        const jsonData = JSON.stringify(allEntries, null, 2); // Pretty print JSON
        const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' }); // Specify charset
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `morning-journal-export-${timestamp}.json`;

        // Create temporary link to trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a); // Append link to body
        a.click(); // Simulate click to download
        document.body.removeChild(a); // Remove link from body
        URL.revokeObjectURL(url); // Release object URL

        console.log("Journal entries exported successfully.");
        alert(`已成功导出 ${allEntries.length} 条日记到 ${filename}`);

    } catch (error) {
        console.error('Error exporting journal entries:', error);
        alert(`导出日记时出错: ${error.message}`);
    } finally {
        exportJournalJsonBtn.disabled = false;
        exportJournalJsonBtn.textContent = '导出为 JSON';
    }
}


// --- Journal Settings Functions ---

// Fetch settings from backend and populate the modal form
async function loadJournalSettings() {
    console.log("Loading journal settings...");
    try {
        const response = await fetch(`${API_BASE_URL}/journal-settings`); // Use new endpoint
        if (!response.ok) {
            // Handle case where settings file might not exist yet (404) or other errors
            if (response.status === 404) {
                console.warn("Journal settings file not found (404). Using defaults.");
                // Populate with defaults or leave empty? Let's use defaults from the frontend file structure idea
                if (settingReferenceDateInput) settingReferenceDateInput.value = "2024-01-01";
                if (settingReferenceStreakInput) settingReferenceStreakInput.value = 0;
                if (settingGoalDaysInput) settingGoalDaysInput.value = 100;
                if (settingGoalRewardInput) settingGoalRewardInput.value = "去旅行";
                if (settingReminderTimeInput) settingReminderTimeInput.value = "06:00";
                return; // Exit after setting defaults
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const settings = await response.json();
        console.log("Received settings:", settings);

        // Populate form fields
        if (settingReferenceDateInput) settingReferenceDateInput.value = settings.referenceDate || '';
        if (settingReferenceStreakInput) settingReferenceStreakInput.value = settings.referenceStreak !== undefined ? settings.referenceStreak : 0;
        if (settingGoalDaysInput) settingGoalDaysInput.value = settings.goalDays !== undefined ? settings.goalDays : 100;
        if (settingGoalRewardInput) settingGoalRewardInput.value = settings.goalReward || '';
        if (settingReminderTimeInput) settingReminderTimeInput.value = settings.reminderTime || '06:00';

    } catch (error) {
        console.error("Error loading journal settings:", error);
        alert(`加载日记设置时出错: ${error.message}\n\n将使用默认值。`);
        // Optionally set default values here as well on error
        if (settingReferenceDateInput) settingReferenceDateInput.value = "2024-01-01";
        if (settingReferenceStreakInput) settingReferenceStreakInput.value = 0;
        if (settingGoalDaysInput) settingGoalDaysInput.value = 100;
        if (settingGoalRewardInput) settingGoalRewardInput.value = "去旅行";
        if (settingReminderTimeInput) settingReminderTimeInput.value = "06:00";
    }
}

// Save the current settings form values to the backend
async function saveJournalSettings(buttonElement) {
    console.log("Attempting to save journal settings...");
    if (!settingReferenceDateInput || !settingReferenceStreakInput || !settingGoalDaysInput || !settingGoalRewardInput || !settingReminderTimeInput) {
        alert("设置表单元素加载不完整，无法保存。");
        return;
    }

    // Disable button during save
    if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = '保存中...';
    }

    // Gather all settings from the form
    const settingsToSave = {
        referenceDate: settingReferenceDateInput.value || "2024-01-01", // Default if empty
        referenceStreak: parseInt(settingReferenceStreakInput.value, 10) || 0, // Default to 0 if invalid/empty
        goalDays: parseInt(settingGoalDaysInput.value, 10) || 100, // Default to 100
        goalReward: settingGoalRewardInput.value.trim(),
        reminderTime: settingReminderTimeInput.value || "06:00" // Default if empty
    };

    // Basic validation
    if (isNaN(settingsToSave.referenceStreak) || settingsToSave.referenceStreak < 0) {
        alert("参考日更天数必须是一个非负整数。");
        if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = '保存设置'; } // Re-enable button
        return;
    }
    if (isNaN(settingsToSave.goalDays) || settingsToSave.goalDays <= 0) {
        alert("目标天数必须是一个正整数。");
        if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = '保存设置'; } // Re-enable button
        return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(settingsToSave.referenceDate)) {
         alert("参考日期格式无效，请使用 YYYY-MM-DD 格式。");
         if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = '保存设置'; } // Re-enable button
         return;
    }
     if (!/^\d{2}:\d{2}$/.test(settingsToSave.reminderTime)) {
         alert("提醒时间格式无效，请使用 HH:MM 格式。");
         if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = '保存设置'; } // Re-enable button
         return;
    }


    console.log("Settings to save:", settingsToSave);

    try {
        const response = await fetch(`${API_BASE_URL}/journal-settings`, { // Use new endpoint
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsToSave),
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
        }

        const result = await response.json();
        console.log("Settings saved successfully:", result);
        alert("日记设置已成功保存！");
        pollGitStatus(); // Optionally trigger Git check after saving settings

        // Optionally close the modal after successful save
        // closeModal(journalSettingsModal);

    } catch (error) {
        console.error("Error saving journal settings:", error);
        alert(`保存日记设置时出错: ${error.message}`);
    } finally {
         // Re-enable the specific button that was clicked
        if (buttonElement) {
             buttonElement.disabled = false;
             // Reset text based on which button it was (could be more dynamic)
             if (buttonElement.id === 'save-reference-settings') buttonElement.textContent = '保存参考设置';
             else if (buttonElement.id === 'save-goal-settings') buttonElement.textContent = '保存目标与奖励';
             else if (buttonElement.id === 'save-reminder-settings') buttonElement.textContent = '设置';
             else buttonElement.textContent = '保存设置'; // Fallback
        }
    }
}

// Export all journal entries to a TXT file (one JSON object per line)
async function exportJournalToTxt() {
    console.log("Exporting journal entries to TXT...");
    if (!exportJournalTxtBtn) return;

    exportJournalTxtBtn.disabled = true;
    exportJournalTxtBtn.textContent = '导出中...';

    try {
        const allEntries = await fetchData('morningJournal');
        if (!allEntries || allEntries.length === 0) {
            alert('没有日记条目可供导出。');
            return;
        }

        // Sort entries by date ascending for the export file
        allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Format each entry as a single-line JSON string
        const txtData = allEntries.map(entry => JSON.stringify(entry)).join('\n'); // Join with newline

        const blob = new Blob([txtData], { type: 'text/plain;charset=utf-8' }); // Use text/plain
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `morning-journal-export-${timestamp}.txt`; // Change extension

        // Trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log("Journal entries exported successfully to TXT.");
        alert(`已成功导出 ${allEntries.length} 条日记到 ${filename}`);

    } catch (error) {
        console.error('Error exporting journal entries to TXT:', error);
        alert(`导出日记为 TXT 时出错: ${error.message}`);
    } finally {
        exportJournalTxtBtn.disabled = false;
        exportJournalTxtBtn.textContent = '导出为 TXT';
    }
}


// --- Initialization ---

async function loadAllData() {
    // Fetch all data concurrently (excluding journal for now, will load separately)
    const [worksData, blogData, toolsData] = await Promise.all([
        fetchData('works'),
        fetchData('blog'),
        fetchData('tools'),
        // fetchData('morning-journal') // Fetch journal data later
    ]);

    // Render lists (excluding journal)
    renderList('works', worksData);
    renderList('blog', blogData);
    renderList('tools', toolsData);
    // renderList('morning-journal', journalData); // Removed

    // Populate dropdowns
    const workTypes = [...new Set(worksData.map(item => item.type))].sort();
    populateSelectWithOptions(document.getElementById('work-type'), workTypes, true);

    const blogSources = [...new Set(blogData.map(item => item.source))].sort();
    populateSelectWithOptions(document.getElementById('blog-source'), blogSources, true);

    populateSelectWithOptions(document.getElementById('tool-category'), toolCategories, false);

    // Setup dynamic behavior for 'new' options
    setupDynamicSelect('work-type', 'work-type-new');
    setupDynamicSelect('blog-source', 'blog-source-new');

}

// --- Git Status Polling ---
let pollingIntervalId = null;
const pollingInterval = 5000;
let isPolling = false;
let gitStatusHideTimeoutId = null;

async function checkGitStatus() {
    if (isPolling) return;
    isPolling = true;
    console.log(`Checking last Git status...`);
    try {
        const response = await fetch(`/api/git-status/last`);
        if (!response.ok) {
            if (response.status === 404) {
                 console.warn('Git status endpoint not found (404).');
                 updateGitStatusUI({ status: 'error', message: '无法获取状态 (404)' });
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } else {
            const statusData = await response.json();
            console.log(`Received last status:`, statusData);
            updateGitStatusUI(statusData);
            if (statusData.status !== 'pending') {
                stopPolling();
            }
        }
    } catch (error) {
        console.error(`Error checking last Git status:`, error);
        updateGitStatusUI({ status: 'error', message: '检查状态时出错' });
    } finally {
        isPolling = false;
    }
}

function updateGitStatusUI(statusData) {
    if (!gitStatusDiv) {
        console.warn(`Global status div not found: #git-status`);
        return;
    }

    if (gitStatusHideTimeoutId) {
        clearTimeout(gitStatusHideTimeoutId);
        gitStatusHideTimeoutId = null;
    }

    let statusText = `最近推送状态: `;
    let statusColor = '#666';
    let showDiv = true;
    let autoHideDelay = 5000;

    if (!statusData || !statusData.status) {
        statusText += '未知';
        statusColor = '#ccc';
        showDiv = false;
    } else {
        const timeString = statusData.timestamp ? `(${new Date(statusData.timestamp).toLocaleTimeString()})` : '';
        const typeString = statusData.type ? `[${statusData.type}] ` : '';

        switch (statusData.status) {
            case 'idle':
                showDiv = false;
                statusText += '无';
                break;
            case 'pending':
                statusText += `${typeString}推送中... ${timeString}`;
                statusColor = '#e0a800';
                showDiv = true;
                autoHideDelay = null;
                break;
            case 'success':
                statusText += `${typeString}成功 ${timeString}`;
                statusColor = '#28a745';
                showDiv = true;
                break;
            case 'error':
                statusText += `${typeString}失败: ${statusData.message || '未知错误'} ${timeString}`; // Added default error message
                statusColor = '#dc3545';
                showDiv = true;
                autoHideDelay = 10000;
                break;
            default:
                statusText += `${typeString}未知状态 (${statusData.status}) ${timeString}`;
                statusColor = '#ccc';
                showDiv = true;
                break;
        }
    }

    gitStatusDiv.textContent = statusText;
    gitStatusDiv.style.borderColor = statusColor;
    gitStatusDiv.style.color = statusColor;
    gitStatusDiv.style.backgroundColor = lightenColor(statusColor, 90);
    gitStatusDiv.style.display = showDiv ? 'block' : 'none';

    if (showDiv && autoHideDelay !== null) {
        gitStatusHideTimeoutId = setTimeout(() => {
            // Check if the status is still the same before hiding
            if (gitStatusDiv.textContent === statusText) {
                 gitStatusDiv.style.display = 'none';
            }
            gitStatusHideTimeoutId = null;
        }, autoHideDelay);
    }
}

function lightenColor(hex, percent) {
    try {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const bigint = parseInt(hex, 16);
        let r = (bigint >> 16) & 255;
        let g = (bigint >> 8) & 255;
        let b = bigint & 255;
        r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
        g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
        b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
        return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).padStart(6, '0')}`;
    } catch (e) {
        return '#f8f9fa';
    }
}

function pollGitStatus() {
    if (pollingIntervalId) return;
    console.log("Starting Git status polling...");
    checkGitStatus();
    pollingIntervalId = setInterval(checkGitStatus, pollingInterval);
}

function stopPolling() {
    if (pollingIntervalId) {
        console.log("Stopping Git status polling.");
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
        isPolling = false;
    }
}

// --- End Git Status Polling ---


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
   loadAllData(); // Load Works, Blog, Tools data and populate dropdowns
   updateGitStatusUI({ status: 'idle' });
   checkGitStatus(); // Initial Git status check

    // --- Load and Render Initial Morning Journal Data ---
    async function initializeJournal() {
        console.log("[[[DEBUG_INITIALIZE_JOURNAL_CALLED]]]"); // VERY BASIC LOG
        // Fetch all entries first AND WAIT for them
        setTimeout(async () => {
            console.log("[initializeJournal - setTimeout] Fetching initial journal entries...");
            const rawJournalEntries = await fetchData('morningJournal'); // Ensure this completes
            // Filter for valid entries before mapping to dates
            const journalEntries = rawJournalEntries ? rawJournalEntries.filter(entry => entry && entry.id && entry.date) : [];
            const entryDates = journalEntries.map(entry => entry.date);
            console.log('[initializeJournal - setTimeout] Filtered journalEntries count:', journalEntries.length);
            console.log('[initializeJournal - setTimeout] Final entryDates for calendar:', JSON.stringify(entryDates)); // Log final dates

            // Render the list (can happen before or after flatpickr init)
            renderJournalList(journalEntries); // Use filtered entries for list as well

            // Determine initial date to load (latest entry or today)
            const todayStr = getCurrentDateString();
            let initialDateToLoad = todayStr;
            if (journalEntries && journalEntries.length > 0) { // Check if there are any entries at all
                 // Sort by date descending to find the latest
                 const latestDateEntry = [...journalEntries].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                 initialDateToLoad = latestDateEntry.date; // Load latest entry date by default
                 console.log(`[initializeJournal - setTimeout] Latest entry date is ${initialDateToLoad}. Today is ${todayStr}. Setting default date to ${initialDateToLoad}.`);
            } else {
                 console.log(`[initializeJournal - setTimeout] No entries found. Setting default date to today: ${todayStr}.`);
            }


            // --- Initialize Flatpickr ONLY AFTER data is fetched ---
            if (journalDateSelector) {
                console.log('[initializeJournal - setTimeout] Initializing Flatpickr...');
                flatpickr(journalDateSelector, {
                    dateFormat: "Y-m-d",
                    // locale: "zh", // Temporarily commented out
                    defaultDate: initialDateToLoad, // Restore defaultDate
                    onDayCreate: function(dObj, dStr, fp, dayElem) {
                        // console.log(`[[[DEBUG_ON_DAY_CREATE_CALLED]]] Original Date (dStr): "${dStr}", Date Object (dObj):`, dObj, "Day Element:", dayElem);

                        let effectiveDateStr = "";

                        // Try to get date from the element itself, as dStr/dObj are unreliable
                        if (dayElem.hasAttribute('aria-label')) {
                            const ariaLabel = dayElem.getAttribute('aria-label');
                            // Assuming aria-label might be like "June 5, 2025" or similar.
                            // This parsing is very basic and might need adjustment based on actual aria-label format.
                            try {
                                const dateFromAria = new Date(ariaLabel);
                                if (!isNaN(dateFromAria)) {
                                    const year = dateFromAria.getFullYear();
                                    const month = ('0' + (dateFromAria.getMonth() + 1)).slice(-2);
                                    const day = ('0' + dateFromAria.getDate()).slice(-2);
                                    effectiveDateStr = `${year}-${month}-${day}`;
                                    // console.log(`  >>> Derived from dayElem aria-label ("${ariaLabel}"): "${effectiveDateStr}"`);
                                }
                            } catch (e) {
                                // console.warn(`  >>> Could not parse date from aria-label: "${ariaLabel}"`, e);
                            }
                        }

                        // Fallback to dStr if element-based extraction failed but dStr is somehow valid (unlikely given past results)
                        if (!effectiveDateStr && dStr && dStr.trim() !== "") {
                            effectiveDateStr = dStr;
                            // console.log(`  >>> Using fallback dStr: "${effectiveDateStr}"`);
                        }
                        
                        // Final check and log if still no valid date
                        if (!effectiveDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDateStr)) {
                             console.warn(`  >>> UNABLE TO DETERMINE VALID DATE for dayElem. aria-label: "${dayElem.getAttribute('aria-label')}", dStr: "${dStr}". Proceeding with empty/invalid date.`);
                             effectiveDateStr = ""; // Ensure it's empty if invalid
                        } else {
                            console.log(`  >>> Successfully determined effectiveDateStr: "${effectiveDateStr}" for dayElem.`);
                        }


                        const hasEntry = entryDates.includes(effectiveDateStr);
                        console.log(`  >>> For effectiveDateStr: "${effectiveDateStr}", entryDates.includes result: ${hasEntry}`);

                        dayElem.style.borderRadius = '50%'; // Ensure circular shape

                        if (!dayElem.classList.contains('prevMonthDay') && !dayElem.classList.contains('nextMonthDay')) {
                            if (hasEntry) {
                                // console.log(`[Initial onDayCreate - CurrentMonth] APPLYING DARK BLUE to ${effectiveDateStr}. Has Entry: ${hasEntry}`);
                                dayElem.style.backgroundColor = '#0056b3'; // Dark blue
                                dayElem.style.color = '#fff';
                                dayElem.style.borderColor = '#0056b3';
                                dayElem.classList.add("has-journal-entry");
                                dayElem.title = "已有日记";
                            } else {
                                // console.log(`[Initial onDayCreate - CurrentMonth] APPLYING LIGHT BLUE to ${effectiveDateStr}. Has Entry: ${hasEntry}`);
                                dayElem.style.backgroundColor = '#e6f7ff'; // Light blue
                                dayElem.style.color = '#333';
                                dayElem.style.borderColor = ''; // Remove orange border
                                dayElem.classList.remove("has-journal-entry");
                                dayElem.removeAttribute("title");
                            }
                        } else {
                            // console.log(`[Initial onDayCreate - OtherMonth] Processing ${dStr}. ClassList: ${dayElem.classList}`);
                            dayElem.style.backgroundColor = '';
                            dayElem.style.color = '';
                            dayElem.style.borderColor = '';
                            dayElem.classList.remove("has-journal-entry");
                            dayElem.removeAttribute("title");
                        }
                    },
                    onChange: function(selectedDates, dateStr, instance) {
                        // Trigger loadJournalEntry when date changes via Flatpickr
                        console.log("Flatpickr date changed:", dateStr);
                        if (dateStr) {
                            loadJournalEntry(dateStr);
                        }
                    }
                });
            } else {
                console.error("Journal date selector not found for Flatpickr initialization.");
            }

            // Load the determined initial entry content *after* initializing Flatpickr
            // Flatpickr's defaultDate option should handle setting the initial input value.
            // We still need to load the content for that date.
            console.log(`[initializeJournal - setTimeout] Loading initial journal content for date: ${initialDateToLoad}`);
            await loadJournalEntry(initialDateToLoad); // Load content for the default date

            // The change listener is now handled by Flatpickr's onChange event,
            // so the previous addEventListener can be removed or commented out.
        }, 100); // Delay of 100 milliseconds
        // if (journalDateSelector) {
        //     journalDateSelector.addEventListener('change', (event) => {
        //         const selectedDate = event.target.value;
        //         if (selectedDate) {
        //             loadJournalEntry(selectedDate);
        //         }
        //     });
        // }
    }
    initializeJournal();
    // --- End Initial Journal Load ---

     // Add form submit listeners
     if (featuredWorksForm) featuredWorksForm.addEventListener('submit', (e) => handleFormSubmit(e, 'works'));
    if (blogForm) blogForm.addEventListener('submit', (e) => handleFormSubmit(e, 'blog'));
    if (toolForm) toolForm.addEventListener('submit', (e) => handleFormSubmit(e, 'tools'));
    // if (morningJournalForm) morningJournalForm.addEventListener('submit', (e) => handleFormSubmit(e, 'morning-journal')); // Removed

    // --- Add listener for "Update Featured Blog" button ---
    if (updateFeaturedBlogButton) {
        updateFeaturedBlogButton.addEventListener('click', async () => {
            const checkboxes = blogList.querySelectorAll('.featured-checkbox:checked');
            const featuredIds = Array.from(checkboxes).map(cb => cb.dataset.id);
            console.log('Updating featured blog posts with IDs:', featuredIds);
            try {
                updateFeaturedBlogButton.disabled = true;
                updateFeaturedBlogButton.textContent = '更新中...';
                const response = await fetch(`${API_BASE_URL}/blog/featured`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: featuredIds }),
                });
                if (!response.ok) {
                    const errorData = await response.text();
                    let detail = errorData;
                    if (errorData.includes('<pre>') && errorData.includes('</pre>')) {
                        detail = errorData.split('<pre>')[1].split('</pre>')[0];
                    }
                    throw new Error(`HTTP error! status: ${response.status}, message: ${detail}`);
                }
                const result = await response.json();
                alert(`精选文章更新成功！ (${result.message || ''})`);
                pollGitStatus();
            } catch (error) {
                console.error('Error updating featured blogs:', error);
                alert(`更新精选文章时出错: ${error.message}`);
            } finally {
                updateFeaturedBlogButton.disabled = false;
                updateFeaturedBlogButton.textContent = '更新精选';
            }
        });
    }

     // Add cancel button listeners
    if (cancelEditWorkBtn) cancelEditWorkBtn.addEventListener('click', () => cancelEdit('works'));
    if (cancelEditBlogBtn) cancelEditBlogBtn.addEventListener('click', () => cancelEdit('blog'));
    if (cancelEditToolBtn) cancelEditToolBtn.addEventListener('click', () => cancelEdit('tools'));
    // if (cancelEditJournalBtn) cancelEditJournalBtn.addEventListener('click', () => cancelEdit('morning-journal')); // Removed

    // Add "Add New" button listeners
    if (addToolButton) {
        addToolButton.addEventListener('click', () => {
            toolForm.reset();
            const editIdInput = toolForm.querySelector('input[type="hidden"]');
            if (editIdInput) editIdInput.value = '';
            cancelEditToolBtn.style.display = 'none';
            toolForm.style.display = 'block';
            toolForm.scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (addBlogButton) {
        addBlogButton.addEventListener('click', () => {
            blogForm.reset();
            const editIdInput = blogForm.querySelector('input[type="hidden"]');
            if (editIdInput) editIdInput.value = '';
            cancelEditBlogBtn.style.display = 'none';
            blogForm.style.display = 'block';
            blogForm.scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (addWorkButton) {
        addWorkButton.addEventListener('click', () => {
            featuredWorksForm.reset();
            const editIdInput = featuredWorksForm.querySelector('input[type="hidden"]');
            if (editIdInput) editIdInput.value = '';
            cancelEditWorkBtn.style.display = 'none';
            featuredWorksForm.style.display = 'block';
            featuredWorksForm.scrollIntoView({ behavior: 'smooth' });
        });
    }
    // if (addJournalButton) { // Removed
    //     addJournalButton.addEventListener('click', () => {
    //         morningJournalForm.reset();
    //         const editIdInput = morningJournalForm.querySelector('input[type="hidden"]');
    //         if (editIdInput) editIdInput.value = '';
    //         cancelEditJournalBtn.style.display = 'none';
    //         morningJournalForm.style.display = 'block';
    //         morningJournalForm.scrollIntoView({ behavior: 'smooth' });
    //     });
    // }


    // --- Update Backup Button Listener ---
    if (updateBackupButton) {
        updateBackupButton.addEventListener('click', async () => {
            if (confirm('确定要将当前所有数据更新到备份文件 (.bak) 吗？这将覆盖现有的备份。')) {
                updateBackupButton.disabled = true;
                updateBackupButton.textContent = '正在更新备份...';
                try {
                    const response = await fetch(`${API_BASE_URL}/update-backups`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                    });
                    const result = await response.json();
                    if (response.ok) {
                        alert(`备份文件更新成功！ (${result.message || ''})`);
                    } else {
                        throw new Error(result.message || `HTTP error! status: ${response.status}`);
                    }
                } catch (error) {
                    console.error('Error updating backups:', error);
                    alert(`更新备份文件时出错: ${error.message}`);
                } finally {
                     updateBackupButton.disabled = false;
                     updateBackupButton.textContent = '更新备份文件';
                }
            }
        });
    } else {
        console.warn('Update backup button not found.');
    }

    // --- Tab Navigation Logic ---
    if (adminNav && adminSections) {
        const navButtons = adminNav.querySelectorAll('.nav-button'); // Select buttons inside nav

        adminNav.addEventListener('click', (event) => {
            const clickedButton = event.target.closest('.nav-button');
            if (!clickedButton || !clickedButton.dataset.target) return; // Ensure it's a button with a target

            const targetId = clickedButton.dataset.target;
            const targetSection = document.querySelector(targetId);

            if (!targetSection) return;

            // Deactivate all
            navButtons.forEach(button => button.classList.remove('active'));
            adminSections.forEach(section => section.classList.remove('active'));

            // Activate clicked
            clickedButton.classList.add('active');
            targetSection.classList.add('active');
        });

        // Ensure the first section is active on load if none are pre-set
        const isActive = adminNav.querySelector('.nav-button.active');
        if (!isActive && navButtons.length > 0) {
             navButtons[0].classList.add('active');
             const firstTargetId = navButtons[0].dataset.target;
             const firstSection = document.querySelector(firstTargetId);
             if (firstSection) firstSection.classList.add('active');
        }

    } else {
         console.warn('Admin navigation or sections not found.');
    }
    // --- End Tab Navigation Logic ---

   // --- Add Morning Journal Event Listeners ---
   if (journalSaveBtn) journalSaveBtn.addEventListener('click', saveJournalEntry);
   const journalPasteBtn = document.getElementById('journal-paste-button'); // Get the paste button
   if (journalPasteBtn) journalPasteBtn.addEventListener('click', pasteJournalEntry); // Add listener for paste
   // if (journalClearBtn) journalClearBtn.addEventListener('click', clearJournalEditor); // Removed

   // Modal Listeners
   // if (journalHistoryBtn) journalHistoryBtn.addEventListener('click', () => openModal(journalHistoryModal)); // Removed
   if (journalSettingsBtn) {
        journalSettingsBtn.addEventListener('click', () => {
            console.log('Settings button clicked. Loading settings and opening modal:', journalSettingsModal);
            loadJournalSettings(); // Load settings when button is clicked
            openModal(journalSettingsModal);
        });
   } else {
        console.warn('Journal Settings button not found.');
   }

   // Add listeners for all close buttons in modals (Still needed for Settings modal)
   document.querySelectorAll('.modal .close-button').forEach(button => {
       button.addEventListener('click', (event) => {
           const modal = event.target.closest('.modal');
           if (modal) closeModal(modal);
       });
   });

   // Close modal if clicking outside the content
   document.querySelectorAll('.modal').forEach(modal => {
       modal.addEventListener('click', (event) => {
           if (event.target === modal) { // Check if the click is on the backdrop itself
               closeModal(modal);
           }
       });
   });

   // Listener for Import Button (triggers hidden file input)
   if (importJournalBtn && journalFileInput) {
       importJournalBtn.addEventListener('click', () => {
           journalFileInput.value = null; // Reset before click to allow re-selecting same file
           journalFileInput.click();
       });
       
       // --- NEW: Function to refresh calendar day highlights ---
       async function refreshCalendarHighlights() {
           console.log("Refreshing calendar highlights...");
           const fpInstance = journalDateSelector ? journalDateSelector._flatpickr : null;
           if (!fpInstance) {
               console.error("Flatpickr instance not found for refreshing highlights.");
               return;
           }
       
           try {
               // 1. Fetch the latest entry dates
               const rawLatestEntries = await fetchData('morningJournal');
               const latestEntries = rawLatestEntries ? rawLatestEntries.filter(entry => entry && entry.id && entry.date) : [];
               const latestEntryDates = latestEntries.map(entry => entry.date);
               console.log('[refreshCalendarHighlights] Filtered latestEntries count:', latestEntries.length);
               console.log('[refreshCalendarHighlights] Final latestEntryDates for this refresh cycle:', JSON.stringify(latestEntryDates)); // Clarified log

               // 2. Reconfigure onDayCreate with the latest dates
               fpInstance.set("onDayCreate", function(dObj, dStr, fp, dayElem) {
                   console.log('[Refreshed onDayCreate] Using latestEntryDates (captured by this closure):', JSON.stringify(latestEntryDates)); // Verify scope
                   const hasEntry = latestEntryDates.includes(dStr);
                   // console.log(`[Refreshed onDayCreate] Date: ${dStr}, Has Entry: ${hasEntry}, Element ClassList: ${dayElem.classList}`); // Original log

                   dayElem.style.borderRadius = '50%'; // Ensure circular shape

                   if (!dayElem.classList.contains('prevMonthDay') && !dayElem.classList.contains('nextMonthDay')) {
                       if (hasEntry) {
                           // console.log(`[Refreshed onDayCreate - CurrentMonth] APPLYING DARK BLUE to ${dStr}. Has Entry: ${hasEntry}`); // Simplified log
                           dayElem.style.backgroundColor = '#0056b3'; // Dark blue
                           dayElem.style.color = '#fff';
                           dayElem.style.borderColor = '#0056b3';
                           dayElem.classList.add("has-journal-entry");
                           dayElem.title = "已有日记";
                       } else {
                           // console.log(`[Refreshed onDayCreate - CurrentMonth] APPLYING LIGHT BLUE to ${dStr}. Has Entry: ${hasEntry}`); // Simplified log
                           dayElem.style.backgroundColor = '#e6f7ff'; // Light blue
                           dayElem.style.color = '#333';
                           dayElem.style.borderColor = ''; // Remove orange border
                           dayElem.classList.remove("has-journal-entry");
                           dayElem.removeAttribute("title");
                       }
                   } else {
                       // console.log(`[Refreshed onDayCreate - OtherMonth] Processing ${dStr}. ClassList: ${dayElem.classList}`);
                       dayElem.style.backgroundColor = '';
                       dayElem.style.color = '';
                       dayElem.style.borderColor = '';
                       dayElem.classList.remove("has-journal-entry");
                       dayElem.removeAttribute("title");
                   }
               });
       
               // 3. Trigger a redraw
               fpInstance.redraw();
               console.log("Flatpickr redraw triggered for highlight refresh.");
       
           } catch (error) {
               console.error("Error refreshing calendar highlights:", error);
           }
       }
       // Listener for the hidden file input itself
       journalFileInput.addEventListener('change', importJournalFromFile);
   } else {
        console.warn('Import Journal Button or File Input not found.');
   }

   // Listeners for Settings Modal Buttons
   if (saveReferenceSettingsBtn) saveReferenceSettingsBtn.addEventListener('click', (e) => saveJournalSettings(e.target));
   if (saveGoalSettingsBtn) saveGoalSettingsBtn.addEventListener('click', (e) => saveJournalSettings(e.target));
   if (saveReminderSettingsBtn) saveReminderSettingsBtn.addEventListener('click', (e) => saveJournalSettings(e.target));

   // Listener for Export Buttons (in settings modal)
   if (exportJournalJsonBtn) {
        exportJournalJsonBtn.addEventListener('click', exportJournalToJson);
   }
   if (exportJournalTxtBtn) { // New listener for TXT export
        exportJournalTxtBtn.addEventListener('click', exportJournalToTxt);
   }
   // Listener for Settings Import button (Deferred Implementation)
   if (importJournalSettingsBtn && journalFileInput) {
       importJournalSettingsBtn.addEventListener('click', () => {
           alert("导入设置功能暂未实现。请使用导入日记功能。");
           // Potentially trigger file input for settings import later
           // journalFileInput.accept = ".json"; // Change accepted type if needed
           // journalFileInput.onchange = importSettingsFromFile; // Use a different handler
           // journalFileInput.click();
       });
   }


   // // Flatpickr setup removed as history is removed.

});