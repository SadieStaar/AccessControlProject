const express = require("express");
const mysql = require("mysql2");


const PORT = String(process.env.PORT);
const HOST = String(process.env.HOST);
const MYSQLHOST = String(process.env.MYSQLHOST);
const MYSQLUSER = String(process.env.MYSQLUSER);
const MYSQLPASS = String(process.env.MYSQLPASS);
const SQL = "SELECT * FROM users;"
const loginSQL = "SELECT * FROM users WHERE `username` = ? AND `password` = ?;"

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

  // adding salt to password !!! NEED HASH FUNCT !!!

  // query sql database and see if username/password is in there
  connection.query(loginSQL, [inputusername, inputpassword], (error, results, fields) =>{
    // error if something goes wrong in database
    if (error) {
      console.error(error.message);
      return resp.status(500).send("database error");
    }
    // return success if login data is found
    else if (results.length > 0) {
        console.log("Information found; login successful");
        return resp.status(200).json({success: true, message: "Login successful" });
    }
    // return failure if user is not found in database
    else{
      console.log("Information not found");
      return resp.status(404).json({ success: false, message: "User not found" });
    }
  
  })
})

// this is the original query function
app.get("/query", function (request, response) {
  connection.query(SQL, (error, results) => {
    if (error) {
      console.error(error.message);
      response.status(500).send("database error");
    } else {
      console.log(results);
      response.status(200).send(results);
    }
  });
})


app.listen(PORT, HOST)

console.log(`Running on http://${HOST}:${PORT}`);
