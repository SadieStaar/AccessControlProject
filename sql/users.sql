CREATE DATABASE users;

use users;

CREATE TABLE users (
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email    VARCHAR(255) NOT NULL,
    PRIMARY KEY (username)
);

-- Generates hex value for the salt

INSERT INTO users
VALUES(
    "user",
    "$2b$12$z0ehqoz5OIC5L9WigMVEO.q6bBBsBq8tDWt.avpB2CQKerRNSnSq2",
    "user@example.com"
);
