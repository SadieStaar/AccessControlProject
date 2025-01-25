-- Create the quack database (if it doesn’t already exist)
CREATE DATABASE IF NOT EXISTS quack;

-- Switch to the quack database
USE quack;

-- Original quack table
CREATE TABLE IF NOT EXISTS quack (
    username VARCHAR(255) NOT NULL,
    info     VARCHAR(255) NOT NULL,
    PRIMARY KEY (username)
);

-- Sample data for quack table
INSERT INTO quack (username, info)
VALUES
    ('user', 'secret user data')
ON DUPLICATE KEY UPDATE 
    info = VALUES(info);

-- First new table: yall can change these to something for interesting just needed new tables
CREATE TABLE IF NOT EXISTS flight_logs (
    flight_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    flight_date DATE NOT NULL
);

-- Sample data flight_logs
INSERT INTO flight_logs (username, destination, flight_date)
VALUES
    ('user', 'Pond B', '2025-01-23');

-- Second new table
CREATE TABLE IF NOT EXISTS quack_stats (
    stats_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    quacks INT NOT NULL,
    recorded_on DATE NOT NULL
);

-- Sample data quack_stats
INSERT INTO quack_stats (username, quacks, recorded_on)
VALUES
    ('user', 3, '2025-01-22');
