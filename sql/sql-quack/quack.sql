CREATE database quack;

use quack;

CREATE TABLE quack (
    username VARCHAR(255) NOT NULL,
    info     VARCHAR(255) NOT NULL,
    PRIMARY KEY (username)
);


INSERT INTO quack
VALUES(
    "user",
    "secret user data"
);
