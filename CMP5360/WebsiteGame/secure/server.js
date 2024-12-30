const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const session = require('express-session');

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

app.use(express.json());

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

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
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(webpagesPath, 'gamepage.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(webpagesPath, 'loginpage.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(webpagesPath, 'registerpage.html'));
});

app.get('/get-score', (req, res) => {
  if (!req.session.userId) {
      return res.status(401).send("User not logged in.");
  }

  const sql = "SELECT score FROM users WHERE id = ?";
  con.query(sql, [req.session.userId], (err, results) => {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Database error.");
      }

      if (results.length === 0) {
          return res.status(404).send("User not found.");
      }

      res.json({ score: results[0].score });
  });
});

app.post('/register', (req, res) => {
  console.log("Register request received:", req.body);

  const { Email, Username, Password } = req.body;

  if (!Email || !Username || !Password) {
      return res.status(400).send("All fields are required.");
  }

  const normalizedUsername = Username.toLowerCase();

  bcrypt.hash(Password, 10)
      .then(hash => {
          const sql = "INSERT INTO users (username, password, email) VALUES (?, ?, ?)";
          con.query(sql, [normalizedUsername, hash, Email], (err, results) => {
              if (err) {
                  if (err.code === 'ER_DUP_ENTRY') {
                      return res.status(409).send("Username or email already exists.");
                  }
                  return res.status(500).send("Database error.");
              }
              res.status(200).send("Registration successful!");
          });
      })
      .catch(err => {
          console.error("Error hashing password:", err);
          res.status(500).send("An error occurred while encrypting the password.");
      });
});


app.post('/login', (req, res) => {
  const { Username, Password } = req.body;

  if (!Username || !Password) {
    return res.status(400).send("Username and password are required.");
  }

  const normalizedUsername = Username.toLowerCase();

  const sql = "SELECT * FROM users WHERE username = ?";
  con.query(sql, [normalizedUsername], (err, results) => {
    if (err) {
      return res.status(500).send("Database error.");
    }

    if (results.length === 0) {
      return res.status(401).send("Invalid username or password.");
    }

    const user = results[0];

    bcrypt.compare(Password, user.Password)
      .then(isMatch => {
        if (isMatch) {
          req.session.userId = user.id;
          res.json({ success: true, message: "Logged in successfully!" });
        } else {
          res.status(401).send("Invalid username or password.");
        }
      })
      .catch(err => {
        console.error("Error verifying password:", err);
        res.status(500).send("An error occurred during password verification.");
      });
  });
});




app.post('/save-score', (req, res) => {
  const { score } = req.body;
  if (typeof score === 'undefined') {
      return res.status(400).send('Score is required');
  }

  if (!req.session.userId) {
      return res.status(401).send('User not logged in');
  }

  const sql = "UPDATE users SET score = ? WHERE id = ?";
  con.query(sql, [score, req.session.userId], (err, results) => {
      if (err) {
          console.error("Database error while saving score:", err);
          return res.status(500).send('Database error');
      }

      console.log(`Score ${score} saved for user ${req.session.userId}`);
      res.status(200).send('Score saved successfully');
  });
});
  



app.use((req, res) => {
  res.status(404).sendFile(path.join(webpagesPath, '404Page.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
