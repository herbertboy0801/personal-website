// personal-website/admin/public/script.js

const API_BASE_URL = 'http://localhost:3000/api'; // Assuming backend runs on port 3000

// DOM Elements
const featuredWorksList = document.getElementById('featured-works-list');
const featuredWorksForm = document.getElementById('featured-works-form');
const cancelEditWorkBtn = document.getElementById('cancel-edit-work');
// ... (get other form elements for works)

const blogList = document.getElementById('blog-list');
const blogForm = document.getElementById('blog-form');
const cancelEditBlogBtn = document.getElementById('cancel-edit-blog');
// ... (get other form elements for blog)
// const blogGitStatusDiv = document.getElementById('blog-git-status'); // Removed specific status div

// Tool Library Elements
const toolsList = document.getElementById('tools-list');
const toolForm = document.getElementById('tool-form');
const addToolButton = document.getElementById('add-tool-button'); // Button to show the form
const cancelEditToolBtn = document.getElementById('cancel-tool-edit');
// const toolsGitStatusDiv = document.getElementById('tools-git-status'); // Removed specific status div
// ... (get other form elements for tools)

// const diaryList = document.getElementById('diary-list'); // Removed
// const diaryForm = document.getElementById('diary-form'); // Removed
// const cancelEditDiaryBtn = document.getElementById('cancel-edit-diary'); // Removed
// ... (get other form elements for diary)

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
    // TODO: Implement POST/PUT logic (PUT if id is provided)
    try {
        const url = id ? `${API_BASE_URL}/${type}/${id}` : `${API_BASE_URL}/${type}`;
        const method = id ? 'PUT' : 'POST'; // Assuming PUT for updates

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.text(); // Get more error details
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
        }
        return await response.json(); // Or handle success response
    } catch (error) {
        console.error(`Error posting ${type}:`, error);
        alert(`保存 ${type} 数据时出错: ${error.message}`);
        return null;
    }
}

async function deleteData(type, id) {
    // TODO: Implement DELETE logic if needed
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
        // case 'diary': // Removed
        //     listContainer = diaryList;
        //     renderItemFunction = renderDiaryItem;
        //     break;
        default:
            console.error('Unknown type for rendering:', type);
            return;
    }

    listContainer.innerHTML = ''; // Clear previous content
    if (data.length === 0) {
        listContainer.innerHTML = '<p>暂无数据。</p>';
        return;
    }

    data.forEach((item) => { // No longer need index here
        // Backend now assigns unique IDs (item.id)
        const itemElement = renderItemFunction(item, item.id); // Pass the actual unique ID
        listContainer.appendChild(itemElement);
    });
}

function renderWorkItem(item, id) {
    const div = document.createElement('div');
    div.classList.add('list-item');
    div.innerHTML = `
        <div class="item-content">
            <strong>${item.title}</strong> (${item.tag}) - ${item.description.substring(0, 50)}...
        </div>
        <div class="item-actions">
            <button onclick="editItem('works', '${id}')">编辑</button>  <!-- Use quotes for string ID -->
            <button onclick="deleteItem('works', '${id}')">删除</button> <!-- Use quotes for string ID -->
        </div>
    `;
    // Store full data with the element for editing
    div.dataset.itemData = JSON.stringify(item);
    div.dataset.itemId = id; // Store the unique ID
    return div;
}

function renderBlogItem(item, id) {
    const div = document.createElement('div');
    div.classList.add('list-item');
    // Add checkbox at the beginning of item-content
    // Check if item.featured is true
    const isFeatured = item.featured === true;
    div.innerHTML = `
        <div class="item-content" style="display: flex; align-items: center;">
            <input type="checkbox" class="featured-checkbox" data-id="${id}" style="margin-right: 10px; transform: scale(1.2);" ${isFeatured ? 'checked' : ''}>
            <span> <!-- Wrap text content in a span for better alignment -->
                <strong>${item.title}</strong> (${item.source}) - ${item.summary.substring(0, 50)}...
            </span>
        </div>
        <div class="item-actions">
            <button onclick="editItem('blog', '${id}')">编辑</button>  <!-- Use quotes for string ID -->
            <button onclick="deleteItem('blog', '${id}')">删除</button> <!-- Use quotes for string ID -->
        </div>
    `;
    div.dataset.itemData = JSON.stringify(item);
     div.dataset.itemId = id; // Store the unique ID
    return div;
}

