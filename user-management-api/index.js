// REQUIRED PACKAGES
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cors = require("cors");
const { v4: uuidv4 } = require('uuid');

// ENV VARIABLES
dotenv.config();
const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 5002;
const MYSQLHOST = process.env.MYSQLHOST || "localhost";
const MYSQLUSER = process.env.MYSQLUSER || "root";
const MYSQLPASS = process.env.MYSQLPASS || "rootpassword";
const PEPPER = process.env.PEPPER || "802A";
const TOTPSECRET = process.env.TOTPSECRET || "secretysecret";
const JWTSECRET = process.env.JWTSECRET || "your-secret-key";

// OTHER CONSTANTS
const SALTROUNDS = 10;
const USERPASSREGEX = /["';:(){}|\/\\]/;
const EMAILREGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// NETWORK SETUP
const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost",
    methods: ["GET", "POST"],
    credentials: true
}));

// SQL CONNECTION
const connection = mysql.createConnection({
    host: MYSQLHOST,
    user: MYSQLUSER,
    password: MYSQLPASS,
    database: "users", 
});

// SQL CONSTANTS
const REGISTERSQL = "INSERT INTO users (username, password, email, salt, role, totp_secret) VALUES (?, ?, ?, ?, ?, ?)";
const LOGINSQL = "SELECT password, salt, email, role FROM users WHERE username = ?"; 
const INSERTLOG = "INSERT INTO logs (id, user, timeaccessed, dataaccessed, success) VALUES (?, ?, ?, ?, ?)";
const TOTPSQL = "SELECT totp_secret FROM users WHERE username = ?";

// ASYNC SETUP
let fetch;
(async () => {
    fetch = (await import('node-fetch')).default;
})();

// REGISTRATION 
app.post("/register", (req, res) => {
    let { username, email, password, role = "member" } = req.body;

    //check for valid credentials: 400 bad request
    if ((USERPASSREGEX.test(username)) || username.length < 8) {
        console.log("Error: Bad username");
        return res.status(400).send("Invalid username");
    };
    if ((USERPASSREGEX.test(password)) || password.length < 8) {
        console.log("Error: Bad password");
        return res.status(400).send("Invalid password");
    };
    if (!(EMAILREGEX.test(email))) {
        console.log("Error: Bad email");
        return res.status(400).send("Invalid email");
    };

    // generate password hash
    bcrypt.genSalt(SALTROUNDS, (err, salt) => {
        if (err) {
            console.error("Error generating salt:", err);
            return res.status(500).send("Error generating salt");
        }

        bcrypt.hash(salt + password + PEPPER, SALTROUNDS, (err, hash) => {
            if (err) {
                console.error("Error hashing password:", err);
                return res.status(500).send("Error generating hash");
            }

            // generate user totp secret
            let totpsecret = crypto.randomUUID();
            console.log(`User TOTP secret: ${totpsecret}`);

            // store user information
            connection.query(REGISTERSQL, [username, hash, email, salt, role, totpsecret], (error, results) => {
                if (error) {
                    if (error.code === "ER_DUP_ENTRY") {
                        console.error("User already in database");
                        return res.status(409).send("User already exists");
                    }
                    console.error("Database error:", error.message);
                    return res.status(500).send("Database error");
                }

                console.log(`User registered successfully: ${username}`);
                return res.status(201).send("Registration successful");
            });
        });
    });
});

// LOGIN 
app.post("/login", (req, res) => {
    const { inputusername, inputpassword } = req.body;
    console.log(`Login attempt for user: \"${inputusername}\"`);

    // check if valid characters
    if (USERPASSREGEX.test(inputusername) || USERPASSREGEX.test(inputpassword)){
        console.error("Invalid characters in username or password");
        return res.status(400).send("Invalid characters");
    };

    // check if username in database
    connection.query(LOGINSQL, [inputusername], (error, results) => {
        if (error) {
            console.error("Database error:", error.message);
            return res.status(500).send("Database error");
        }
        if (results.length === 0) {
            console.log("User not found in database");
            return res.status(404).send("User not found");
        }

        let dbHash  = results[0].password;
        let dbSalt  = results[0].salt;
        let dbEmail = results[0].email;
        let dbRole  = results[0].role;

        //compare the combination of salt + user input + pepper to the stored hash
        bcrypt.compare(dbSalt + inputpassword + PEPPER, dbHash)
            .then((isMatch) => {
                if (isMatch) {
                    // generate cookie on success
                    let token = jwt.sign(
                        { email: dbEmail, username: inputusername, role: dbRole },
                        JWTSECRET,
                        { expiresIn: "1h" }
                    );
                    console.log(`User ${inputusername} logged in, returning token: ${token}`);

                    //return cookie to frontend
                    return res.status(200).json({ token });
                } else {
                    console.log("Password incorrect");
                    return res.status(401).send("Password incorrect");
                }
            })
            .catch((err) => {
                console.error("Error during bcrypt comparison:", err);
                return res.status(500).send("Internal error during login");
            });
    });
});

