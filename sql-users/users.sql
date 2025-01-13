CREATE DATABASE users;

use users;

CREATE TABLE users (
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email    VARCHAR(255) NOT NULL,
    salt     VARCHAR(255) NOT NULL,
    PRIMARY KEY (username)
);


INSERT INTO users
VALUES(
    "user",
    "$2b$10$31z3yI8coig/3nE8ae16UOWir18T2b3VC.PiAx9zPcuM8mkj6sjaa",
    "user@example.com",
    "abc1"
);
