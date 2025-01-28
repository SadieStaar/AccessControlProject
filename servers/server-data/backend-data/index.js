// requirements
const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken"); 
require("dotenv").config(); 

// Use dynamic import for node-fetch
let fetch;
(async () => {
    fetch = (await import('node-fetch')).default;
})();

const PORT = String(process.env.PORT || 8001);
const HOST = String(process.env.HOST || "localhost");
const MYSQLHOST = String(process.env.MYSQLHOST || "localhost");
const MYSQLUSER = String(process.env.MYSQLUSER || "root");
const MYSQLPASS = String(process.env.MYSQLPASS || "");
const JWTSECRET = String(process.env.JWTSECRET || "your_secret_key");


const SQL_QUACK = "SELECT * FROM quack;";//original SQL query for the "quack" table


const SQL_FLIGHT_LOGS = "SELECT * FROM flight_logs;";//New SQL queries for the new tables
const SQL_QUACK_STATS = "SELECT * FROM quack_stats;";

const app = express();
app.use(express.json());

// create sql connection
let connection = mysql.createConnection({
  host: MYSQLHOST,
  user: MYSQLUSER,
  password: MYSQLPASS,
  database: "quack",
});

// startup; gets static files
app.use("/", express.static("frontend-data"));


async function validateToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No token provided");
  }
  const token = authHeader.split(" ")[1];

  
  const validationResponse = await fetch("http://user-management-api:5002/validateToken", {  //validate token with User Management API
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!validationResponse.ok) {
    const error = await validationResponse.text();
    throw new Error(error);
  }

  const validationData = await validationResponse.json();
  console.log("Token validated successfully:", validationData);

  // expect validationData.user to have { username, email, role, iat, exp, ... }
  return validationData.user;
}


// accessible by any role
app.get("/query", async function (req, res) {
  try {
    const user = await validateToken(req.headers.authorization);

    
    if (!["member", "premium", "admin"].includes(user.role)) {// Check role, if you want it open, jsut verify user exist
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }

    
    connection.query(SQL_QUACK, (error, results) => {      // If the user has a valid role, execute the SQL query
      if (error) {
        console.error("Database error:", error.message);
        return res.status(500).json({ message: "Database error" });
      }
      res.status(200).json(results); //return results
    });
  } catch (err) {
    console.error("Error validating token:", err.message);
    return res.status(401).json({ message: `Unauthorized: ${err.message}` });
  }
});


 
app.get("/queryFlightLogs", async function (req, res) {// New route for "flight_logs" table.Accessible only by premium or admin
  try {
    const user = await validateToken(req.headers.authorization);

    
    if (!["premium", "admin"].includes(user.role)) {// Only premium or admin
      return res.status(403).json({ message: "Forbidden: Premium or Admin only" });
    }

    connection.query(SQL_FLIGHT_LOGS, (error, results) => {
      if (error) {
        console.error("Database error:", error.message);
        return res.status(500).json({ message: "Database error" });
      }
      res.status(200).json(results);
    });
  } catch (err) {
    console.error("Error validating token:", err.message);
    return res.status(401).json({ message: `Unauthorized: ${err.message}` });
  }
});


 
app.get("/queryQuackStats", async function (req, res) {// New route for "quack_stats" table. Accessible only by admin
  try {
    const user = await validateToken(req.headers.authorization);

    // Only admins
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    connection.query(SQL_QUACK_STATS, (error, results) => {
      if (error) {
        console.error("Database error:", error.message);
        return res.status(500).json({ message: "Database error" });
      }
      res.status(200).json(results);
    });
  } catch (err) {
    console.error("Error validating token:", err.message);
    return res.status(401).json({ message: `Unauthorized: ${err.message}` });
  }
});


app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});
