const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");

const PORT = String(process.env.PORT);
const HOST = String(process.env.HOST);
const MYSQLHOST = String(process.env.MYSQLHOST);
const MYSQLUSER = String(process.env.MYSQLUSER);
const MYSQLPASS = String(process.env.MYSQLPASS);

const SQL = "SELECT * FROM users;";
const loginSQL = "SELECT password, totp_secret FROM users WHERE username = ?;";
const registerSQL = "INSERT INTO users (username, password, email, salt, totp_secret) VALUES (?, ?, ?, ?, ?)";

const app = express();
app.use(express.json());

// Create SQL connection
let connection = mysql.createConnection({
  host: MYSQLHOST,
  user: MYSQLUSER,
  password: MYSQLPASS,
  database: "users",
});

// Serve static files
app.use("/", express.static("frontend"));

// Login
app.post("/login", function (req, resp) {
  const { inputusername, inputpassword } = req.body;
  console.log(`Username: ${inputusername}, Password: [hidden]`);

  connection.query(loginSQL, [inputusername], (error, results) => {
    if (error) {
      console.error("Database error:", error.message);
      return resp.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      const storedHash = results[0].password;
      const totpSecret = results[0].totp_secret;

      bcrypt.compare(inputpassword, storedHash, (err, match) => {
        if (err || !match) {
          console.log("Login failed: Incorrect password.");
          return resp.status(401).json({ success: false, message: "Incorrect username or password" });
        }

        console.log("Password verified. Redirecting to TOTP...");
        return resp.status(200).json({ success: true, message: "Password verified", totp_required: true });
      });
    } else {
      console.log("Login failed: Username not found.");
      return resp.status(401).json({ success: false, message: "Incorrect username or password" });
    }
  });
});

// TOTP verification
app.post("/verify-totp", (req, resp) => {
  const { username, totp_code } = req.body;

  connection.query("SELECT totp_secret FROM users WHERE username = ?", [username], (error, results) => {
    if (error) {
      console.error("Database error:", error.message);
      return resp.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      const totpSecret = results[0].totp_secret;

      const verified = speakeasy.totp.verify({
        secret: totpSecret,
        encoding: "base32",
        token: totp_code,
        window: 1, // Allow for slight time drift
      });

      if (verified) {
        console.log("TOTP verification successful.");
        return resp.status(200).json({ success: true, message: "TOTP verified successfully" });
      } else {
        console.log("TOTP verification failed.");
        return resp.status(401).json({ success: false, message: "Invalid TOTP code" });
      }
    } else {
      console.log("User not found.");
      return resp.status(404).json({ success: false, message: "User not found" });
    }
  });
});

// Registration
app.post("/register", (req, resp) => {
  const { username, password, email } = req.body;
  const saltRounds = 10;

  console.log(`Registering user: ${username}, Email: ${email}`);

  const totpSecret = speakeasy.generateSecret({ length: 20 });

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

      connection.query(
        registerSQL,
        [username, hash, email, salt, totpSecret.base32],
        (error, results) => {
          if (error) {
            console.error("Database error:", error.message);
            return resp.status(500).json({ success: false, message: "Database error" });
          }

          console.log(`User registered successfully: ${username}`);
          resp.status(201).json({
            success: true,
            message: "User registered successfully",
            totp_secret: totpSecret.otpauth_url, //use this for QR code generation
          });
        }
      );
    });
  });
});

// Query
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
