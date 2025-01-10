CREATE DATABASE users;

use users;

CREATE TABLE users (
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email    VARCHAR(255) NOT NULL,
    totp_secret VARCHAR(255) NOT NULL,
    PRIMARY KEY (username)
);

-- Generates hex value for the salt

INSERT INTO users
VALUES(
    "user",
    "$2b$12$Ug39jSWbgweSFj9IuEnWW.c1/y35Y3eJ/jjR1489CT78XFq7W.Ha6",
    "user@example.com",
    "secretysecret"
);
