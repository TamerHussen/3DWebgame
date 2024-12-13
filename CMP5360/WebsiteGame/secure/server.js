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

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username and password are required.");
  }

  con.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        return res.status(500).send("Database error.");
      }

      if (results.length === 0) {
        return res.status(401).send("Invalid credentials.");
      }

      const user = results[0];

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          return res.status(500).send("Error verifying password.");
        }
        if (isMatch) {
          res.send("Login successful");
        } else {
          res.status(401).send("Invalid credentials.");
        }
      });
    }
  );
});

app.post('/register', (req, res) => {
    const { username, password, email } = req.body;
  
    if (!username || !password || !email) {
      return res.status(400).send("All fields are required.");
    }
  
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).send("Error encrypting password.");
      }
  
      con.query(
        "INSERT INTO users (username, password, email) VALUES (?, ?, ?)",
        [username, hash, email],
        (err, results) => {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              return res.status(409).send("Username or email already exists.");
            }
            return res.status(500).send("Database error.");
          }
  
          res.redirect('/loginpage.html');
        }
      );
    });
  });