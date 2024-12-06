const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Path to the JSON file
const dbFilePath = path.join(__dirname, 'database.json');

// Serve static files from MyWebpages directory
app.use(express.static(path.join(__dirname, '../MyWebpages')));

// Route to handle user registration
app.post('/registerform', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('All fields are required');
    }

    // Read current data from database.json
    fs.readFile(dbFilePath, (err, data) => {
        if (err) {
            console.error('Error reading database:', err);
            return res.status(500).send('Server error');
        }

        let users = JSON.parse(data);
        const newUserID = users.length > 0 ? users[users.length - 1].userID + 1 : 1;

        // Check if the email or username already exists
        const userExists = users.some(user => user.Email === email || user.Username === username);
        if (userExists) {
            return res.status(409).send('User with this email or username already exists');
        }

        // Add the new user
        const newUser = { Email: email, Username: username, Password: password, userID: newUserID };
        users.push(newUser);

        // Write updated data back to database.json
        fs.writeFile(dbFilePath, JSON.stringify(users, null, 4), (err) => {
            if (err) {
                console.error('Error writing to database:', err);
                return res.status(500).send('Server error');
            }

            res.status(201).send('User registered successfully');
        });
    });
});

// Route to handle user login
app.post('/loginform', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('All fields are required');
    }

    // Read current data from database.json
    fs.readFile(dbFilePath, (err, data) => {
        if (err) {
            console.error('Error reading database:', err);
            return res.status(500).send('Server error');
        }

        const users = JSON.parse(data);
        const user = users.find(u => u.Username === username && u.Password === password);

        if (user) {
            res.status(200).send('Login successful');
        } else {
            res.status(401).send('Invalid username or password');
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
