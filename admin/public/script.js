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

    data.forEach((item, index) => {
        // Pass index as potential ID if backend doesn't assign unique IDs
        const itemElement = renderItemFunction(item, index);
        listContainer.appendChild(itemElement);
    });
}

function renderWorkItem(item, id) {
    const div = document.createElement('div');
    div.classList.add('list-item');
    div.innerHTML = `
        <strong>${item.title}</strong> (${item.tag}) - ${item.description.substring(0, 50)}...
        <button onclick="editItem('works', ${id})">编辑</button>
        <button onclick="deleteItem('works', ${id})">删除</button>
    `;
    // Store full data with the element for editing
    div.dataset.itemData = JSON.stringify(item);
    div.dataset.itemId = id;
    return div;
}

function renderBlogItem(item, id) {
    const div = document.createElement('div');
    div.classList.add('list-item');
    div.innerHTML = `
        <strong>${item.title}</strong> (${item.source}) - ${item.summary.substring(0, 50)}...
        <button onclick="editItem('blog', ${id})">编辑</button>
        <button onclick="deleteItem('blog', ${id})">删除</button>
    `;
    div.dataset.itemData = JSON.stringify(item);
     div.dataset.itemId = id;
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

// --- Form Handling ---

// Mark function as async
async function handleFormSubmit(event, type) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const editIdInput = form.querySelector(`input[type="hidden"]`); // Get the hidden input for ID
    const editId = editIdInput ? editIdInput.value : null;


    console.log(`Submitting ${type} data:`, data, "with ID:", editId);

    // Use await to ensure postData completes before proceeding
    const result = await postData(type, data, editId || null);

    if (result) {
        console.log(`${type} saved successfully:`, result);
        alert(`${type} 保存成功!`);
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
            const currentItemCount = featuredWorksList.querySelectorAll('.list-item').length;
            const newItemElement = renderWorkItem(result.item, currentItemCount);
            featuredWorksList.appendChild(newItemElement);
        } else if (!editId && type === 'blog' && result.item) { // Only for adding new 'blog'
            const noDataMsg = blogList.querySelector('p');
             if (noDataMsg && blogList.children.length === 1) {
                 noDataMsg.remove();
             }
            const currentItemCount = blogList.querySelectorAll('.list-item').length;
            const newItemElement = renderBlogItem(result.item, currentItemCount);
            blogList.appendChild(newItemElement);
        }
        // --- End Direct DOM Manipulation ---

        // Now call loadAllData after other UI updates (as fallback/consistency check)
        loadAllData(); // Reload data for the specific type
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
        // case 'diary': // Removed
        //     form = diaryForm;
        //     listContainer = diaryList;
        //     cancelBtn = cancelEditDiaryBtn;
        //     break;
        default: return;
    }

    // Find the item element in the list
    const itemElement = listContainer.querySelector(`div[data-item-id="${id}"]`);
    if (!itemElement || !itemElement.dataset.itemData) {
        console.error('Could not find item data for editing.');
        return;
    }

    const itemData = JSON.parse(itemElement.dataset.itemData);

    // Populate the form
    for (const key in itemData) {
        if (form.elements[key]) {
            form.elements[key].value = itemData[key];
        }
    }
     // Set the hidden ID field
    const editIdInput = form.querySelector(`input[type="hidden"]`);
    if (editIdInput) {
        editIdInput.value = id; // Store the ID for submission
    }

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
            if (type === 'blog') listContainer = blogList;
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


// --- Initialization ---

async function loadAllData() {
    const worksData = await fetchData('works');
    renderList('works', worksData);

    const blogData = await fetchData('blog');
    renderList('blog', blogData);

    // const diaryData = await fetchData('diary'); // Removed
    // renderList('diary', diaryData); // Removed
}

// --- Password Protection ---
function checkPassword() {
    const storedPassword = sessionStorage.getItem('adminPassword'); // Use sessionStorage for the current session
    if (storedPassword === '123456') {
        return true;
    }

    const inputPassword = prompt('请输入管理密码:');
    if (inputPassword === '123456') {
        sessionStorage.setItem('adminPassword', '123456');
        return true;
    } else if (inputPassword !== null) { // Handle cancel button
        alert('密码错误！');
    }
    // Hide content if password is wrong or cancelled
    document.body.innerHTML = '<h1>密码错误或未输入</h1>';
    return false;
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (!checkPassword()) {
        return; // Stop execution if password is wrong
    }

    // If password is correct, proceed to load data and set up listeners
    loadAllData();

    // Add form submit listeners
    featuredWorksForm.addEventListener('submit', (e) => handleFormSubmit(e, 'works'));
    blogForm.addEventListener('submit', (e) => handleFormSubmit(e, 'blog'));
    // diaryForm.addEventListener('submit', (e) => handleFormSubmit(e, 'diary')); // Removed

     // Add cancel button listeners
    cancelEditWorkBtn.addEventListener('click', () => cancelEdit('works'));
    cancelEditBlogBtn.addEventListener('click', () => cancelEdit('blog'));
    // cancelEditDiaryBtn.addEventListener('click', () => cancelEdit('diary')); // Removed

});