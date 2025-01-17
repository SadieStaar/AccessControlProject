// requirements
const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken"); // Import JWT library
require("dotenv").config(); // Load environment variables

// global variables
const PORT = String(process.env.PORT || 8001);
const HOST = String(process.env.HOST || "localhost");
const MYSQLHOST = String(process.env.MYSQLHOST || "localhost");
const MYSQLUSER = String(process.env.MYSQLUSER || "root");
const MYSQLPASS = String(process.env.MYSQLPASS || "");
const JWTSECRET = String(process.env.JWTSECRET || "your_secret_key");

// SQL query to execute
const SQL = "SELECT * FROM quack;";

const app = express();
app.use(express.json());

// create sql connection and get params
let connection = mysql.createConnection({
  host: MYSQLHOST,
  user: MYSQLUSER,
  password: MYSQLPASS,
  database: "quack",
});

// startup; gets static files
app.use("/", express.static("frontend-data"));

// Query with JWT validation
app.get("/query", function (request, response) {
  const authHeader = request.headers.authorization;

  // Check if the Authorization header exists and contains a token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token from the header

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWTSECRET);
    console.log("Token is valid. User:", decoded); // Log decoded token info for debugging

    // If token is valid, execute the SQL query
    connection.query(SQL, (error, results) => {
      if (error) {
        console.error("Database error:", error.message);
        return response.status(500).json({ message: "Database error" });
      }
      response.status(200).json(results); // Return query results
    });
  } catch (err) {
    console.error("Invalid or expired token:", err.message);
    response.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
});

// Listen for requests
app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});
