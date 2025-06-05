// personal-website/admin/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises; // Use promises for async operations
const path = require('path');
const vm = require('vm'); // Import the vm module

const app = express();
const port = 3000;

// Middleware
app.use(cors()); // Allow requests from the frontend (running on a different origin)
app.use(express.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from public directory

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

// Writes data back to the JS file, preserving the variable assignment
async function writeDataFile(filePath, variableName, data) {
    try {
        const fullPath = path.join(__dirname, filePath);
        // Ensure data is an array
        const dataArray = Array.isArray(data) ? data : [];
        const arrayString = JSON.stringify(dataArray, null, 2); // Pretty print JSON
        const fileContent = `// ${path.basename(filePath)}\nconst ${variableName} = ${arrayString};\n`;
        await fs.writeFile(fullPath, fileContent, 'utf8');
        console.log(`Data successfully written to ${filePath}`);
    } catch (error) {
        console.error(`Error writing data file ${filePath}:`, error);
        throw error;
    }
}

// --- API Routes ---

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
        await writeDataFile(dataFiles[type].path, dataFiles[type].varName, currentData);
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
        await writeDataFile(dataFiles[type].path, dataFiles[type].varName, currentData);
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
        await writeDataFile(dataFiles[type].path, dataFiles[type].varName, currentData);
        res.json({ message: `${type} item deleted successfully`, item: deletedItem[0] });
    } catch (error) {
        res.status(500).json({ message: `Error deleting ${type} item`, error: error.message });
    }
});

// --- Serve the admin page ---
app.get('/', (req, res) => {
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