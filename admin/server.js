// personal-website/admin/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs'); // Import the base fs module for sync operations
const fsPromises = fs.promises; // Keep using promises API for async operations
const path = require('path');
const vm = require('vm'); // Import the vm module
const { exec } = require('child_process'); // Import exec to run shell commands
const util = require('util'); // Import util for promisify
const execPromise = util.promisify(exec); // Promisify exec

const app = express();
const port = 3000;
const REPO_PATH = path.resolve(__dirname, '..'); // Get the absolute path to the repository root

// Global variable to store the status of the *last* git push attempt
let lastGitPushStatus = {
    status: 'idle', // idle, pending, success, error
    message: '',
    timestamp: null,
    type: null // Store which type triggered the last push ('works', 'blog', 'tools')
};

// Middleware
// Add request logger middleware FIRST
app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.originalUrl}`);
    next(); // Pass control to the next middleware/route handler
});

app.use(cors()); // Allow requests from the frontend (running on a different origin)
app.use(express.json()); // Parse JSON request bodies
// NOTE: Moved express.static further down

// --- Helper Functions ---

// Reads a JS data file by extracting the first array ([...]) or object ({...}) literal after an assignment
// and parsing it safely using vm.runInNewContext. Handles various assignment formats.
async function readDataFile(filePath, variableName, defaultOnError = null) { // Added defaultOnError parameter
    const fullPath = path.join(__dirname, filePath);
    console.log(`[readDataFile v3] Reading: ${fullPath}`); // v3 log
    let fileContent;
    try {
        // Use fsPromises for reading as it's async
        fileContent = await fsPromises.readFile(fullPath, 'utf8');
        console.log(`[readDataFile v2] Read content length: ${fileContent.length}`);
        // --- DEBUG: Log initial file content ---
        console.log(`[readDataFile v2 DEBUG] Initial content (first 500 chars):\n${fileContent.substring(0, 500)}`);
        // --- END DEBUG ---
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Data file ${filePath} not found, returning default value.`);
            return defaultOnError; // Return default value (null or {} or [])
        }
        console.error(`[readDataFile v3] Error reading file ${filePath}:`, error.message); // v3 log
        // Return default on other read errors
        console.warn(`[readDataFile v3] Returning default value due to read error.`); // v3 log
        return defaultOnError; // Return default value
    }

    let dataLiteralString = null; // Declare here to be accessible in catch block
    try {
        // Regex v8: Find the first array [...] OR object {...} after an assignment (=). Use greedy match.
        // Handles 'const var =', 'let var =', 'var var =', 'window.var =', 'module.exports =' etc.
        // Captures the content within the brackets/braces.
        // Allows for comments (// or /* */) and whitespace before the assignment.
        // Uses [\s\S]*? for non-greedy matching within brackets/braces.
        console.log(`[readDataFile v8] Attempting greedy match for '= [...]' or '= {...}'`); // v8 log
        // Look for an equals sign followed by an array OR object literal. Use greedy match for content.
        // The outer group ( ) captures either [...] or {...}
        // The inner group \[([\s\S]*)\] captures array content
        // The inner group \{([\s\S]*)\} captures object content
        // We now need group 1 which contains the full literal string (including brackets/braces)
        // Use greedy match for the content within braces/brackets
        const match = fileContent.match(/=\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*;/m);


        // We need the first capture group (index 1) which contains the array literal
        if (match && match[1]) {
            dataLiteralString = match[1]; // Assign to outer variable. Group 1 contains the full literal "[...]" or "{...}"
            console.log(`[readDataFile v8] Matched assignment. Extracted data literal string (first 100 chars): ${dataLiteralString.substring(0, 100)}...`); // v8 log

            // Use vm.runInNewContext to safely evaluate the JS array/object literal string
            // Wrap the literal in parentheses to ensure it's parsed as an expression (object/array literal)
            // not a block statement.
            const scriptToRun = `(${dataLiteralString})`;
            const sandbox = {}; // Minimal sandbox
            console.log(`[readDataFile v9] Running script in VM: ${scriptToRun.substring(0,100)}...`); // v9 log
            const data = vm.runInNewContext(scriptToRun, sandbox, { filename: fullPath + '-eval', timeout: 5000 });

            // --- Validation v9 ---
            // Basic check: ensure data is not null/undefined after parsing
            if (data !== null && typeof data !== 'undefined') {
                 const dataType = Array.isArray(data) ? 'array' : (typeof data === 'object' ? 'object' : typeof data);
                 const dataLength = Array.isArray(data) ? data.length : (typeof data === 'object' ? Object.keys(data).length : undefined);
                 console.log(`[readDataFile v9] Successfully parsed data from ${filePath}. Type: ${dataType}${dataLength !== undefined ? `, Length/Keys: ${dataLength}` : ''}`); // v9 log
                 return data; // Return the parsed data (array or object)
            } else {
                 console.warn(`[readDataFile v9] Parsed data from ${filePath} is null or undefined after VM execution. Returning default value.`); // v9 log
                 return defaultOnError; // Return default value
            }
        } else {
            // --- DEBUG: Log content on regex failure ---
            console.error(`[readDataFile v9 DEBUG] Regex failed to match pattern '= [...]' or '= {...}' in ${filePath}.`); // v9 log
            console.error(`[readDataFile v9 DEBUG] Content being checked (up to 1000 chars):\n${fileContent.substring(0, 1000)}`);
            // --- END DEBUG ---
            console.warn(`[readDataFile v9] Could not find assignment pattern in ${filePath}. Returning default value.`); // v9 log
            return defaultOnError; // Return default value
        }
    } catch (parseError) {
        console.error(`[readDataFile v9] Error parsing data literal from ${filePath}:`, parseError.message); // v9 log
        // --- DEBUG: Log the exact string that failed parsing ---
        if (dataLiteralString !== null) { // Check if it was assigned
            // Log the script that was attempted (with parentheses)
            console.error(`[readDataFile v9 DEBUG] Script that failed VM parsing (up to 500 chars):\n(${dataLiteralString.substring(0, 500)})`);
        } else {
            console.error(`[readDataFile v9 DEBUG] Could not log dataLiteralString as it was null (likely regex match failed before parsing attempt).`);
        }
        // --- END DEBUG ---
        console.error(`[readDataFile v9] File content (first 500 chars): ${fileContent.substring(0, 500)}...`); // v9 log
        // Return default on parsing error
        console.warn(`[readDataFile v9] Returning default value due to parsing error.`); // v9 log
        return defaultOnError; // Return default value
    }
}

