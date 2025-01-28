const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cors = require("cors");

//load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
    origin: "http://localhost",
    methods: ["GET", "POST"],
    credentials: true
}));
  
app.use(express.json());

//ENV variables
const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 5002;
const MYSQLHOST = process.env.MYSQLHOST || "localhost";
const MYSQLUSER = process.env.MYSQLUSER || "root";
const MYSQLPASS = process.env.MYSQLPASS || "rootpassword";
const PEPPER = process.env.PEPPER || "802A";
const TOTPSECRET = process.env.TOTPSECRET || "secretysecret";
const JWTSECRET = process.env.JWTSECRET || "your-secret-key";
const SALTROUNDS = 10;

//SQL connection
const connection = mysql.createConnection({
    host: MYSQLHOST,
    user: MYSQLUSER,
    password: MYSQLPASS,
    database: "users", 
});

// SQL statements
// update, now SELECT role as well from the DB
const REGISTERSQL = "INSERT INTO users (username, password, email, salt, role) VALUES (?, ?, ?, ?, ?)";
const LOGINSQL = "SELECT password, salt, email, role FROM users WHERE username = ?"; 

//Use dynamic import bc node-fetch
let fetch;
(async () => {
    fetch = (await import('node-fetch')).default;
})();

//  Registration //
app.post("/register", (req, res) => {
    const { username, email, password, role = "member" } = req.body;

    //generate new salt and hash with pepper
    bcrypt.genSalt(SALTROUNDS, (err, salt) => {
        if (err) {
            console.error("Error generating salt:", err);
            return res.status(500).send("Error generating salt");
        }

        //salt + password + PEPPER, then hash
        bcrypt.hash(salt + password + PEPPER, SALTROUNDS, (err, hash) => {
            if (err) {
                console.error("Error hashing password:", err);
                return res.status(500).send("Error generating hash");
            }

            //store user
            connection.query(REGISTERSQL, [username, hash, email, salt, role], (error, results) => {
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

//  Login //
app.post("/login", (req, res) => {
    const { inputusername, inputpassword } = req.body;
    console.log(`Login attempt for user: ${inputusername}`);

    connection.query(LOGINSQL, [inputusername], (error, results) => {
        if (error) {
            console.error("Database error:", error.message);
            return res.status(500).send("Database error");
        }
        if (results.length === 0) {
            console.log("User not found in database");
            return res.status(404).send("User not found");
        }

        //extract hashed password, salt, and email
        const dbHash  = results[0].password;
        const dbSalt  = results[0].salt;
        const dbEmail = results[0].email;
        // (2) NEW: fetch role from DB result
        const dbRole  = results[0].role;  // <-- ADDED LINE

        //compare the combination of salt + user input + pepper to the stored hash
        bcrypt.compare(dbSalt + inputpassword + PEPPER, dbHash)
            .then((isMatch) => {
                if (isMatch) {
                    // password correct: generate JWT
                    const token = jwt.sign(
                        { email: dbEmail, username: inputusername, role: dbRole },
                        JWTSECRET,
                        { expiresIn: "1h" }
                    );
                    console.log(`User ${inputusername} logged in, returning token: ${token}`);

                    //return token in JSON, so frontend can store it as a cookie
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

// TOTP Verification //
app.post("/totp", (req, res) => {
    const { totpInput } = req.body;
    console.log("TOTP received:", totpInput);
    //generate current 6-digit TOTP using HMAC
    const hmac = crypto.createHmac("sha256", TOTPSECRET);
    const timestamp = Math.floor(Date.now() / 1000 / 30);
    hmac.update(Buffer.from(timestamp.toString()));
    const result = hmac.digest("hex").replace(/\D/g, "").slice(0, 6);

    if (totpInput === result) {
        console.log("TOTP verification successful");
        return res.status(200).send("Code verification successful");
    } else {
        console.log("TOTP failed");
        return res.status(401).send("Code comparison failed");
    }
});

// Validate Token //
app.post("/validateToken", (req, res) => {
    // extract token from auth header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).send("Unauthorized: No token provided");
    }

    try {
        //verify token with JWTSECRET
        const decoded = jwt.verify(token, JWTSECRET);
        console.log("Token validated successfully:", decoded);
        // If valid, return 200 with user info
        return res.status(200).json({ valid: true, user: decoded });
    } catch (err) {
        console.error("Invalid or expired token:", err.message);
        return res.status(401).send("Unauthorized: Invalid or expired token");
    }
});

app.get("/protectedResource", async (req, res) => {
    try {
        const user = await validateToken(req.headers.authorization);
        //Proceed with access
        res.status(200).json({ message: "Access granted", user });
    } catch (err) {
        res.status(401).json({ message: `Unauthorized: ${err.message}` });
    }
});

app.listen(PORT, HOST, () => {
    console.log(`User Management API running on http://${HOST}:${PORT}`);
});

async function validateToken(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("No token provided");
    }
    const token = authHeader.split(" ")[1];

    const validationResponse = await fetch("http://user-management-api:5002/validateToken", {
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
