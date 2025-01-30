CREATE DATABASE users;

use users;

CREATE TABLE users (
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role     ENUM('member', 'premium', 'admin') NOT NULL,
    email    VARCHAR(255) NOT NULL,
    salt     VARCHAR(255) NOT NULL,
    PRIMARY KEY (username)
);

-- basic user
INSERT INTO users
VALUES(
    "user",
    "$2b$10$31z3yI8coig/3nE8ae16UOWir18T2b3VC.PiAx9zPcuM8mkj6sjaa",
    "member",
    "user@example.com",
    "abc1"
);

-- premium user
INSERT INTO users
VALUES(
    "premium",
    "$2b$10$31z3yI8coig/3nE8ae16UOWir18T2b3VC.PiAx9zPcuM8mkj6sjaa",
    "premium",
    "premium@example.com",
    "abc1"
);

-- admin
INSERT INTO users
VALUES(
    "admin",
    "$2b$10$31z3yI8coig/3nE8ae16UOWir18T2b3VC.PiAx9zPcuM8mkj6sjaa",
    "admin",
    "user@example.com",
    "abc1"
);

-- logs table
CREATE table logs (
    id VARCHAR(255) NOT NULL,
    user VARCHAR(255) NOT NULL,
    timeaccessed VARCHAR(255) NOT NULL,
    dataaccessed VARCHAR(255) NOT NULL,
    success ENUM('true', 'false') NOT NULL
);