// Function to run git commands and push changes, updating status
// Accepts relative paths for data file and optional asset file (relative to REPO_PATH)
async function gitCommitAndPush(relativeDataPath, type, relativeAssetPath = null) {
    const fileName = path.basename(relativeDataPath);
    const commitMessage = `Update ${fileName} via admin tool`;
    console.log(`Attempting to commit and push changes for ${fileName} (type: ${type})...`);

    // Update global status to pending
    lastGitPushStatus = { status: 'pending', message: '推送中...', timestamp: Date.now(), type: type };

    try {
        // 1. Add the specific file(s)
        console.log(`Running: git add "${relativeDataPath}" in ${REPO_PATH}`);
        const { stdout: addDataStdout, stderr: addDataStderr } = await execPromise(`git add "${relativeDataPath}"`, { cwd: REPO_PATH });
        if (addDataStderr) console.error(`Git add stderr for ${relativeDataPath}:`, addDataStderr);
        console.log(`Git add stdout for ${relativeDataPath}:`, addDataStdout);

        if (relativeAssetPath) {
            console.log(`Running: git add "${relativeAssetPath}" in ${REPO_PATH}`);
            const { stdout: addAssetStdout, stderr: addAssetStderr } = await execPromise(`git add "${relativeAssetPath}"`, { cwd: REPO_PATH });
            if (addAssetStderr) console.error(`Git add stderr for ${relativeAssetPath}:`, addAssetStderr);
            console.log(`Git add stdout for ${relativeAssetPath}:`, addAssetStdout);
        }

        // 2. Commit the changes
        console.log(`Running: git commit -m "${commitMessage}" in ${REPO_PATH}`); // Commit all staged changes
        // Use try-catch for commit as it might fail if nothing changed or other issues
        let commitStdout = '', commitStderr = ''; // Reset variables
        try {
            // Commit only the specific file(s) added in this operation
            // Commit only the specific file(s) added in this operation
            // Redirect stderr to NUL on Windows to suppress LF/CRLF warnings causing promise rejection
            const filesToCommit = `"${relativeDataPath}" ${relativeAssetPath ? `"${relativeAssetPath}"` : ''}`;
            const commitCommand = `git commit ${filesToCommit} -m "${commitMessage}" 2> NUL`;
            console.log(`Running: ${commitCommand} in ${REPO_PATH}`); // Log specific commit with redirection
            const commitResult = await execPromise(commitCommand, { cwd: REPO_PATH });
            commitStdout = commitResult.stdout;
            commitStderr = commitResult.stderr; // Stderr should now be empty due to redirection
        } catch (commitError) {
            // Handle "nothing to commit" more robustly
            // Check both stdout and stderr (just in case redirection didn't fully work or message is elsewhere)
            const output = (commitError.stdout || '') + (commitError.stderr || '');
            if (output.includes('nothing to commit') || output.includes('no changes added to commit')) {
                console.log('Nothing to commit.');
                // Update global status to idle, indicating no push was needed
                lastGitPushStatus = { status: 'idle', message: '无更改可推送。', timestamp: Date.now(), type: type };
                return; // Stop the process gracefully
            } else {
                 // Log the actual error object for more details
                 console.error('Git commit failed unexpectedly:', commitError);
                 // Provide a more informative error message in the status
                 // Use commitError.message which often contains the command's exit code or specific error
                 const detailedErrorMessage = commitError.message || '未知提交错误';
                 lastGitPushStatus = { status: 'error', message: `Git commit 失败: ${detailedErrorMessage}`, timestamp: Date.now(), type: type };
                 return; // Stop the process on failure
            }
        }
        // This line might not be reached if commit fails, but keep it for debugging successful commits
        if (commitStderr) console.error('Git commit stderr (should be empty):', commitStderr);
        console.log('Git commit stdout:', commitStdout);


        // 3. Push the changes (assuming 'origin' remote and 'main' branch)
        console.log(`Running: git push origin main in ${REPO_PATH}`);
        const { stdout: pushStdout, stderr: pushStderr } = await execPromise('git push origin main', { cwd: REPO_PATH });
        if (pushStderr) console.error('Git push stderr:', pushStderr); // Push errors often go to stderr
        console.log('Git push stdout:', pushStdout);

        console.log(`Successfully committed and pushed changes for ${fileName}.`);
        // Update global status on success
        lastGitPushStatus = { status: 'success', message: '推送成功！', timestamp: Date.now(), type: type };

    } catch (error) {
        console.error(`Error during git operations for ${fileName}:`, error);
        // Update global status on error
        lastGitPushStatus = { status: 'error', message: `Git 操作失败: ${error.message}`, timestamp: Date.now(), type: type };
        console.error('Automatic Git push failed. Please push manually.');
    }
}