// function renderDiaryItem(item, id) { // Removed
//     const div = document.createElement('div');
//     div.classList.add('list-item');
//     div.innerHTML = `
//         <strong>${item.title}</strong> - ${item.summary.substring(0, 50)}...
//         <button onclick="editItem('diary', ${id})">编辑</button>
//         <button onclick="deleteItem('diary', ${id})">删除</button>
//     `;
//      div.dataset.itemData = JSON.stringify(item);
//      div.dataset.itemId = id;
//     return div;
// }

function renderToolItem(item, id) {
    const div = document.createElement('div');
    div.classList.add('list-item');
    // Display relevant tool info
    div.innerHTML = `
        <div class="item-content">
            <strong>${item.name}</strong> (${item.category}) - ${item.url}
        </div>
        <div class="item-actions">
            <button onclick="editItem('tools', '${id}')">编辑</button> <!-- Use quotes for string ID -->
            <button onclick="deleteItem('tools', '${id}')">删除</button> <!-- Use quotes for string ID -->
        </div>
    `;
    div.dataset.itemData = JSON.stringify(item);
    div.dataset.itemId = id; // Store the unique ID
    return div;
}

// --- Form Handling ---

// Mark function as async
async function handleFormSubmit(event, type) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    let data = Object.fromEntries(formData.entries());
    const editIdInput = form.querySelector(`input[type="hidden"]`); // Get the hidden input for ID
    const editId = editIdInput ? editIdInput.value : null; // This will be the unique string ID for edits

    // --- Handle Dropdown "New" Option ---
    if (type === 'blog') {
        const sourceSelect = form.elements['source'];
        const newSourceInput = form.elements['source-new'];
        if (sourceSelect.value === '--new--' && newSourceInput.value.trim()) {
            data.source = newSourceInput.value.trim(); // Use the new value
        }
        delete data['source-new']; // Remove temporary field
    } else if (type === 'works') {
        const typeSelect = form.elements['type'];
        const newTypeInput = form.elements['type-new'];
        if (typeSelect.value === '--new--' && newTypeInput.value.trim()) {
            data.type = newTypeInput.value.trim(); // Use the new value
        }
         delete data['type-new']; // Remove temporary field
    }
    // Tool category is always selected from the fixed list, no 'new' handling needed.

    // Special handling for tags (convert comma-separated string to array)
    if (type === 'tools' && data.tags) {
        data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag); // Split, trim, remove empty
    }
    // Add similar handling for blog tags if needed
    if (type === 'blog' && data.tags) {
         data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    console.log(`Submitting ${type} data:`, data, "with ID:", editId);

    // Use await to ensure postData completes before proceeding
    // Pass editId (which is the unique string ID) or null for new items
    const result = await postData(type, data, editId);

    if (result) {
        console.log(`${type} saved successfully:`, result);
        alert(`${type} 保存成功! (正在后台尝试推送到 GitHub...)`); // Update alert message
        form.reset(); // Clear the form
        if(editIdInput) editIdInput.value = ''; // Clear edit ID
        // Hide cancel button after successful save
        const cancelButton = form.querySelector('button[type="button"]');
        if (cancelButton) cancelButton.style.display = 'none';

        // --- Direct DOM Manipulation for ADD ---
        if (!editId && type === 'works' && result.item) { // Only for adding new 'works'
             // Remove "No data" message if present
            const noDataMsg = featuredWorksList.querySelector('p');
            if (noDataMsg && featuredWorksList.children.length === 1) { // Check if it's the only element
                 noDataMsg.remove();
            }
            // Determine new index (length before potential async loadAllData adds it)
            // Use the ID returned from the server (which should be the generated unique ID)
            const newItemElement = renderWorkItem(result.item, result.item.id);
            featuredWorksList.appendChild(newItemElement);
        } else if (!editId && type === 'blog' && result.item) { // Only for adding new 'blog'
            const noDataMsg = blogList.querySelector('p');
             if (noDataMsg && blogList.children.length === 1) {
                 noDataMsg.remove();
             }
            const newItemElement = renderBlogItem(result.item, result.item.id);
            blogList.appendChild(newItemElement);
        } else if (!editId && type === 'tools' && result.item) { // Handle adding new 'tools'
            const noDataMsg = toolsList.querySelector('p');
             if (noDataMsg && toolsList.children.length === 1) {
                 noDataMsg.remove();
             }
            const newItemElement = renderToolItem(result.item, result.item.id);
            toolsList.appendChild(newItemElement);
        }
        // --- End Direct DOM Manipulation ---

        // Now call loadAllData after other UI updates (as fallback/consistency check)
        loadAllData(); // Reload data for the specific type

        // Start polling for Git status (no longer needs type)
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
        // case 'diary': // Removed
        //     form = diaryForm;
        //     listContainer = diaryList;
        //     cancelBtn = cancelEditDiaryBtn;
        //     break;
        default: return;
    }

    // Find the item element in the list using the unique string ID
    const itemElement = listContainer.querySelector(`div[data-item-id="${id}"]`);
    if (!itemElement || !itemElement.dataset.itemData) {
        console.error(`Could not find item data for editing ${type} with id: ${id}`);
        return;
    }

    const itemData = JSON.parse(itemElement.dataset.itemData);

    // Populate the form
    for (const key in itemData) {
        const formElement = form.elements[key]; // Direct access should work with correct names
        if (formElement) {
            // Handle tags array specifically
            if ((type === 'tools' || type === 'blog') && key === 'tags' && Array.isArray(itemData[key])) {
                 formElement.value = itemData[key].join(', '); // Join array back to comma-separated string for input field
            } else if (formElement.tagName === 'SELECT') {
                 // Handle select elements: Check if the value exists as an option
                 let optionExists = false;
                 for (let i = 0; i < formElement.options.length; i++) {
                     if (formElement.options[i].value === itemData[key]) {
                         optionExists = true;
                         break;
                     }
                 }
                 // If the option exists, select it. Otherwise, select '--new--' and fill the text input.
                 if (optionExists) {
                     formElement.value = itemData[key];
                     // Hide the 'new' input if it exists
                     const newTextInput = form.elements[`${key}-new`];
                     if (newTextInput) newTextInput.style.display = 'none';
                 } else if (form.elements[`${key}-new`]) { // Check if 'new' input exists
                     formElement.value = '--new--'; // Select the 'new' option
                     const newTextInput = form.elements[`${key}-new`];
                     newTextInput.value = itemData[key]; // Fill the text input
                     newTextInput.style.display = 'block'; // Show the text input
                 } else {
                      // Fallback if value doesn't exist and no 'new' option (e.g., tool category)
                      console.warn(`Value "${itemData[key]}" for field "${key}" not found in select options.`);
                      // Optionally set to default or first option
                      if (formElement.options.length > 0) {
                           formElement.selectedIndex = 0;
                      }
                 }
            } else {
                formElement.value = itemData[key];
            }
        }
    }
     // Set the hidden ID field
    const editIdInput = form.querySelector(`input[type="hidden"]`);
    if (editIdInput) {
        editIdInput.value = id; // Store the ID for submission
    }

    // Show the form itself
    form.style.display = 'block'; // Ensure the form is visible

    // Show cancel button and scroll to form
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    form.scrollIntoView({ behavior: 'smooth' });

}

