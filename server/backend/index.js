const express = require("express");
const mysql = require("mysql2");

const PORT = String(process.env.PORT);
const HOST = String(process.env.HOST);
const MYSQLHOST = String(process.env.MYSQLHOST);
const MYSQLUSER = String(process.env.MYSQLUSER);
const MYSQLPASS = String(process.env.MYSQLPASS);
const SQL = "SELECT * FROM users;";
const loginSQL = "SELECT * FROM users WHERE `username` = ? AND `password` = ?;";

const app = express();
app.use(express.json());

// Create SQL connection and get params
let connection = mysql.createConnection({
  host: MYSQLHOST,
  user: MYSQLUSER,
  password: MYSQLPASS,
  database: "users",
});

// Startup; gets static files
app.use("/", express.static("frontend"));

// Login code; checks and salts username, returns true if match
app.post("/login", function (req, resp) {
  const { inputusername, inputpassword } = req.body;
  console.log(`Username: ${inputusername}, Password: ${inputpassword}`);

  // Query SQL database and see if username/password is in there
  connection.query(loginSQL, [inputusername, inputpassword], (error, results) => {
    if (error) {
      console.error("Database error:", error.message);
      return resp.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      console.log("Login successful.");
      return resp.status(200).json({ success: true, message: "Login successful" });
    } else {
      console.log("Login failed: Incorrect username or password.");
      return resp.status(401).json({ success: false, message: "Incorrect username or password" });
    }
  });
});

// This is the original query function
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
