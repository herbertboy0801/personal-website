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

// Global variable to store git push status
const gitPushStatus = {
    works: { status: 'idle', message: '', timestamp: null }, // idle, pending, success, error
    blog: { status: 'idle', message: '', timestamp: null },
    tools: { status: 'idle', message: '', timestamp: null } // Add status for tools
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

// Reads a JS data file by executing it in a sandbox and extracting the variable
async function readDataFile(filePath, variableName) {
    try {
        const fullPath = path.join(__dirname, filePath);
        console.log(`[readDataFile] Reading: ${fullPath} for variable ${variableName}`); // DEBUG
        const fileContent = await fs.readFile(fullPath, 'utf8');
        console.log(`[readDataFile] Read content length: ${fileContent.length}`); // DEBUG

        // Create a sandbox context object
        const sandbox = { module: {}, exports: {} /* Add other globals if needed */ };
        // Append the variable name to the script content so runInNewContext returns its value
        const scriptContent = `${fileContent}\n${variableName};`;
        console.log(`[readDataFile] Prepared script content for vm (first 100 chars): ${scriptContent.substring(0, 100)}...`); // DEBUG

        // Run the script in a new context and get the result
        console.log(`[readDataFile] Executing vm.runInNewContext for ${filePath}...`); // DEBUG
        const data = vm.runInNewContext(scriptContent, sandbox, { filename: fullPath }); // Pass filename for better error messages
        console.log(`[readDataFile] vm execution successful for ${filePath}. Type of result: ${typeof data}`); // DEBUG

        if (!Array.isArray(data)) {
             console.warn(`[readDataFile] Variable '${variableName}' in ${filePath} is not an array or not found after execution. Result:`, data, `Returning empty array.`); // DEBUG
             return [];
        }

        return data; // Return the actual JavaScript array

    } catch (error) {
        // If file not found, return empty array assuming it's the first run
        if (error.code === 'ENOENT') {
            console.warn(`Data file ${filePath} not found, returning empty array.`);
            return [];
        }
        // Log the specific error before re-throwing
        console.error(`[readDataFile] Error reading or executing data file ${filePath} for variable ${variableName}:`, error.message, error.stack); // DEBUG
        throw error; // Re-throw other errors
    }
}

// Function to run git commands and push changes, updating status
// Accepts relative paths for data file and optional asset file (relative to REPO_PATH)
async function gitCommitAndPush(relativeDataPath, type, relativeAssetPath = null) {
    const fileName = path.basename(relativeDataPath);
    const commitMessage = `Update ${fileName} via admin tool`;
    console.log(`Attempting to commit and push changes for ${fileName} (type: ${type})...`);

    // Update status to pending
    gitPushStatus[type] = { status: 'pending', message: '推送中...', timestamp: Date.now() };

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
            const commitResult = await execPromise(`git commit -m "${commitMessage}"`, { cwd: REPO_PATH }); // Commit specific file
            commitStdout = commitResult.stdout;
            commitStderr = commitResult.stderr;
        } catch (commitError) {
            // Handle "nothing to commit"
            if (commitError.stdout && commitError.stdout.includes('nothing to commit')) {
                console.log('Nothing to commit.');
                gitPushStatus[type] = { status: 'idle', message: '无更改可推送。', timestamp: Date.now() };
                return; // Stop if nothing to commit
            } else {
                 console.error('Git commit failed:', commitError);
                 gitPushStatus[type] = { status: 'error', message: `Git commit 失败: ${commitError.message}`, timestamp: Date.now() };
                 return; // Stop the process if commit fails
            }
        }
        if (commitStderr) console.error('Git commit stderr:', commitStderr);
        console.log('Git commit stdout:', commitStdout);


        // 3. Push the changes (assuming 'origin' remote and 'main' branch)
        console.log(`Running: git push origin main in ${REPO_PATH}`);
        const { stdout: pushStdout, stderr: pushStderr } = await execPromise('git push origin main', { cwd: REPO_PATH });
        if (pushStderr) console.error('Git push stderr:', pushStderr); // Push errors often go to stderr
        console.log('Git push stdout:', pushStdout);

        console.log(`Successfully committed and pushed changes for ${fileName}.`);
        gitPushStatus[type] = { status: 'success', message: '推送成功！', timestamp: Date.now() }; // Update status on success

    } catch (error) {
        console.error(`Error during git operations for ${fileName}:`, error);
        gitPushStatus[type] = { status: 'error', message: `Git 操作失败: ${error.message}`, timestamp: Date.now() }; // Update status on error
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
        const fileContent = `// ${path.basename(filePath)}\nconst ${variableName} = ${arrayString};\n`;
        await fs.writeFile(fullDataPath, fileContent, 'utf8');
        console.log(`Data successfully written to ${filePath}`);

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
             // Update status on unexpected error during async execution
             if (gitPushStatus[type].status === 'pending') {
                 gitPushStatus[type] = { status: 'error', message: `后台推送出错: ${err.message}`, timestamp: Date.now() };
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
    tools: { path: 'tool-library-data.js', varName: 'toolLibraryData' }
    // diary: { path: 'learning-diary-data.js', varName: 'learningDiaryData' } // Removed
};

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

// --- API Route for Git Status --- (Defined BEFORE static files)
app.get('/api/git-status/:type', (req, res) => {
    const type = req.params.type;
    if (!gitPushStatus[type]) {
        return res.status(404).json({ message: 'Invalid data type for status' });
    }
    res.json(gitPushStatus[type]);
});

// --- API Route for Updating Backups --- (Defined BEFORE static files)
app.post('/api/update-backups', async (req, res) => {
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
    console.log(`  GET    /api/{works|blog|tools}`);
    console.log(`  POST   /api/{works|blog|tools}`);
    console.log(`  PUT    /api/{works|blog|tools}/{id}`); // ID is now unique string
    console.log(`  DELETE /api/{works|blog|tools}/{id}`); // ID is now unique string
    console.log(`  GET    /api/git-status/{works|blog|tools}`);
});