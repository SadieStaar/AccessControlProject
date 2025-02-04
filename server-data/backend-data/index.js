// REQUIRED PACKAGES
const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken"); 
const dotenv = require("dotenv");

// ENV VARIABLES
dotenv.config();
const HOST = String(process.env.HOST || "localhost");
const PORT = String(process.env.PORT || 8001);
const MYSQLHOST = String(process.env.MYSQLHOST || "localhost");
const MYSQLUSER = String(process.env.MYSQLUSER || "root");
const MYSQLPASS = String(process.env.MYSQLPASS || "");
const JWTSECRET = String(process.env.JWTSECRET || "your_secret_key");

// NETWORK STARTUP
const app = express();
app.use(express.json());
app.use("/", express.static("frontend-data"));

// SQL CONNECTION
let connection = mysql.createConnection({
  host: MYSQLHOST,
  user: MYSQLUSER,
  password: MYSQLPASS,
  database: "quack",
});

// SQL CONSTANTS
const SQL_QUACK = "SELECT * FROM quack;";
const SQL_FLIGHT_LOGS = "SELECT * FROM flight_logs;";
const SQL_QUACK_STATS = "SELECT * FROM quack_stats;";

// ASYNC SETUP
let fetch;
(async () => {
    fetch = (await import('node-fetch')).default;
})();

// QUACK TABLE QUERY - for all valid users
app.get("/queryQuackTable", async function (req, res) {
    try {
        let user = await validateToken(req.headers.authorization);
        
        // Log failed attempt
        if (!["member", "premium", "admin"].includes(user.role)) {
            await logAccess(user.username, "quack_table", false);
            return res.status(403).json({ message: "Forbidden: Insufficient role" });
        }
        
        // Get info from SQL
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

// FLIGHT LOGS QUERY - for premium and admins
app.get("/queryFlightLogs", async function (req, res) {
  try {
    let user = await validateToken(req.headers.authorization);
    
    // Log failed attempt
    if (!["premium", "admin"].includes(user.role)) {// Only premium or admin
      await logAccess(user.username, "flight_logs", false);
      return res.status(403).json({ message: "Forbidden: Premium or Admin only" });
    }

    // Get info from SQL
    connection.query(SQL_FLIGHT_LOGS, async (error, results) => {
      if (error) {
        await logAccess(user.username, "flight_logs", false);
        console.error("Database error:", error.message);
        return res.status(500).json({ message: "Database error" });
      }

      // Log successful access
      await logAccess(user.username, "flight_logs", true);
      res.status(200).json(results);
    });
  } catch (err) {
    console.error("Error validating token:", err.message);
    return res.status(401).json({ message: `Unauthorized: ${err.message}` });
  }
});

// QUACK STATS QUERY - for admins only
app.get("/queryQuackStats", async function (req, res) {// New route for "quack_stats" table. Accessible only by admin
  try {
    let user = await validateToken(req.headers.authorization);

    // Log failed attempt
    if (user.role !== "admin") {
      await logAccess(user.username, "quack_stats", false);
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    // Get info from SQL
    connection.query(SQL_QUACK_STATS, async (error, results) => {
      if (error) {
        await logAccess(user.username, "quack_stats", false);
        console.error("Database error:", error.message);
        return res.status(500).json({ message: "Database error" });
      }

      // Log successful access
      await logAccess(user.username, "quack_stats", true);
      res.status(200).json(results);
    });
  } catch (err) {
    console.error("Error validating token:", err.message);
    return res.status(401).json({ message: `Unauthorized: ${err.message}` });
  }
});

// LOGS QUERY - for admins only
app.get("/logs", async function (req, res) {
    try {
        let user = await validateToken(req.headers.authorization);
        
        // Log failed attempt
        if (user.role !== 'admin') {
            await logAccess(user.username, "logs", false);
            return res.status(403).json({ message: "Forbidden: Admin access required" });
        }

        // Forward request to user-management-api
        let response = await fetch("http://user-management-api:5002/logs", {
            headers: {
                Authorization: req.headers.authorization
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error status: ${response.status}`);
        }

        let logs = await response.json();
        await logAccess(user.username, "logs", true);
        res.status(200).json(logs);

    } catch (err) {
        console.error("Error:", err);
        res.status(401).json({ message: "Unauthorized" });
    }
});

// LOG ACCESSED MATERIAL
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

// TOKEN VALIDATION
async function validateToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No token provided");
  }
  let token = authHeader.split(" ")[1];

  
  const validationResponse = await fetch("http://user-management-api:5002/validateToken", {  //validate token with User Management API
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!validationResponse.ok) {
    let error = await validationResponse.text();
    throw new Error(error);
  }

  let validationData = await validationResponse.json();
  console.log("Token validated successfully:", validationData);

  // expect validationData.user to have { username, email, role, iat, exp, ... }
  return validationData.user;
}

// LISTEN ON PORT
app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});
