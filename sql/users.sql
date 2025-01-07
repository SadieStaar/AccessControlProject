CREATE DATABASE users;

use users;

CREATE TABLE users (
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email    VARCHAR(255) NOT NULL,
    salt     VARCHAR(255) NOT NULL,
    totp_secret VARCHAR(255), --totp column
    PRIMARY KEY (username)
);

-- Generates hex value for the salt



INSERT INTO users
VALUES(
    "user",
    "pass",
    "user@example.com"
    "A356" -- placeholder hard coded Salt
);