// Writes data back to the JS file, preserving the variable assignment AND triggers git push
// filePath is relative to __dirname (admin folder)
async function writeDataFile(filePath, variableName, data, type, changedItem) { // Added changedItem
    const fullDataPath = path.join(__dirname, filePath);
    const relativeDataPath = path.relative(REPO_PATH, fullDataPath).replace(/\\/g, '/'); // Path relative to repo root for git

    try {
        // Stringify data (could be array or object)
        const dataString = JSON.stringify(data, null, 2); // Pretty print JSON
        // Write back in the window.variableName format for public site compatibility
        const fileContent = `// ${path.basename(filePath)}\nwindow.${variableName} = ${dataString};\n`;

        // --- Use synchronous write ONLY for settings file for testing persistence ---
        if (filePath === dataFiles.journalSettings.path) {
            console.log(`[writeDataFile DEBUG SYNC] Using writeFileSync for settings file: ${fullDataPath}`);
            console.log(`[writeDataFile DEBUG SYNC] Settings content to write:\n${fileContent}`); // Log content before sync write
            fs.writeFileSync(fullDataPath, fileContent, 'utf8'); // Use synchronous write
            console.log(`[writeDataFile DEBUG SYNC] Completed writeFileSync for settings file.`);
        } else {
            // --- Use fsPromises for asynchronous write for other data files ---
            await fsPromises.writeFile(fullDataPath, fileContent, 'utf8'); // Use async write from promises API
        }
        // --- End Sync/Async Logic ---

        console.log(`Data successfully written to ${filePath} (Type: ${typeof data}) in window.${variableName} format`); // Log data type

        // After successful write, attempt to commit and push
        // Check if the changed item has an imageSrc and if the file exists
        let relativeImagePath = null;
        if (changedItem && changedItem.imageSrc && typeof changedItem.imageSrc === 'string' && changedItem.imageSrc.startsWith('assets/')) {
            const potentialFullImagePath = path.resolve(REPO_PATH, changedItem.imageSrc);
            try {
                // Use fsPromises for checking access
                await fsPromises.access(potentialFullImagePath); // Check if file exists
                relativeImagePath = changedItem.imageSrc; // Use the relative path directly for git
                console.log(`Image file found for ${type} item: ${relativeImagePath}`);
            } catch (fsError) {
                // File doesn't exist or not accessible
                console.warn(`Image file specified in ${type} item not found or inaccessible: ${changedItem.imageSrc}`);
            }
        }

        // Run git commit/push asynchronously
        // to avoid blocking the API response. Errors are logged server-side.
        // Pass the type to the git function
        // --- Re-enabled Git push ---

        gitCommitAndPush(relativeDataPath, type, relativeImagePath).catch(err => { // Pass relative paths
             console.error("Error in background git push:", err);
             // Update global status on unexpected error during async execution
             if (lastGitPushStatus.status === 'pending') {
                  lastGitPushStatus = { status: 'error', message: `后台推送出错: ${err.message}`, timestamp: Date.now(), type: type };
             }
         });

        // console.log("[DEBUG] Git push is temporarily disabled in writeDataFile."); // Removed debug log
        // --- End temporary disable ---

    } catch (error) {
        console.error(`Error writing data file ${filePath}:`, error);
        throw error; // Re-throw error to be caught by the API route handler
    }
}