// Function is already async, just ensure await is used correctly
async function deleteItem(type, id) {
    if (confirm(`确定要删除这个 ${type} 条目吗？`)) {
        // Ensure deleteData completes before alerting and reloading
        const success = await deleteData(type, id);
        if (success) {
            alert(`${type} 删除成功!`);

            // --- Direct DOM Manipulation for DELETE ---
            let listContainer;
            if (type === 'works') listContainer = featuredWorksList;
            else if (type === 'blog') listContainer = blogList;
            else if (type === 'tools') listContainer = toolsList;
            // Add other types if needed

            if (listContainer) {
                const itemElement = listContainer.querySelector(`.list-item[data-item-id="${id}"]`);
                if (itemElement) {
                    itemElement.remove();
                     // Add "No data" message if list becomes empty
                    if (listContainer.children.length === 0) {
                        listContainer.innerHTML = '<p>暂无数据。</p>';
                    }
                }
            }
             // --- End Direct DOM Manipulation ---

            loadAllData(); // Reload data (as fallback/consistency check)
            // Start polling for Git status after successful delete
            pollGitStatus();
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
        // case 'diary': // Removed
        //     form = diaryForm;
        //     cancelBtn = cancelEditDiaryBtn;
        //     editIdInput = document.getElementById('diary-edit-id');
        //     break;
        default: return;
    }
    form.reset();
    if (editIdInput) editIdInput.value = ''; // Clear the hidden ID
    if (cancelBtn) cancelBtn.style.display = 'none'; // Hide cancel button
}


// --- Dropdown Population ---

// Fixed categories for the tool library
const toolCategories = ['AI 生成', '开发工具', '效率助手', '图像影音处理', '休闲娱乐'];

function populateSelectWithOptions(selectElement, options, includeNewOption = false) {
    selectElement.innerHTML = ''; // Clear existing options
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
            if (selectElement.value === '--new--') {
                newTextInput.style.display = 'block';
                newTextInput.required = true; // Make required when visible
            } else {
                newTextInput.style.display = 'none';
                newTextInput.required = false; // Not required when hidden
                newTextInput.value = ''; // Clear value when hidden
            }
        });
         // Initial check in case the form is pre-populated for editing
         if (selectElement.value === '--new--') {
             newTextInput.style.display = 'block';
             newTextInput.required = true;
         } else {
              newTextInput.style.display = 'none';
              newTextInput.required = false;
         }
    }
}


