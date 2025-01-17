const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5002;
const JWTSECRET = process.env.JWTSECRET || "your-secret-key";
const SALTROUNDS = 10;

// MySQL connection
const connection = mysql.createConnection({
    host: process.env.MYSQLHOST || "localhost",
    user: process.env.MYSQLUSER || "root",
    password: process.env.MYSQLPASS || "rootpassword",
    database: "users",
});

app.post("/login", (req, res) => {
    const { username, password, totp } = req.body;

    // Validate username and password
    connection.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
        if (err) return res.status(500).send("Database error");
        if (results.length === 0) return res.status(404).send("User not found");

        const user = results[0];

        bcrypt.compare(password, user.password, (err, match) => {
            if (err) return res.status(500).send("Error comparing passwords");
            if (!match) return res.status(401).send("Invalid credentials");

            // Validate TOTP (replace with your TOTP logic)
            const expectedTotp = "123456"; // Replace with actual TOTP generation/verification logic
            if (totp !== expectedTotp) return res.status(401).send("Invalid TOTP code");

            // Generate JWT
            const token = jwt.sign(
                { email: user.email, username: user.username },
                JWTSECRET,
                { expiresIn: "1h" }
            );

            res.status(200).json({ token });
        });
    });
});


// TOTP verification route
app.post("/totp", (req, res) => {
    const { totp } = req.body;

    // Example logic for TOTP verification (replace with your implementation)
    const expectedTotp = "123456"; // Replace with actual TOTP generation logic

    if (totp === expectedTotp) {
        res.status(200).send("TOTP verified successfully");
    } else {
        res.status(401).send("Invalid TOTP code");
    }
});

app.listen(PORT, () => console.log(`User Management API running on port ${PORT}`));

// Validate Token Route
app.post("/validateToken", (req, res) => {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1];

    // Check if the token is provided
    if (!token) {
        return res.status(401).send("Unauthorized: No token provided");
    }

    try {
        // Verify the token using JWTSECRET
        const decoded = jwt.verify(token, JWTSECRET);

        // If valid, return the decoded token data
        res.status(200).json({ valid: true, user: decoded });
    } catch (err) {
        // Handle invalid or expired tokens
        res.status(401).send("Unauthorized: Invalid or expired token");
    }
});
