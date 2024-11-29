const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Create a MySQL connection pool
const db = mysql.createPool({
    host: 'localhost',
    user: 'my_user', // Replace with your MySQL username
    password: 'my_password', // Replace with your MySQL password
    database: 'my_database'
});

// Test database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database');
    connection.release();
});

// Serve static files (e.g., HTML, CSS, JavaScript) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to handle user registration
app.post('/registerform', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('All fields are required');
    }

    // SQL query to insert a new user
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(query, [username, email, password], (err, result) => {
        if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).send('Server error');
        }
        res.status(201).send('User registered successfully');
    });
});

// Route to handle user login
app.post('/loginform', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('All fields are required');
    }

    // SQL query to check if the username and password match
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            res.status(200).send('Login successful');
        } else {
            res.status(401).send('Invalid username or password');
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
