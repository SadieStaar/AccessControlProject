const express = require("express");
const mysql = require("mysql2");
const bcrypt = require('bcrypt');
const speakeasy = require("speakeasy");


const PORT = String(process.env.PORT);
const HOST = String(process.env.HOST);
const MYSQLHOST = String(process.env.MYSQLHOST);
const MYSQLUSER = String(process.env.MYSQLUSER);
const MYSQLPASS = String(process.env.MYSQLPASS);

//sql functions for later
const SQL = "SELECT * FROM users;";
const loginSQL = "SELECT * FROM users WHERE `username` = ?;"
const registerSQL = "INSERT INTO users (username, password, email, salt, totp_secret) VALUES (?, ?, ?, ?, ?)";


const app = express();
app.use(express.json());

// create sql connection and get params
let connection = mysql.createConnection({
  host: MYSQLHOST,
  user: MYSQLUSER,
  password: MYSQLPASS,
  database: "users"
});

// startup; gets static files 
app.use("/", express.static("frontend"));


// login code; checks and salts username, returns true if match
app.post("/login", function (req, resp) {
  // create variables for user inputted things
  const {inputusername, inputpassword} = req.body;
  console.log(inputusername, inputpassword)

  // query sql database and see if username/password is in there
  connection.query(loginSQL, [inputusername], (error, results) =>{
    // error if something goes wrong in database
    if (error) {
      console.error(error.message);
      return resp.status(500).send("database error");
    }

    // return success if login data is found
    if (results.length > 0) {

      // compare hashed password
      bcrypt.compare(inputpassword, results[0].password)
      .then(isMatch => {

        // if match, success, log user in
        if (isMatch) {
          console.log(`User ${inputusername} logged in`);
          return resp.status(200).json({success: true, message: "Login successful" });
        }

        // if not match, notify user
        else {
          console.log(`Password does not match`);
          return resp.status(401).json({success: false, message: "Invalid password"});
        }
      })

      // error during encryption phase
      .catch(err => {
        console.error('Error during comparison:', err);
      });
    }
    // return failure if user is not found in database
    else{
      console.log("Information not found");
      return resp.status(404).json({ success: false, message: "User not found" });
    }
  })
})


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
      console.error(error.message);
      response.status(500).send("database error");
    } else {
      console.log(results);
      response.status(200).send(results);
    }
  });
});

app.listen(PORT, HOST);

console.log(`Running on http://${HOST}:${PORT}`);