// --- API Routes --- (Define BEFORE static files)

const dataFiles = {
    // Paths are relative to __dirname (admin folder)
    works: { path: 'featured-works-data.js', varName: 'featuredWorksData' },
    blog: { path: 'blog-posts-data.js', varName: 'blogPosts' }, // Corrected path
    tools: { path: 'tool-library-data.js', varName: 'toolLibraryData' },
    // diary: { path: 'learning-diary-data.js', varName: 'learningDiaryData' } // Removed
    morningJournal: { path: 'morning-journal-data.js', varName: 'morningJournalEntries' }, // 添加晨间日记
    journalSettings: { path: 'journal-settings.js', varName: 'journalSettings' } // 添加日记设置
};

// --- API Route for Last Git Status --- (Define BEFORE generic routes)
app.get('/api/git-status/last', (req, res) => {
    // Return the single global status object
    res.json(lastGitPushStatus);
});


// --- API Route for Updating Backups --- (Define BEFORE generic routes)
app.post('/api/update-backups', async (req, res) => {
    // --- DEBUG: Confirm route is reached ---
    console.log('--- Reached /api/update-backups POST handler ---');
    // --- END DEBUG ---
    console.log('Received request to update backup files...');
    const backupFiles = [
        { source: 'blog-posts-data.js', backup: 'blog-posts-data.js.bak' },
        { source: 'featured-works-data.js', backup: 'featured-works-data.js.bak' },
        { source: 'tool-library-data.js', backup: 'tool-library-data.js.bak' }
    ];

    try {
        const copyPromises = backupFiles.map(async (file) => {
            const sourcePath = path.join(__dirname, file.source);
            const backupPath = path.join(__dirname, file.backup);
            console.log(`Copying ${sourcePath} to ${backupPath}`);
            // Use fsPromises.copyFile for efficient copying
            await fsPromises.copyFile(sourcePath, backupPath);
            console.log(`Successfully backed up ${file.source} to ${file.backup}`);
        });

        // Wait for all copy operations to complete
        await Promise.all(copyPromises);

        console.log('All backup files updated successfully.');
        res.json({ message: '所有备份文件已成功更新！' });

    } catch (error) {
        console.error('Error updating backup files:', error);
        res.status(500).json({ message: '更新备份文件时出错', error: error.message });
    }
});


// --- Generic API Routes ---

