const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "thu_database"
});

con.connect((err) => {
  if (err) {
    console.error("Database connection failed: ", err.message);
    process.exit(1);
  }
  console.log("Connected to MySQL!");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const webpagesPath = path.resolve(__dirname, '../MyWebpages');
app.use(express.static(webpagesPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(webpagesPath, 'homepage.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(webpagesPath, 'aboutmepage.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(path.join(webpagesPath, 'gamepage.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(webpagesPath, 'loginpage.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(webpagesPath, 'registerpage.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(webpagesPath, '404Page.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

app.post('/register', (req, res) => {
  console.log("Register request received:", req.body);

  const { Email, Username, Password } = req.body;

  if (!Email || !Username || !Password) {
    console.log("Missing fields detected.");
    return res.status(400).send("All fields are required.");
  }

  bcrypt.hash(Password, 10, (err, hash) => {
    if (err) {
      console.error("Error hashing password:", err);
      return res.status(500).send("Error encrypting password.");
    }

    console.log("Password hashed successfully:", hash);

    const sql = "INSERT INTO users (username, password, email) VALUES (?, ?, ?)";
    console.log("Executing SQL query:", sql);

    con.query(sql, [Username, hash, Email], (err, results) => {
      if (err) {
        console.error("Database query error:", err);

        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).send("Username or email already exists.");
        }

        return res.status(500).send("Database error.");
      }

      console.log("User registered successfully:", results);
      return res.redirect('/login');
    });
  });
});


app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username and password are required.");
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  con.query(sql, [username], (err, results) => {
    if (err) {
      return res.status(500).send("Database error.");
    }

    if (results.length === 0) {
      return res.status(401).send("Invalid username or password.");
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).send("Error verifying password.");
      }

      if (isMatch) {
        res.send("Login successful");
      } else {
        res.status(401).send("Invalid username or password.");
      }
    });
  });
});

