// requirements
const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken"); // Import JWT library
const fetch = require("node-fetch"); // Import fetch for HTTP requests
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

// Query with external token validation
app.get("/query", async function (request, response) {
  const authHeader = request.headers.authorization;

  // Check if the Authorization header exists and contains a token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token from the header

  try {
    // Validate the token with the User Management API
    const validationResponse = await fetch("http://localhost:5002/validateToken", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Handle validation response
    if (!validationResponse.ok) {
      const error = await validationResponse.text();
      return response.status(401).json({ message: `Unauthorized: ${error}` });
    }

    const validationData = await validationResponse.json();
    console.log("Token validated successfully:", validationData); // Debugging

    // If token is valid, execute the SQL query
    connection.query(SQL, (error, results) => {
      if (error) {
        console.error("Database error:", error.message);
        return response.status(500).json({ message: "Database error" });
      }
      response.status(200).json(results); // Return query results
    });
  } catch (err) {
    console.error("Error validating token:", err.message);
    response.status(500).json({ message: "Error validating token" });
  }
});

// Listen for requests
app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});
