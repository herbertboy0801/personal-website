document.addEventListener('DOMContentLoaded', () => {
    const journalForm = document.getElementById('morning-journal-form');
    const journalList = document.getElementById('morning-journal-list');
    const journalIdInput = document.getElementById('journal-id');
    const journalDateInput = document.getElementById('journal-date');
    const journalContentInput = document.getElementById('journal-content');
    const cancelEditButton = document.getElementById('cancel-edit-button');

    const API_BASE_URL = '/api/morningJournal'; // API endpoint for morning journal

    // --- Helper Functions ---

    // Function to display journal entries
    function displayJournalEntries(entries) {
        journalList.innerHTML = ''; // Clear current list
        if (!entries || entries.length === 0) {
            journalList.innerHTML = '<p>暂无日记条目。</p>';
            return;
        }

        // Sort entries by date descending (newest first)
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        entries.forEach(entry => {
            const entryElement = document.createElement('div');
            entryElement.classList.add('list-item'); // Use a generic class for styling
            entryElement.dataset.id = entry.id; // Store ID for later use

            // Basic display, can be enhanced
            entryElement.innerHTML = `
                <h4>${entry.date}</h4>
                <pre>${escapeHtml(entry.content)}</pre> <!-- Use <pre> for preserving whitespace -->
                <div class="item-actions">
                    <button class="edit-button">编辑</button>
                    <button class="delete-button">删除</button>
                </div>
            `;

            // Add event listeners for edit and delete buttons
            entryElement.querySelector('.edit-button').addEventListener('click', () => populateFormForEdit(entry));
            entryElement.querySelector('.delete-button').addEventListener('click', () => deleteJournalEntry(entry.id));

            journalList.appendChild(entryElement);
        });
    }

    // Function to fetch journal entries from the API
    async function fetchJournalEntries() {
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const entries = await response.json();
            displayJournalEntries(entries);
        } catch (error) {
            console.error('获取晨间日记失败:', error);
            journalList.innerHTML = '<p>加载日记时出错，请稍后再试。</p>';
        }
    }

    // Function to populate the form for editing an entry
    function populateFormForEdit(entry) {
        journalIdInput.value = entry.id;
        journalDateInput.value = entry.date;
        journalContentInput.value = entry.content;
        cancelEditButton.style.display = 'inline-block'; // Show cancel button
        journalForm.querySelector('button[type="submit"]').textContent = '更新条目';
        window.scrollTo(0, 0); // Scroll to top to see the form
    }

    // Function to reset the form
    function resetForm() {
        journalForm.reset();
        journalIdInput.value = ''; // Clear hidden ID field
        cancelEditButton.style.display = 'none'; // Hide cancel button
        journalForm.querySelector('button[type="submit"]').textContent = '保存条目';
    }

    // Function to handle form submission (Add or Update)
    async function handleFormSubmit(event) {
        event.preventDefault(); // Prevent default form submission

        const id = journalIdInput.value;
        const date = journalDateInput.value;
        const content = journalContentInput.value;

        const entryData = { date, content };
        const isEditing = !!id; // Check if we are editing (ID exists)

        const url = isEditing ? `${API_BASE_URL}/${id}` : API_BASE_URL;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(entryData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('保存成功:', result);
            alert(`日记条目已成功${isEditing ? '更新' : '添加'}！`);
            resetForm();
            fetchJournalEntries(); // Refresh the list

        } catch (error) {
            console.error('保存日记条目失败:', error);
            alert(`保存日记条目失败: ${error.message}`);
        }
    }

    // Function to delete a journal entry
    async function deleteJournalEntry(id) {
        if (!confirm('确定要删除此日记条目吗？此操作无法撤销。')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('删除成功:', result);
            alert('日记条目已成功删除！');
            fetchJournalEntries(); // Refresh the list
            resetForm(); // Reset form if the deleted item was being edited

        } catch (error) {
            console.error('删除日记条目失败:', error);
            alert(`删除日记条目失败: ${error.message}`);
        }
    }

    // Helper to escape HTML special characters for display (Corrected Version)
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        // Correctly escape HTML special characters (v5 - Block Replace)
        return unsafe
             .replace(/&/g, "&")
             .replace(/</g, "<")
             .replace(/>/g, ">")
             .replace(/"/g, """)
             .replace(/'/g, "&#039;");
     }

    // --- Event Listeners ---
    journalForm.addEventListener('submit', handleFormSubmit);
    cancelEditButton.addEventListener('click', resetForm);

    // --- Initial Load ---
    fetchJournalEntries();
});