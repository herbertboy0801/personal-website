// personal-website/admin/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises; // Use promises for async operations
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

// Reads a JS data file by extracting the first array/object literal after an assignment
// and parsing it safely using vm.runInNewContext. Handles various assignment formats.
async function readDataFile(filePath, variableName) { // variableName is kept for API consistency but less relevant now
    const fullPath = path.join(__dirname, filePath);
    console.log(`[readDataFile v2] Reading: ${fullPath}`);
    let fileContent;
    try {
        fileContent = await fs.readFile(fullPath, 'utf8');
        console.log(`[readDataFile v2] Read content length: ${fileContent.length}`);
        // --- DEBUG: Log initial file content ---
        console.log(`[readDataFile v2 DEBUG] Initial content (first 500 chars):\n${fileContent.substring(0, 500)}`);
        // --- END DEBUG ---
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Data file ${filePath} not found, returning empty array.`);
            return [];
        }
        console.error(`[readDataFile v2] Error reading file ${filePath}:`, error.message);
        // Return empty array on read error other than ENOENT to prevent crashes
        console.warn(`[readDataFile v2] Returning empty array due to read error.`);
        return [];
        // throw error; // Optionally re-throw if strict error handling is needed
    }

    try {
        // Regex to find the first array [...] or object {...} after an assignment (=)
        // Handles 'const var =', 'let var =', 'var var =', 'window.var =', 'module.exports =' etc.
        // Captures the content within the brackets/braces.
        // Allows for comments (// or /* */) and whitespace before the assignment.
        // Uses [\s\S]*? for non-greedy matching within brackets/braces.
        // --- Attempt v6: Simpler regex focusing on '= [...]' ---
        console.log(`[readDataFile v6] Attempting simpler match for '= [...]'`); // v6 log
        // Look for an equals sign followed by an array literal. Use greedy match for array content.
        const match = fileContent.match(/\s*=\s*(\[[\s\S]*\]);?/m);


        // We need the first capture group (index 1) which contains the array literal
        if (match && match[1]) {
            const dataLiteralString = match[1]; // Use group 1
            console.log(`[readDataFile v6] Matched '= [...]'. Extracted data literal string (first 100 chars): ${dataLiteralString.substring(0, 100)}...`); // v6 log

            // Use vm.runInNewContext to safely evaluate the JS array/object literal string
            // This is generally safer than JSON.parse for JS literals (handles comments, trailing commas etc.)
            // Assign to a temporary variable within the context to avoid potential issues with direct expression evaluation.
            const sandbox = {}; // Minimal sandbox is sufficient
            // Try evaluating the literal string directly, without extra wrappers
            console.log(`[readDataFile v2] Running script in VM: (evaluating extracted literal directly)`); // DEBUG
            const data = vm.runInNewContext(dataLiteralString, sandbox, { filename: fullPath + '-eval', timeout: 5000 }); // Add timeout

            // --- Validation ---
            // Ensure it's an array as expected by the rest of the application logic
            if (Array.isArray(data)) {
                 console.log(`[readDataFile v6] Successfully parsed data as array from ${filePath}. Length: ${data.length}`); // v6 log
                 return data; // Return the actual JavaScript array
            } else {
                 console.warn(`[readDataFile v6] Parsed data from ${filePath} is not an array. Type: ${typeof data}. Returning empty array.`); // v6 log
                 return [];
            }
        } else {
            // --- DEBUG: Log content on regex failure ---
            console.error(`[readDataFile v6 DEBUG] Simpler Regex failed to match pattern '= [...]' in ${filePath}.`); // v6 log
            console.error(`[readDataFile v6 DEBUG] Content being checked (up to 1000 chars):\n${fileContent.substring(0, 1000)}`);
            // --- END DEBUG ---
            console.warn(`[readDataFile v6] Could not find '= [...]' assignment pattern in ${filePath}. Returning empty array.`); // v6 log
            return [];
        }
    } catch (parseError) {
        console.error(`[readDataFile v6] Error parsing data literal from ${filePath}:`, parseError.message); // v6 log
        console.error(`[readDataFile v6] File content (first 500 chars): ${fileContent.substring(0, 500)}...`); // v6 log
        // Return empty array on parsing error to prevent crashes
        console.warn(`[readDataFile v6] Returning empty array due to parsing error.`); // v6 log
        return [];
        // throw new Error(`Failed to parse data from ${filePath}: ${parseError.message}`); // Optionally re-throw
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
        // Ensure data is an array
        const dataArray = Array.isArray(data) ? data : [];
        const arrayString = JSON.stringify(dataArray, null, 2); // Pretty print JSON
        // Write back in the window.variableName format for public site compatibility
        const fileContent = `// ${path.basename(filePath)}\nwindow.${variableName} = ${arrayString};\n`;
        await fs.writeFile(fullDataPath, fileContent, 'utf8');
        console.log(`Data successfully written to ${filePath} in window.${variableName} format`); // Update log message

        // After successful write, attempt to commit and push
        // Check if the changed item has an imageSrc and if the file exists
        let relativeImagePath = null;
        if (changedItem && changedItem.imageSrc && typeof changedItem.imageSrc === 'string' && changedItem.imageSrc.startsWith('assets/')) {
            const potentialFullImagePath = path.resolve(REPO_PATH, changedItem.imageSrc);
            try {
                await fs.access(potentialFullImagePath); // Check if file exists
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
        gitCommitAndPush(relativeDataPath, type, relativeImagePath).catch(err => { // Pass relative paths
             console.error("Error in background git push:", err);
             // Update global status on unexpected error during async execution
             if (lastGitPushStatus.status === 'pending') {
                  lastGitPushStatus = { status: 'error', message: `后台推送出错: ${err.message}`, timestamp: Date.now(), type: type };
             }
         });

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
    morningJournal: { path: 'morning-journal-data.js', varName: 'morningJournalEntries' } // 添加晨间日记
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
            // Use fs.copyFile for efficient copying
            await fs.copyFile(sourcePath, backupPath);
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

// Generic GET route
app.get('/api/:type', async (req, res) => {
    const type = req.params.type;
    if (!dataFiles[type]) {
        return res.status(404).json({ message: 'Invalid data type' });
    }
    try {
        const data = await readDataFile(dataFiles[type].path, dataFiles[type].varName);
        res.json(data);
    } catch (error) {
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
        const currentData = await readDataFile(dataFiles[type].path, dataFiles[type].varName);

        // Update featured status for all items
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
        const currentData = await readDataFile(dataFiles[type].path, dataFiles[type].varName);
        const newItem = req.body;
        // Basic validation: ensure newItem is an object
        if (typeof newItem !== 'object' || newItem === null) {
             return res.status(400).json({ message: 'Invalid data format received.' });
        }
        // Generate a unique ID for the new item (simple timestamp-based ID)
        // Consider using a more robust UUID library in production if needed
        newItem.id = `${type}-${Date.now()}`;
        console.log(`Generated ID for new ${type} item: ${newItem.id}`);

        // Ensure new blog posts are not featured by default
        if (type === 'blog') {
            newItem.featured = false;
        }

        currentData.push(newItem); // Add to the end
        // Pass type and the new item to writeDataFile
        await writeDataFile(dataFiles[type].path, dataFiles[type].varName, currentData, type, newItem);
        res.status(201).json({ message: `${type} item added successfully`, item: newItem });
    } catch (error) {
        res.status(500).json({ message: `Error adding ${type} item`, error: error.message });
    }
});

// Generic PUT route (Update existing item by index)
// Note: Using index as ID is simple but fragile if order changes externally.
// A unique ID property on each item would be more robust.
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
        const currentData = await readDataFile(dataFiles[type].path, dataFiles[type].varName);
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

        // Preserve existing 'featured' status if not provided in the update for blogs
        if (type === 'blog' && typeof updatedItem.featured === 'undefined') {
            updatedItem.featured = currentData[itemIndex].featured || false; // Keep existing or default to false
        }

        currentData[itemIndex] = updatedItem; // Replace item at the found index
        // Pass type and the updated item to writeDataFile
        await writeDataFile(dataFiles[type].path, dataFiles[type].varName, currentData, type, updatedItem);
        res.json({ message: `${type} item updated successfully`, item: updatedItem });
    } catch (error) {
        res.status(500).json({ message: `Error updating ${type} item`, error: error.message });
    }
});

// Generic DELETE route (Delete item by index)
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
        const currentData = await readDataFile(dataFiles[type].path, dataFiles[type].varName);
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
    console.log(`  POST   /api/blog/featured`); // New route for featured blogs
    console.log(`  GET    /api/git-status/last`); // Updated Git status endpoint
    console.log(`  POST   /api/update-backups`);
});