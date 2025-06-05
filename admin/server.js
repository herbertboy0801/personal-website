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
    blog: { status: 'idle', message: '', timestamp: null }
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
        const fileContent = await fs.readFile(fullPath, 'utf8');

        // Create a sandbox context object
        const sandbox = { module: {}, exports: {} /* Add other globals if needed */ };
        // Append the variable name to the script content so runInNewContext returns its value
        const scriptContent = `${fileContent}\n${variableName};`;

        // Run the script in a new context and get the result
        const data = vm.runInNewContext(scriptContent, sandbox, { filename: fullPath }); // Pass filename for better error messages

        if (!Array.isArray(data)) {
             console.warn(`Variable '${variableName}' in ${filePath} is not an array or not found after execution. Returning empty array.`);
             return [];
        }

        return data; // Return the actual JavaScript array

    } catch (error) {
        // If file not found, return empty array assuming it's the first run
        if (error.code === 'ENOENT') {
            console.warn(`Data file ${filePath} not found, returning empty array.`);
            return [];
        }
        console.error(`Error reading data file ${filePath}:`, error);
        throw error; // Re-throw other errors
    }
}

// Function to run git commands and push changes, updating status
async function gitCommitAndPush(filePathToPush, type) { // Added type parameter
    const fileName = path.basename(filePathToPush);
    const commitMessage = `Update ${fileName} via admin tool`;
    console.log(`Attempting to commit and push changes for ${fileName} (type: ${type})...`);

    // Update status to pending
    gitPushStatus[type] = { status: 'pending', message: '推送中...', timestamp: Date.now() };

    try {
        // 1. Add the specific file
        console.log(`Running: git add "${filePathToPush}" in ${REPO_PATH}`);
        const { stdout: addStdout, stderr: addStderr } = await execPromise(`git add "${filePathToPush}"`, { cwd: REPO_PATH });
        if (addStderr) console.error('Git add stderr:', addStderr);
        console.log('Git add stdout:', addStdout);

        // 2. Commit the changes
        // Explicitly commit only the added file to avoid committing unrelated changes
        console.log(`Running: git commit "${filePathToPush}" -m "${commitMessage}" in ${REPO_PATH}`);
        // Use try-catch for commit as it might fail if nothing changed or other issues
        let commitStdout = '', commitStderr = '';
        try {
            const commitResult = await execPromise(`git commit "${filePathToPush}" -m "${commitMessage}"`, { cwd: REPO_PATH }); // Commit specific file
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
async function writeDataFile(filePath, variableName, data, type) { // Added type parameter
    const fullPath = path.join(__dirname, filePath); // Define fullPath here to use later
    try {
        // Ensure data is an array
        const dataArray = Array.isArray(data) ? data : [];
        const arrayString = JSON.stringify(dataArray, null, 2); // Pretty print JSON
        const fileContent = `// ${path.basename(filePath)}\nconst ${variableName} = ${arrayString};\n`;
        await fs.writeFile(fullPath, fileContent, 'utf8');
        console.log(`Data successfully written to ${filePath}`);

        // After successful write, attempt to commit and push
        // We run this asynchronously and don't wait for it to finish
        // to avoid blocking the API response. Errors are logged server-side.
        // Pass the type to the git function
        gitCommitAndPush(fullPath, type).catch(err => {
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
    works: { path: '../featured-works-data.js', varName: 'featuredWorksData' },
    blog: { path: '../blog-data.js', varName: 'blogPosts' }
    // diary: { path: '../learning-diary-data.js', varName: 'learningDiaryData' } // Removed
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
        currentData.push(newItem); // Add to the end
        // Pass type to writeDataFile
        await writeDataFile(dataFiles[type].path, dataFiles[type].varName, currentData, type);
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
    const id = parseInt(req.params.id, 10); // Use index as ID

    if (!dataFiles[type]) {
        return res.status(404).json({ message: 'Invalid data type' });
    }
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
    }

    try {
        const currentData = await readDataFile(dataFiles[type].path, dataFiles[type].varName);
        if (id < 0 || id >= currentData.length) {
            return res.status(404).json({ message: 'Item not found at the specified index' });
        }
        const updatedItem = req.body;
         // Basic validation: ensure updatedItem is an object
        if (typeof updatedItem !== 'object' || updatedItem === null) {
             return res.status(400).json({ message: 'Invalid data format received.' });
        }
        currentData[id] = updatedItem; // Replace item at index
        // Pass type to writeDataFile
        await writeDataFile(dataFiles[type].path, dataFiles[type].varName, currentData, type);
        res.json({ message: `${type} item updated successfully`, item: updatedItem });
    } catch (error) {
        res.status(500).json({ message: `Error updating ${type} item`, error: error.message });
    }
});

// Generic DELETE route (Delete item by index)
app.delete('/api/:type/:id', async (req, res) => {
    const type = req.params.type;
    const id = parseInt(req.params.id, 10); // Use index as ID

    if (!dataFiles[type]) {
        return res.status(404).json({ message: 'Invalid data type' });
    }
     if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
    }

    try {
        const currentData = await readDataFile(dataFiles[type].path, dataFiles[type].varName);
        if (id < 0 || id >= currentData.length) {
            return res.status(404).json({ message: 'Item not found at the specified index' });
        }
        const deletedItem = currentData.splice(id, 1); // Remove item at index
        // Pass type to writeDataFile
        await writeDataFile(dataFiles[type].path, dataFiles[type].varName, currentData, type);
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

// --- Static Files Middleware --- (Moved here, AFTER API routes)
app.use(express.static(path.join(__dirname, 'public')));

// --- Serve the admin page (Root Route - Should be last) ---
app.get('/', (req, res) => {
    // This will now likely be handled by express.static serving index.html from public
    // But keeping it as a fallback doesn't hurt.
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// --- Start Server ---
app.listen(port, () => {
    console.log(`Admin server listening at http://localhost:${port}`);
    console.log(`Serving admin UI from: ${path.join(__dirname, 'public')}`);
    console.log('API Endpoints:');
    console.log(`  GET    /api/{works|blog}`);
    console.log(`  POST   /api/{works|blog}`);
    console.log(`  PUT    /api/{works|blog}/{index}`);
    console.log(`  DELETE /api/{works|blog}/{index}`);
});