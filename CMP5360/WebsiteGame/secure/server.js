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
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'thu_secretKey_1414',
  resave: false,
  saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
          console.error("Database error while fetching score:", err);
          return res.status(500).send("Database error.");
      }

      if (results.length === 0) {
          return res.status(404).send("User not found.");
      }

      res.json({ score: results[0].score || 0 });
  });
});

app.get('/leaderboard', (req, res) => {
  const sql = "SELECT username, score FROM users ORDER BY score DESC LIMIT 10";
  con.query(sql, (err, results) => {
      if (err) {
          console.error("Database error while fetching leaderboard:", err);
          return res.status(500).send("Database error.");
      }
      res.json(results);
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
      console.log("Generated hash:", hash);
      const sql = "INSERT INTO users (username, password, email) VALUES (?, ?, ?)";
      con.query(sql, [normalizedUsername, hash, Email], (err, results) => {
          if (err) {
              console.error("Database error during registration:", err);
              return res.status(500).send("Database error.");
          }
          res.status(200).send("Registration successful!");
      });
  })
  .catch(err => {
      console.error("Error hashing password:", err);
      res.status(500).send("Error during registration.");
  });

});

app.post('/login', async (req, res) => {
  console.log("Login request body:", req.body);

  const { Username, Password } = req.body;

  if (!Username || !Password) {
      return res.status(400).send("Username and password are required.");
  }

  const normalizedUsername = Username.trim().toLowerCase();

  const sql = "SELECT * FROM users WHERE username = ?";
  con.query(sql, [normalizedUsername], async (err, results) => {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Internal server error.");
      }

      if (results.length === 0) {
          console.error("No user found with the given username.");
          return res.status(401).send("Invalid username or password.");
      }

      const user = results[0];
      console.log("Fetched user record:", user);

      const hashedPassword = user.Password || user.password;
      if (!hashedPassword) {
          console.error("No password hash found for user:", user);
          return res.status(500).send("Server error: Missing password hash.");
      }

      try {
          const isMatch = await bcrypt.compare(Password, hashedPassword);
          if (!isMatch) {
              console.error("Password does not match.");
              return res.status(401).send("Invalid username or password.");
          }

          req.session.userId = user.ID || user.id;
          console.log("Login successful for user:", user.ID || user.id);
          res.status(200).json({ message: "Login successful!" });
      } catch (compareErr) {
          console.error("Error comparing password:", compareErr);
          res.status(500).send("Internal server error.");
      }
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

  const sqlCheck = "SELECT score FROM users WHERE id = ?";
  con.query(sqlCheck, [req.session.userId], (err, results) => {
      if (err) {
          console.error("Database error while fetching current score:", err);
          return res.status(500).send('Database error');
      }

      const currentScore = results[0]?.score ?? 0;

      if (score > currentScore) {
          const sqlUpdate = "UPDATE users SET score = ? WHERE id = ?";
          con.query(sqlUpdate, [score, req.session.userId], (err) => {
              if (err) {
                  console.error("Database error while saving score:", err);
                  return res.status(500).send('Database error');
              }

              console.log(`New high score ${score} saved for user ${req.session.userId}`);
              res.status(200).send('Score saved successfully');
          });
      } else {
          console.log(`Score ${score} not saved because it's not higher than the current score (${currentScore})`);
          res.status(200).send('Score not updated as it is not higher than the current score');
      }
  });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(webpagesPath, '404Page.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
