// requirements
const express = require("express");
const mysql = require("mysql2");

// global variables
const PORT = String(process.env.PORT);
const HOST = String(process.env.HOST);
const MYSQLHOST = String(process.env.MYSQLHOST);
const MYSQLUSER = String(process.env.MYSQLUSER);
const MYSQLPASS = String(process.env.MYSQLPASS);

//sql functions for later
const SQL = "SELECT * FROM secretdata;";


const app = express();
app.use(express.json());

// create sql connection and get params
let connection = mysql.createConnection({
  host: MYSQLHOST,
  user: MYSQLUSER,
  password: MYSQLPASS,
  database: "secretdata"
});

// startup; gets static files 
app.use("/", express.static("frontend"));


// Query 
app.get("/query", function (request, response) {
  // get token from header
  // send token to user server for verification
  // if success:
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
    // else, send 401 w/ message: token invalid/expired
  });
});

// listen for requests
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);