// --- Specific GET route for Morning Journal ---
app.get('/api/morningJournal', async (req, res) => {
    const type = 'morningJournal';
    console.log(`Received specific GET request for ${type}`); // Debug log
    if (!dataFiles[type]) {
        // This should ideally not happen if dataFiles is correct
        console.error(`Configuration error: dataFiles entry missing for ${type}`);
        return res.status(500).json({ message: 'Server configuration error for morningJournal' });
    }
    try {
        // Read data, providing an empty array as default if file not found or parse error
        const data = await readDataFile(dataFiles[type].path, dataFiles[type].varName, []);
        // Ensure data is sorted by date descending before sending (only if it's an array)
        if (Array.isArray(data)) {
             data.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        res.json(data);
    } catch (error) {
        console.error(`Error reading ${type} data specifically:`, error); // Specific error log
        res.status(500).json({ message: `Error reading ${type} data`, error: error.message });
    }
});
// --- End Specific GET route ---


// --- API Routes for Journal Settings --- (Moved BEFORE generic /api/:type GET)
app.get('/api/journal-settings', async (req, res) => {
    const type = 'journalSettings';
    if (!dataFiles[type]) {
        return res.status(500).json({ message: 'Server configuration error for journalSettings' });
    }
    try {
        // --- Restored original logic ---
        // Read settings, providing an empty object as default
        const settings = await readDataFile(dataFiles[type].path, dataFiles[type].varName, {});
        // --- DEBUG: Log the settings object *before* sending response ---
        console.log(`[GET /api/journal-settings DEBUG] Settings object read from file:`, settings);
        // --- END DEBUG ---
        res.json(settings);
        // --- End restored logic ---

    } catch (error) {
        // --- DEBUG: Log if an error occurs during readDataFile ---
        console.error(`[GET /api/journal-settings CATCH] Caught error during readDataFile:`, error);
        // --- END DEBUG ---
        console.error(`Error reading ${type} data:`, error);
        res.status(500).json({ message: `Error reading ${type} data`, error: error.message });
    }
});

// Generic GET route (Handles other types)
app.get('/api/:type', async (req, res) => {
    const type = req.params.type;
    // Add check to prevent this route from handling morningJournal if specific route failed somehow
    if (type === 'morningJournal') {
         console.warn("Generic GET route unexpectedly called for morningJournal. This shouldn't happen.");
         return res.status(500).json({ message: 'Internal routing error for morningJournal' });
    }
    if (!dataFiles[type]) {
        return res.status(404).json({ message: 'Invalid data type' });
    }
    try {
        // Read data, providing an empty array as default for list types
        const data = await readDataFile(dataFiles[type].path, dataFiles[type].varName, []);
        res.json(data);
    } catch (error) {
        // Catch potential errors not handled by readDataFile returning default
        console.error(`Unexpected error in GET /api/${type}:`, error);
        res.status(500).json({ message: `Error reading ${type} data`, error: error.message });
    }
});

// --- Specific route for updating featured blog posts ---
app.post('/api/blog/featured', async (req, res) => {
    const type = 'blog'; // Explicitly set type
    const { ids: featuredIds } = req.body; // Expecting { ids: ["blog-id-1", "blog-id-2"] }

    if (!Array.isArray(featuredIds)) {
        return res.status(400).json({ message: 'Invalid data format: "ids" must be an array.' });
    }

    console.log(`Received request to update featured blogs. IDs: ${featuredIds.join(', ')}`);

    try {
        // Read data, providing an empty array as default
        const currentData = await readDataFile(dataFiles[type].path, dataFiles[type].varName, []);

        // Update featured status for all items (Ensure currentData is an array)
        const updatedData = currentData.map(item => {
            // Ensure each item has an ID before checking
            if (item && item.id) {
                item.featured = featuredIds.includes(item.id); // Set featured based on presence in the list
            } else {
                // Handle items without IDs if necessary, maybe log a warning
                console.warn(`Blog item found without an ID during featured update:`, item);
            }
            return item;
        });

        // Write the entire updated array back
        // Pass type, but null for changedItem as it's a bulk update
        await writeDataFile(dataFiles[type].path, dataFiles[type].varName, updatedData, type, null);
        res.json({ message: `Featured blog posts updated successfully.` });

    } catch (error) {
        console.error(`Error updating featured blog posts:`, error);
        res.status(500).json({ message: `Error updating featured blog posts`, error: error.message });
    }
});
// --- End specific route ---

// Generic POST route (Add new item)
app.post('/api/:type', async (req, res) => {
    const type = req.params.type;
    if (!dataFiles[type]) {
        return res.status(404).json({ message: 'Invalid data type' });
    }
    try {
        // Read data, providing an empty array as default for list types
        const currentData = await readDataFile(dataFiles[type].path, dataFiles[type].varName, []);
        const newItem = req.body;
        // Basic validation: ensure newItem is an object and currentData is an array
        if (!Array.isArray(currentData)) {
            return res.status(500).json({ message: `Data for type ${type} is not an array. Cannot add item.` });
        }
        if (typeof newItem !== 'object' || newItem === null) {
             return res.status(400).json({ message: 'Invalid data format received.' });
        }
        // --- Morning Journal Specific Logic ---
        if (type === 'morningJournal') {
            // Validate required fields for morning journal
            const requiredFields = ['date', 'harvest', 'plan', 'gratitude', 'investment', 'connect'];
            const missingFields = requiredFields.filter(field => !(field in newItem) || newItem[field] === null || newItem[field] === undefined);
            if (missingFields.length > 0) {
                return res.status(400).json({ message: `Missing required fields for morning journal: ${missingFields.join(', ')}` });
            }
            // Use the date as the ID (YYYY-MM-DD format expected from client)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(newItem.date)) {
                 return res.status(400).json({ message: 'Invalid date format for morning journal. Use YYYY-MM-DD.' });
            }
            newItem.id = newItem.date;
            console.log(`Using date as ID for new ${type} item: ${newItem.id}`);

            // Check for duplicates based on ID (date)
            const existingIndex = currentData.findIndex(item => item.id === newItem.id);
            if (existingIndex !== -1) {
                return res.status(409).json({ message: `Morning journal entry for date ${newItem.id} already exists. Use PUT to update.` });
            }

        } else {
             // --- Default ID Generation for other types ---
             // Consider using a more robust UUID library in production if needed
             newItem.id = `${type}-${Date.now()}`;
             console.log(`Generated ID for new ${type} item: ${newItem.id}`);

             // Ensure new blog posts are not featured by default
             if (type === 'blog') {
                 newItem.featured = false;
             }
        }
        // --- End Specific Logic ---

        currentData.push(newItem); // Add to the end
        // Sort morning journal entries by date descending after adding
        if (type === 'morningJournal') {
            currentData.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        // Pass type and the new item to writeDataFile
        await writeDataFile(dataFiles[type].path, dataFiles[type].varName, currentData, type, newItem);
        res.status(201).json({ message: `${type} item added successfully`, item: newItem });
    } catch (error) {
        res.status(500).json({ message: `Error adding ${type} item`, error: error.message });
    }
});

// Generic PUT route (Update existing item by ID)
app.put('/api/:type/:id', async (req, res) => {
    const type = req.params.type;
    const itemId = req.params.id; // Use the unique string ID from the URL

    if (!dataFiles[type]) {
        return res.status(404).json({ message: 'Invalid data type' });
    }
    if (!itemId) { // Check if ID is provided
        return res.status(400).json({ message: 'Item ID is required' });
    }

    try {
        // Read data, providing an empty array as default for list types
        const currentData = await readDataFile(dataFiles[type].path, dataFiles[type].varName, []);
        // Ensure currentData is an array before searching
        if (!Array.isArray(currentData)) {
             return res.status(500).json({ message: `Data for type ${type} is not an array. Cannot update item.` });
        }
        const itemIndex = currentData.findIndex(item => item.id === itemId); // Find item by unique ID

        if (itemIndex === -1) { // Check if item was found
            return res.status(404).json({ message: `Item with ID '${itemId}' not found` });
        }

        const updatedItem = req.body;
         // Basic validation: ensure updatedItem is an object
        if (typeof updatedItem !== 'object' || updatedItem === null) {
             return res.status(400).json({ message: 'Invalid data format received.' });
        }

        // Ensure the ID in the body matches the ID in the URL (or assign it)
        updatedItem.id = itemId;

        // --- Morning Journal Specific Logic ---
        if (type === 'morningJournal') {
            // Validate required fields for morning journal update
            const requiredFields = ['date', 'harvest', 'plan', 'gratitude', 'investment', 'connect'];
            const missingFields = requiredFields.filter(field => !(field in updatedItem) || updatedItem[field] === null || updatedItem[field] === undefined);
            if (missingFields.length > 0) {
                return res.status(400).json({ message: `Missing required fields for morning journal update: ${missingFields.join(', ')}` });
            }
            // Ensure date matches ID if updating morning journal
            if (updatedItem.date !== itemId) {
                 console.warn(`Morning journal update for ID ${itemId} has mismatched date ${updatedItem.date}. Using ID as the canonical date.`);
                 updatedItem.date = itemId; // Force date to match ID
            }
        }
        // --- End Specific Logic ---

        // Preserve existing 'featured' status if not provided in the update for blogs
        if (type === 'blog' && typeof updatedItem.featured === 'undefined') {
            updatedItem.featured = currentData[itemIndex].featured || false; // Keep existing or default to false
        }

        currentData[itemIndex] = updatedItem; // Replace item at the found index

        // Sort morning journal entries by date descending after updating
        if (type === 'morningJournal') {
            currentData.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        // Pass type and the updated item to writeDataFile
        await writeDataFile(dataFiles[type].path, dataFiles[type].varName, currentData, type, updatedItem);
        res.json({ message: `${type} item updated successfully`, item: updatedItem });
    } catch (error) {
        res.status(500).json({ message: `Error updating ${type} item`, error: error.message });
    }
});

// --- New route for importing Morning Journal entries ---
app.post('/api/morningJournal/import-localstorage', async (req, res) => {
    const type = 'morningJournal';
    // 直接从请求体获取导入的条目数组
    const importedEntries = req.body;

    // 检查请求体是否为数组
    if (!Array.isArray(importedEntries)) {
        console.error("Import failed: Request body is not an array.", req.body); // 添加日志
        return res.status(400).json({ message: 'Invalid data format: Request body must be an array of entries.' });
    }

    console.log(`Received request to import ${importedEntries.length} morning journal entries from LocalStorage.`);

    try {
        // Read data, providing an empty array as default
        const currentData = await readDataFile(dataFiles[type].path, dataFiles[type].varName, []);
         // Ensure currentData is an array before proceeding
        if (!Array.isArray(currentData)) {
            return res.status(500).json({ message: `Data for type ${type} is not an array. Cannot import items.` });
        }

        // Use a Map to merge data, ensuring uniqueness by ID (date) and prioritizing imported entries
        const mergedDataMap = new Map();

        // Add current data to the map first
        currentData.forEach(item => {
            if (item && item.id) {
                mergedDataMap.set(item.id, item);
            } else {
                console.warn("Found existing morning journal item without ID during import:", item);
            }
        });

        // Add imported data, overwriting existing entries with the same ID
        let importedCount = 0;
        let validationErrors = [];
        importedEntries.forEach(item => {
            // Basic validation for imported items
            if (item && item.id && item.date && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && item.id === item.date) {
                 // Ensure all required fields exist (even if empty strings)
                 const requiredFields = ['harvest', 'plan', 'gratitude', 'investment', 'connect'];
                 let valid = true;
                 requiredFields.forEach(field => {
                     if (!(field in item)) {
                         console.warn(`Imported item ${item.id} missing field '${field}'. Setting to empty string.`);
                         item[field] = ""; // Add missing field as empty string
                     }
                 });
                 mergedDataMap.set(item.id, item);
                 importedCount++;
            } else {
                console.warn("Skipping invalid or incomplete imported morning journal item:", item);
                validationErrors.push(`Invalid item skipped: ${JSON.stringify(item)}`);
            }
        });

        // Convert map values back to an array
        const finalData = Array.from(mergedDataMap.values());

        // Sort the final merged data by date descending
        finalData.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Write the entire merged and sorted array back
        // Pass type, but null for changedItem as it's a bulk import
        await writeDataFile(dataFiles[type].path, dataFiles[type].varName, finalData, type, null);

        const message = `Successfully imported ${importedCount} morning journal entries. Total entries: ${finalData.length}.`;
        console.log(message);
        if (validationErrors.length > 0) {
             console.warn("Import validation warnings:", validationErrors);
             res.status(207).json({ message: `${message} Some items were skipped due to validation errors.`, warnings: validationErrors, totalEntries: finalData.length }); // 207 Multi-Status
        } else {
             res.json({ message: message, totalEntries: finalData.length });
        }

    } catch (error) {
        console.error(`Error importing morning journal entries:`, error);
        res.status(500).json({ message: `Error importing morning journal entries`, error: error.message });
    }
});
// --- End import route ---


// Generic DELETE route (Delete item by ID)
app.delete('/api/:type/:id', async (req, res) => {
    const type = req.params.type;
    const itemId = req.params.id; // Use the unique string ID from the URL

    if (!dataFiles[type]) {
        return res.status(404).json({ message: 'Invalid data type' });
    }
     if (!itemId) { // Check if ID is provided
        return res.status(400).json({ message: 'Item ID is required' });
    }

    try {
        // Read data, providing an empty array as default for list types
        const currentData = await readDataFile(dataFiles[type].path, dataFiles[type].varName, []);
        // Ensure currentData is an array before searching
        if (!Array.isArray(currentData)) {
             return res.status(500).json({ message: `Data for type ${type} is not an array. Cannot delete item.` });
        }
        const itemIndex = currentData.findIndex(item => item.id === itemId); // Find item by unique ID

        if (itemIndex === -1) { // Check if item was found
            return res.status(404).json({ message: `Item with ID '${itemId}' not found` });
        }

        const deletedItem = currentData.splice(itemIndex, 1); // Remove item at the found index
        // Pass type to writeDataFile, but null for changedItem as it's a delete
        await writeDataFile(dataFiles[type].path, dataFiles[type].varName, currentData, type, null);
        res.json({ message: `${type} item deleted successfully`, item: deletedItem[0] });
    } catch (error) {
        res.status(500).json({ message: `Error deleting ${type} item`, error: error.message });
    }
});


// --- (Moved GET /api/journal-settings before generic GET /api/:type) ---

app.put('/api/journal-settings', async (req, res) => {
    const type = 'journalSettings';
    if (!dataFiles[type]) {
        return res.status(500).json({ message: 'Server configuration error for journalSettings' });
    }
    const updatedSettings = req.body;

    // Basic validation: ensure it's an object
    if (typeof updatedSettings !== 'object' || updatedSettings === null) {
        return res.status(400).json({ message: 'Invalid data format: Request body must be an object.' });
    }

    // Optional: Add more specific validation for setting fields (e.g., date format, number types)
    // ... validation logic ...

    try {
        // Write the updated settings object back to the file
        // Pass type, but null for changedItem as it's a settings update
        await writeDataFile(dataFiles[type].path, dataFiles[type].varName, updatedSettings, type, null);
        res.json({ message: 'Journal settings updated successfully.', settings: updatedSettings });
        // Removed incorrect call to pollGitStatus() here. Git operations are handled async within writeDataFile.
    } catch (error) {
        console.error(`Error writing ${type} data:`, error);
        // Ensure response is only sent if headers haven't been sent yet
        if (!res.headersSent) {
             res.status(500).json({ message: `Error writing ${type} data`, error: error.message });
        } else {
             console.error("Headers already sent, could not send error response to client.");
        }
    }
});
// --- End Journal Settings API Routes ---


// --- (Shutdown route removed) ---
// --- Static Files Middleware & Routes --- (AFTER API routes)

// 1. Serve admin static files under the /admin path
app.use('/admin', express.static(path.join(__dirname, 'public')));

// 2. Serve the admin page specifically at /admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 3. Serve main site static files from the project root (parent directory)
//    This needs to handle CSS, JS, images etc. from the root
app.use(express.static(path.join(__dirname, '..')));

// 4. Serve the main site index.html for the root route (Must be last route)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});


// --- Start Server ---
app.listen(port, () => {
    console.log(`Admin server listening at http://localhost:${port}`);
    console.log(`Serving admin UI from: ${path.join(__dirname, 'public')}`);
    console.log('API Endpoints:');
    console.log(`  GET    /api/{works|blog|tools|morningJournal}`);
    console.log(`  POST   /api/{works|blog|tools|morningJournal}`);
    console.log(`  PUT    /api/{works|blog|tools|morningJournal}/{id}`); // ID is now unique string
    console.log(`  DELETE /api/{works|blog|tools|morningJournal}/{id}`); // ID is now unique string
    console.log(`  POST   /api/blog/featured`);
    console.log(`  POST   /api/morningJournal/import-localstorage`); // Import route
    console.log(`  GET    /api/journal-settings`); // Settings GET route
    console.log(`  PUT    /api/journal-settings`); // Settings PUT route
    console.log(`  GET    /api/git-status/last`);
    console.log(`  POST   /api/update-backups`);
});