// --- Initialization ---

async function loadAllData() {
    // Fetch all data concurrently
    const [worksData, blogData, toolsData] = await Promise.all([
        fetchData('works'),
        fetchData('blog'),
        fetchData('tools')
    ]);

    // Render lists
    renderList('works', worksData);
    renderList('blog', blogData);
    renderList('tools', toolsData);

    // Populate dropdowns
    const workTypes = [...new Set(worksData.map(item => item.type))].sort();
    populateSelectWithOptions(document.getElementById('work-type'), workTypes, true);

    const blogSources = [...new Set(blogData.map(item => item.source))].sort();
    populateSelectWithOptions(document.getElementById('blog-source'), blogSources, true);

    populateSelectWithOptions(document.getElementById('tool-category'), toolCategories, false); // No 'new' for tools

    // Setup dynamic behavior for 'new' options
    setupDynamicSelect('work-type', 'work-type-new');
    setupDynamicSelect('blog-source', 'blog-source-new');

}

// --- Password Protection (Removed) ---
// function checkPassword() { ... } // Removed password check logic


// --- Git Status Polling ---
let pollingIntervalId = null; // Store interval ID for stopping
const pollingInterval = 5000; // Poll every 5 seconds
let isPolling = false; // Flag to prevent multiple concurrent polls

