const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',        // MySQL host (usually localhost)
  user: 'root',             // Your MySQL username (root if using default setup)
  password: '',             // Your MySQL password (empty if no password)
  database: 'thu_database'  // Name of your database
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database');
});

// Serve static files from the MyWebpages directory
// Adjusting the path to point to your MyWebpages directory, which is outside of this folder
app.use(express.static(path.join(__dirname, '../MyWebpages')));

// Route to handle user registration
app.post('/registerform', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('All fields are required');
    }

    // Check if the email or username already exists in the database
    db.query('SELECT * FROM users WHERE Email = ? OR Username = ?', [email, username], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            return res.status(409).send('User with this email or username already exists');
        }

        // Insert the new user into the database
        const newUser = { Email: email, Username: username, Password: password };
        db.query('INSERT INTO users (Email, Username, Password) VALUES (?, ?, ?)', [email, username, password], (err, results) => {
            if (err) {
                console.error('Error inserting new user:', err);
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

    // Check user credentials against the database
    db.query('SELECT * FROM users WHERE Username = ? AND Password = ?', [username, password], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            res.status(200).send('Login successful');
        } else {
            res.status(401).send('Invalid username or password');
        }
    });
});

// Catch-all route for 404 errors (if the route is not found)
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../MyWebpages/404Page.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
