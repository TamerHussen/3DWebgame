// Import required modules
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Path to the JSON file
const dbFilePath = path.join(__dirname, 'database.json');

// Ensure the database.json file exists
if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, JSON.stringify([], null, 4));
    console.log('database.json created as it was missing.');
}

// Serve static files from the MyWebpages directory
app.use(express.static(path.join(__dirname, '../MyWebpages')));

// Route to handle user registration
app.post('/registerform', (req, res) => {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Read current data from database.json
    fs.readFile(dbFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading database:', err);
            return res.status(500).json({ error: 'Server error' });
        }

        let users = JSON.parse(data || '[]'); // Default to empty array if file is empty
        const newUserID = users.length > 0 ? users[users.length - 1].userID + 1 : 1;

        // Check if the email or username already exists
        const userExists = users.some(user => user.Email === email || user.Username === username);
        if (userExists) {
            return res.status(409).json({ error: 'User with this email or username already exists' });
        }

        // Add the new user
        const newUser = { Email: email, Username: username, Password: password, userID: newUserID };
        users.push(newUser);

        // Write updated data back to database.json
        fs.writeFile(dbFilePath, JSON.stringify(users, null, 4), (err) => {
            if (err) {
                console.error('Error writing to database:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            res.status(201).json({ message: 'User registered successfully' });
        });
    });
});

// Route to handle user login
app.post('/loginform', (req, res) => {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Read current data from database.json
    fs.readFile(dbFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading database:', err);
            return res.status(500).json({ error: 'Server error' });
        }

        const users = JSON.parse(data || '[]');
        const user = users.find(u => u.Username === username && u.Password === password);

        if (user) {
            res.status(200).json({ message: 'Login successful' });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    });
});

// Catch-all route for 404 errors
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../MyWebpages/404Page.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