// TIME-BASED ONE-TIME PASSWORD 
app.post("/totp", (req, res) => {
    let { totpInput, inputusername } = req.body;
    console.log(`User ${inputusername} TOTP received: ${totpInput}`);

    //get user TOTP secret
    connection.query(TOTPSQL, [inputusername], (error, results) => {
        if (error) {
            console.error("Database error:", error.message);
            return res.status(500).send("Database error");
        }
        if(results.length === 0){
            console.log("User not found in database");
            return res.status(404).send("User not found");
        }
        //grab the user's totp secret
        let totpsecret = results[0].totp_secret;
        console.log(totpsecret);

        //generate current 6-digit TOTP using HMAC
        let hmac = crypto.createHmac("sha256", totpsecret);
        let timestamp = Math.floor(Date.now() / 1000 / 60);
        hmac.update(Buffer.from(timestamp.toString()));
        let result = hmac.digest("hex").replace(/\D/g, "").slice(0, 6);

        if (totpInput === result) {
            console.log("TOTP verification successful");
            return res.status(200).send("Code verification successful");
        } else {
            console.log("TOTP failed");
            return res.status(401).send("Code comparison failed");
    }
    });

    
});

// TOKEN VALIDATION 
app.post("/validateToken", (req, res) => {
    // extract token from auth header
    let token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).send("Unauthorized: No token provided");
    }

    try {
        //verify token with JWTSECRET
        let decoded = jwt.verify(token, JWTSECRET);
        console.log("Token validated successfully:", decoded);
        // If valid, return 200 with user info
        return res.status(200).json({ valid: true, user: decoded });
    } catch (err) {
        console.error("Invalid or expired token:", err.message);
        return res.status(401).send("Unauthorized: Invalid or expired token");
    }
});

// VALIDATION
app.get("/protectedResource", async (req, res) => {
    try {
        let user = await validateToken(req.headers.authorization);
        //Proceed with access
        res.status(200).json({ message: "Access granted", user });
    } catch (err) {
        res.status(401).json({ message: `Unauthorized: ${err.message}` });
    }
});

// ACCESS LOGGING 
app.post("/log", async (req, res) => {
    let { user, dataaccessed, success } = req.body;
    let id = uuidv4();
    let timeaccessed = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    connection.query(INSERTLOG, [id, user, timeaccessed, dataaccessed, success], (error, results) => {
        if (error) {
            console.error("Error logging activity:", error);
            return res.status(500).json({ message: "Failed to log activity" });
        }
        res.status(201).json({ message: "Activity logged successfully" });
    });
});

// LOGS 
app.get("/logs", async (req, res) => {
    try {
        let user = await validateToken(req.headers.authorization);
        
        if (user.role !== 'admin') {
            // Log the failed attempt
            let logData = {
                user: user.username,
                dataaccessed: 'logs',
                success: 'false'
            };
            
            await fetch("http://user-management-api:5002/log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(logData)
            });
            
            return res.status(403).json({ message: "Forbidden: Admin access required" });
        }

        // Log the successful access attempt
        let logData = {
            user: user.username,
            dataaccessed: 'logs',
            success: 'true'
        };
        
        await fetch("http://user-management-api:5002/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(logData)
        });

        // Fetch logs
        connection.query("SELECT * FROM logs ORDER BY timeaccessed DESC", (error, results) => {
            if (error) {
                console.error("Database error:", error);
                return res.status(500).json({ message: "Database error" });
            }
            res.status(200).json(results);
        });
    } catch (err) {
        console.error("Error:", err);
        res.status(401).json({ message: "Unauthorized" });
    }
});

// TOKEN VALIDATION 
async function validateToken(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("No token provided");
    }
    let token = authHeader.split(" ")[1];

    let validationResponse = await fetch("http://user-management-api:5002/validateToken", {
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
    console.log(`User Management API running on http://${HOST}:${PORT}`);
});