// Function to check the *last* Git status from the server
async function checkGitStatus() {
    if (isPolling) return; // Prevent overlapping checks
    isPolling = true;
    console.log(`Checking last Git status...`); // DEBUG
    try {
        const response = await fetch(`/api/git-status/last`); // Fetch the global status
        if (!response.ok) {
            // Handle specific errors like 404 if the endpoint isn't ready?
            if (response.status === 404) {
                 console.warn('Git status endpoint not found (404). Server might be starting.');
                 updateGitStatusUI({ status: 'error', message: '无法获取状态 (404)' });
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } else {
            const statusData = await response.json();
            console.log(`Received last status:`, statusData); // DEBUG
            updateGitStatusUI(statusData); // Update the global UI

            // Stop polling if the status is no longer pending
            if (statusData.status !== 'pending') {
                stopPolling();
            }
        }
    } catch (error) {
        console.error(`Error checking last Git status:`, error);
        updateGitStatusUI({ status: 'error', message: '检查状态时出错' });
        // Decide if polling should stop on error. Maybe keep trying?
        // stopPolling(); // Uncomment to stop on error
    } finally {
        isPolling = false; // Allow next check
    }
}

// Function to update the global Git status UI
// Accepts the full status object from the backend { status, message, timestamp, type }
function updateGitStatusUI(statusData) {
    const statusDiv = document.getElementById('git-status'); // Target the global div
    if (!statusDiv) {
        console.warn(`Global status div not found: #git-status`);
        return;
    }

    let statusText = `最近推送状态: `;
    let statusColor = '#666'; // Default idle/unknown color
    let showDiv = true;

    // Handle potentially null or incomplete initial statusData
    if (!statusData || !statusData.status) {
        statusText += '未知';
        statusColor = '#ccc';
        showDiv = false; // Don't show if status is unknown initially
    } else {
        const timeString = statusData.timestamp ? `(${new Date(statusData.timestamp).toLocaleTimeString()})` : '';
        const typeString = statusData.type ? `[${statusData.type}] ` : ''; // Show which type triggered it

        switch (statusData.status) {
            case 'idle':
                // Only show idle if there's a previous message/timestamp, otherwise hide
                if (statusData.message || statusData.timestamp) {
                     statusText += `${typeString}${statusData.message || '空闲'} ${timeString}`;
                     statusColor = '#666'; // Darker grey for idle with info
                } else {
                     showDiv = false; // Hide if truly idle with no history
                }
                break;
            case 'pending':
                statusText += `${typeString}推送中... ${timeString}`;
                statusColor = '#e0a800'; // Amber/Yellow
                break;
            case 'success':
                statusText += `${typeString}成功 ${timeString}`;
                statusColor = '#28a745'; // Green
                break;
            case 'error':
                statusText += `${typeString}失败: ${statusData.message} ${timeString}`;
                statusColor = '#dc3545'; // Red
                break;
            default:
                statusText += `${typeString}未知状态 (${statusData.status}) ${timeString}`;
                statusColor = '#ccc';
        }
    }


    statusDiv.textContent = statusText;
    statusDiv.style.borderColor = statusColor;
    statusDiv.style.color = statusColor; // Change text color too for visibility
    statusDiv.style.backgroundColor = lightenColor(statusColor, 90); // Light background tint
    statusDiv.style.display = showDiv ? 'block' : 'none'; // Show or hide the div
}

// Helper to lighten border color for background
function lightenColor(hex, percent) {
    try {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        const bigint = parseInt(hex, 16);
        let r = (bigint >> 16) & 255;
        let g = (bigint >> 8) & 255;
        let b = bigint & 255;

        r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
        g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
        b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

        return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).padStart(6, '0')}`;
    } catch (e) {
        return '#f8f9fa'; // Fallback color
    }
}


// Function to start polling Git status (if not already polling)
function pollGitStatus() {
    if (pollingIntervalId) {
        console.log("Polling already active.");
        return; // Don't start multiple intervals
    }
    console.log("Starting Git status polling..."); // DEBUG
    checkGitStatus(); // Check immediately first
    pollingIntervalId = setInterval(checkGitStatus, pollingInterval);
}

// Function to stop polling
function stopPolling() {
    if (pollingIntervalId) {
        console.log("Stopping Git status polling."); // DEBUG
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
        isPolling = false; // Reset polling flag
        // Optionally hide the status after a few seconds, only if not an error
        setTimeout(() => {
            const statusDiv = document.getElementById('git-status');
            // Check the current status from the div text content (simple check)
            if (statusDiv && !statusDiv.textContent.includes('失败')) {
                 statusDiv.style.display = 'none';
                 statusDiv.textContent = '最近推送状态：无'; // Reset text when hiding
            }
        }, 5000); // Hide after 5 seconds for success/idle
    }
}

// --- End Git Status Polling ---


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Removed password check: if (!checkPassword()) { return; }

    // Load data and set up listeners directly
    loadAllData();

    // Initial Git status check (now global)
    checkGitStatus(); // Check the last known status on load

    // Add form submit listeners
    featuredWorksForm.addEventListener('submit', (e) => handleFormSubmit(e, 'works'));
    blogForm.addEventListener('submit', (e) => handleFormSubmit(e, 'blog'));
    toolForm.addEventListener('submit', (e) => handleFormSubmit(e, 'tools')); // Add listener for tools form
    // diaryForm.addEventListener('submit', (e) => handleFormSubmit(e, 'diary')); // Removed

    // --- Add listener for "Update Featured Blog" button ---
    const updateFeaturedBlogButton = document.getElementById('update-featured-blog-button');
    if (updateFeaturedBlogButton) {
        updateFeaturedBlogButton.addEventListener('click', async () => {
            const checkboxes = blogList.querySelectorAll('.featured-checkbox:checked');
            const featuredIds = Array.from(checkboxes).map(cb => cb.dataset.id);

            console.log('Updating featured blog posts with IDs:', featuredIds);

            // API call is now uncommented
            try {
                updateFeaturedBlogButton.disabled = true;
                updateFeaturedBlogButton.textContent = '更新中...';
                const response = await fetch(`${API_BASE_URL}/blog/featured`, { // Example endpoint
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: featuredIds }),
                });
                if (!response.ok) {
                    const errorData = await response.text();
                    // Try to parse HTML error for a better message
                    let detail = errorData;
                    if (errorData.includes('<pre>') && errorData.includes('</pre>')) {
                        detail = errorData.split('<pre>')[1].split('</pre>')[0];
                    }
                    throw new Error(`HTTP error! status: ${response.status}, message: ${detail}`);
                }
                const result = await response.json();
                alert(`精选文章更新成功！ (${result.message || ''})`);
                pollGitStatus(); // Trigger Git status check
                // No need to reload data here, backend handles file update. Checkboxes state is visual only until next full load.
                // loadAllData(); // Reload to reflect changes visually (checkboxes)
            } catch (error) {
                console.error('Error updating featured blogs:', error);
                alert(`更新精选文章时出错: ${error.message}`);
            } finally {
                updateFeaturedBlogButton.disabled = false;
                updateFeaturedBlogButton.textContent = '更新精选';
            }

        });
    }
    // --- End listener for "Update Featured Blog" button ---

     // Add cancel button listeners
    cancelEditWorkBtn.addEventListener('click', () => cancelEdit('works'));
    cancelEditBlogBtn.addEventListener('click', () => cancelEdit('blog'));
    cancelEditToolBtn.addEventListener('click', () => cancelEdit('tools')); // Add listener for tools cancel
    // cancelEditDiaryBtn.addEventListener('click', () => cancelEdit('diary')); // Removed

    // Add listener for the "Add New Tool" button to show the form
    addToolButton.addEventListener('click', () => {
        toolForm.reset();
        document.getElementById('tool-id').value = ''; // Clear hidden ID
        cancelEditToolBtn.style.display = 'none'; // Hide cancel button initially
        toolForm.style.display = 'block'; // Show the form
        toolForm.scrollIntoView({ behavior: 'smooth' });
    });

    // Add similar listeners for "Add New Work" and "Add New Blog" if needed
    // Example for blog:
    const addBlogButton = document.getElementById('add-blog-button');
    if (addBlogButton) {
        addBlogButton.addEventListener('click', () => {
            blogForm.reset();
            document.getElementById('blog-edit-id').value = '';
            cancelEditBlogBtn.style.display = 'none';
            blogForm.style.display = 'block';
            blogForm.scrollIntoView({ behavior: 'smooth' });
        });
    }
    // Add listener for "Add New Work" button
    const addWorkButton = document.getElementById('add-work-button');
    if (addWorkButton) {
        addWorkButton.addEventListener('click', () => {
            featuredWorksForm.reset();
            document.getElementById('work-edit-id').value = '';
            cancelEditWorkBtn.style.display = 'none';
            featuredWorksForm.style.display = 'block';
            featuredWorksForm.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // --- Update Backup Button Listener --- // Changed comment
    const updateBackupButton = document.getElementById('update-backup-button'); // Changed ID
    if (updateBackupButton) { // Changed variable name
        updateBackupButton.addEventListener('click', async () => { // Changed variable name
            if (confirm('确定要将当前所有数据更新到备份文件 (.bak) 吗？这将覆盖现有的备份。')) { // Changed confirmation message
                updateBackupButton.disabled = true; // Disable button during operation
                updateBackupButton.textContent = '正在更新备份...'; // Update button text
                try {
                    const response = await fetch(`${API_BASE_URL}/update-backups`, { // Changed API endpoint
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                    const result = await response.json(); // Get the response message
                    if (response.ok) {
                        alert(`备份文件更新成功！ (${result.message || ''})`); // Changed success message
                    } else {
                        throw new Error(result.message || `HTTP error! status: ${response.status}`);
                    }
                } catch (error) {
                    console.error('Error updating backups:', error); // Changed error log message
                    alert(`更新备份文件时出错: ${error.message}`); // Changed error alert message
                } finally {
                     updateBackupButton.disabled = false; // Re-enable button
                     updateBackupButton.textContent = '更新备份文件'; // Restore button text
                }
            }
        });
    } else {
        console.warn('Update backup button not found.'); // Changed warning message
    }

});
// --- Tab Navigation Logic ---
    const adminNav = document.getElementById('admin-nav');
    const navButtons = adminNav.querySelectorAll('.nav-button');
    const adminSections = document.querySelectorAll('.admin-section');

    adminNav.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('.nav-button');
        if (!clickedButton) return; // Exit if click wasn't on a nav button

        const targetId = clickedButton.dataset.target; // Get target section ID (e.g., '#featured-works-admin')
        const targetSection = document.querySelector(targetId);

        if (!targetSection) return; // Exit if target section not found

        // Remove active class from all buttons and sections
        navButtons.forEach(button => button.classList.remove('active'));
        adminSections.forEach(section => section.classList.remove('active'));

        // Add active class to the clicked button and target section
        clickedButton.classList.add('active');
        targetSection.classList.add('active');
    });
    // --- End Tab Navigation Logic ---