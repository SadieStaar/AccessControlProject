CREATE DATABASE data;

use data;

CREATE TABLE data (
    username VARCHAR(255) NOT NULL,
    info     VARCHAR(255) NOT NULL,
    PRIMARY KEY (username)
);


INSERT INTO data
VALUES(
    "user",
    "secrety usery data"
);
