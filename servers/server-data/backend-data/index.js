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

async function logAccess(username, dataAccessed, success) {
    try {
        await fetch("http://user-management-api:5002/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user: username,
                dataaccessed: dataAccessed,
                success: success ? 'true' : 'false'
            })
        });
    } catch (error) {
        console.error("Error logging access:", error);
    }
}

// accessible by any role
app.get("/query", async function (req, res) {
    try {
        const user = await validateToken(req.headers.authorization);
        
        if (!["member", "premium", "admin"].includes(user.role)) {
            // Log failed attempt
            await logAccess(user.username, "quack_table", false);
            return res.status(403).json({ message: "Forbidden: Insufficient role" });
        }
        
        connection.query(SQL_QUACK, async (error, results) => {
            if (error) {
                // Log database error
                await logAccess(user.username, "quack_table", false);
                console.error("Database error:", error.message);
                return res.status(500).json({ message: "Database error" });
            }
            // Log successful access
            await logAccess(user.username, "quack_table", true);
            res.status(200).json(results);
        });
    } catch (err) {
        console.error("Error validating token:", err.message);
        return res.status(401).json({ message: `Unauthorized: ${err.message}` });
    }
});


 
app.get("/queryFlightLogs", async function (req, res) {// New route for "flight_logs" table. Accessible only by premium or admin
  try {
    const user = await validateToken(req.headers.authorization);

    
    if (!["premium", "admin"].includes(user.role)) {// Only premium or admin
      await logAccess(user.username, "flight_logs", false);
      return res.status(403).json({ message: "Forbidden: Premium or Admin only" });
    }

    connection.query(SQL_FLIGHT_LOGS, async (error, results) => {
      if (error) {
        await logAccess(user.username, "flight_logs", false);
        console.error("Database error:", error.message);
        return res.status(500).json({ message: "Database error" });
      }
      await logAccess(user.username, "flight_logs", true);
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
      await logAccess(user.username, "quack_stats", false);
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    connection.query(SQL_QUACK_STATS, async (error, results) => {
      if (error) {
        await logAccess(user.username, "quack_stats", false);
        console.error("Database error:", error.message);
        return res.status(500).json({ message: "Database error" });
      }
      await logAccess(user.username, "quack_stats", true);
      res.status(200).json(results);
    });
  } catch (err) {
    console.error("Error validating token:", err.message);
    return res.status(401).json({ message: `Unauthorized: ${err.message}` });
  }
});

// Add new endpoint to proxy log requests
app.get("/logs", async function (req, res) {
    try {
        const user = await validateToken(req.headers.authorization);
        
        if (user.role !== 'admin') {
            await logAccess(user.username, "logs", false);
            return res.status(403).json({ message: "Forbidden: Admin access required" });
        }

        // Forward request to user-management-api
        const response = await fetch("http://user-management-api:5002/logs", {
            headers: {
                Authorization: req.headers.authorization
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const logs = await response.json();
        await logAccess(user.username, "logs", true);
        res.status(200).json(logs);

    } catch (err) {
        console.error("Error:", err);
        res.status(401).json({ message: "Unauthorized" });
    }
});

app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});
