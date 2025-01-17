// requirements
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
var jwt = require("jsonwebtoken");


// global variables
const PORT = String(process.env.PORT);
const HOST = String(process.env.HOST);
const MYSQLHOST = String(process.env.MYSQLHOST);
const MYSQLUSER = String(process.env.MYSQLUSER);
const MYSQLPASS = String(process.env.MYSQLPASS);
const PEPPER = String(process.env.PEPPER);
const TOTPSECRET = String(process.env.TOTPSECRET);
const JWTSECRET = String(process.env.JWTSECRET);
const SALTROUNDS = 10;

// needed sql functions
const loginSQL = "SELECT password, salt FROM users WHERE `username` = ?;"
const REGISTERSQL = 'INSERT INTO users (username, password, email, salt) VALUES (?, ?, ?, ?)'

// get express and cors working
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost");  // Allow any origin (or specify a specific origin like http://localhost)
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");  // If you're using cookies or auth headers
  next();
});


// create sql connection and get params
let connection = mysql.createConnection({
  host: MYSQLHOST,
  user: MYSQLUSER,
  password: MYSQLPASS,
  database: "users"
});


// registration
app.post("/register", (req, resp) => {
  let { username, email, password } = req.body;

  bcrypt.genSalt(SALTROUNDS, (err, salt) => {
    if (err) {
      console.error("Error generating salt:", err);
      return resp.status(500).send("Error generating salt");
    }

    bcrypt.hash(salt + password + PEPPER, SALTROUNDS, (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);
        return resp.status(500).send("Error generating hash");
      }

      console.log(`${username}, ${email}, ${hash}, ${salt}`);

      connection.query(REGISTERSQL, [username, hash, email, salt], (error, results) => {
          if (error) {
            if (error.code === 'ER_DUP_ENTRY'){
              console.error("User already in database");
              return resp.status(409).send("User already exists");
            }
            console.error("Database error:", error.message);
            return resp.status(500).send("Database error");          
          }

          // user successfully registered
          console.log(`User registered successfully: ${username}`);
          return resp.status(201).send("Registration successful");
        });
    });
  });
});


// login
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
    console.log(results);

    if (results.length > 0) {
      // add salt/pepper and compare hashed password
      bcrypt.compare(results[0].salt + inputpassword + PEPPER, results[0].password)
      .then(isMatch => {

        // if match, success, log user in
        if (isMatch) {
          console.log(`User ${inputusername} logged in`);
          return resp.status(200).json({success: true, message: "Login successful" });
        }

        // if not match, notify user
        else {
          console.log(`Password does not match`);
          return resp.status(401);
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
      return resp.status(404);
    }
  })
})


// TOTP verification
app.post("/totp", function (req, resp) {
  // get entered totp code
  const inputTotp = req.body;
  console.log(inputTotp);

  // WIP return for testing purposes, remove when totp is done //
  //return resp.status(200).json({success: true, message: "Login successful" });

  //generate hash
  const hmac = crypto.createHmac('sha256', TOTPSECRET);
  const timestamp = Math.floor(Date.now() / 1000 / 30);
  hmac.update(Buffer.from(timestamp.toString()));
  let result = hmac.digest('hex').replace(/\D/g, '').slice(0, 6);

  // check if match
  if (inputTotp['totpInput'] === result) {
    resp.status(200).send("Code verification successful");
  } else {
    resp.status(401).send("Code comparison failed");
  }
});


app.post("/verifyJWT", function (request, response) {
  //verify the token is current and was made by this server
  return;
})

app.listen(PORT, HOST);

console.log(`Running on http://${HOST}:${PORT}`);
