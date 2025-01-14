CREATE DATABASE secretdata;

use secretdata;

CREATE TABLE secretdata (
    username VARCHAR(255) NOT NULL,
    info     VARCHAR(255) NOT NULL,
    PRIMARY KEY (username)
);


INSERT INTO secretdata
VALUES(
    "user",
    "secret user data"
);
