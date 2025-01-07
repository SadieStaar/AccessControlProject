const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const PORT = String(process.env.PORT);
const HOST = String(process.env.HOST);
const MYSQLHOST = String(process.env.MYSQLHOST);
const MYSQLUSER = String(process.env.MYSQLUSER);
const MYSQLPASS = String(process.env.MYSQLPASS);

const SQL = "SELECT * FROM users;";
const loginSQL = "SELECT password FROM users WHERE username = ?;";
const registerSQL = "INSERT INTO users (username, password, email, salt) VALUES (?, ?, ?, ?)";

const app = express();
app.use(express.json());

//create SQL connection
let connection = mysql.createConnection({
  host: MYSQLHOST,
  user: MYSQLUSER,
  password: MYSQLPASS,
  database: "users",
});

//startup; gets static files
app.use("/", express.static("frontend"));

//login 
app.post("/login", function (req, resp) {
  const { inputusername, inputpassword } = req.body;
  console.log(`Username: ${inputusername}, Password: [hidden]`);

  //Query SQL database for the hashed password
  connection.query(loginSQL, [inputusername], (error, results) => {
    if (error) {
      console.error("Database error:", error.message);
      return resp.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      const storedHash = results[0].password;

      //compare the provided password with the stored hash
      bcrypt.compare(inputpassword, storedHash, (err, match) => {
        if (err || !match) {
          console.log("Login failed: Incorrect password.");
          return resp.status(401).json({ success: false, message: "Incorrect username or password" });
        }
        console.log("Login successful.");
        return resp.status(200).json({ success: true, message: "Login successful" });
      });
    } else {
      console.log("Login failed: Username not found.");
      return resp.status(401).json({ success: false, message: "Incorrect username or password" });
    }
  });
});

//register 
app.post("/register", (req, resp) => {
  const { username, password, email } = req.body;
  const saltRounds = 10;

  console.log(`Registering user: ${username}, Email: ${email}`);

  //generate salt and hash password
  bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) {
      console.error("Error generating salt:", err);
      return resp.status(500).json({ success: false, message: "Server error" });
    }

    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);
        return resp.status(500).json({ success: false, message: "Server error" });
      }

      // Insert user into database
      connection.query(registerSQL, [username, hash, email, salt], (error, results) => {
        if (error) {
          console.error("Database error:", error.message);
          return resp.status(500).json({ success: false, message: "Database error" });
        }

        console.log(`User registered successfully: ${username}`);
        return resp.status(201).json({ success: true, message: "User registered successfully" });
      });
    });
  });
});

// query 
app.get("/query", function (request, response) {
  connection.query(SQL, (error, results) => {
    if (error) {
      console.error("Database error:", error.message);
      response.status(500).send("Database error");
    } else {
      console.log(results);
      response.status(200).send(results);
    }
  });
});

app.listen(PORT, HOST);

console.log(`Running on http://${HOST}:${PORT}`);
