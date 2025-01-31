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

-- Data for quack table
INSERT INTO quack (username, info)
VALUES
    ('Donald', 'Famous for his sailor outfit and temper'),
    ('Daisy', 'Donald Duck''s girlfriend'),
    ('Scrooge', 'The richest duck in the world, loves his money bin'),
    ('Huey', 'One of Donald Duck''s nephews, known for his red cap'),
    ('Dewey', 'One of Donald Duck''s nephews, known for his blue cap'),
    ('Louie', 'One of Donald Duck''s nephews, known for his green cap')
ON DUPLICATE KEY UPDATE 
    info = VALUES(info);

-- Create Duck Flight Logs Table
CREATE TABLE IF NOT EXISTS flight_logs (
    flight_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    flight_date DATE NOT NULL
);

-- Duck flight_logs data
INSERT INTO flight_logs (username, destination, flight_date)
VALUES
    ('Huey', 'Duckburg', '2025-01-05'),
    ('Scrooge', 'Money Lake', '2025-01-06'),
    ('Louie', 'Red River', '2025-01-09'),
    ('Dewey', 'Blue Bay', '2025-01-09'),
    ('Louie', 'Green Glade', '2025-01-10'),
    ('Daisy', 'Quack City', '2025-01-11'),
    ('Daisy', 'Wingville', '2025-01-12'),
    ('Scrooge', 'Gold Pond', '2025-01-13'),
    ('Dewey', 'Azure Archipelago', '2025-01-15'),
    ('Louie', 'Emerald Estuary', '2025-01-16'),
    ('Donald', 'Beak Beach', '2025-01-17'),
    ('Huey', 'Plume Point', '2025-01-18'),
    ('Donals', 'Treasure Island', '2025-01-19'),
    ('Dewey', 'Crimson Cove', '2025-01-20'),
    ('Huey', 'Sapphire Springs', '2025-01-21'),
    ('Donald', 'Mallard Marsh', '2025-01-23'),
    ('Daisy', 'Feather Fjord', '2025-01-24'),
    ('Huey', 'Ruby Reef', '2025-01-26'),
    ('Dewey', 'Cerulean Coast', '2025-01-27'),
    ('Louie', 'Jade Jungle', '2025-01-28'),
    ('Scrooge', 'Duckburg', '2025-01-29');
    

-- Create Duck quack statistics Table
CREATE TABLE IF NOT EXISTS quack_stats (
    stats_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    quacks INT NOT NULL,
    recorded_on DATE NOT NULL
);

-- Duck quack_stats data
INSERT INTO quack_stats (username, quacks, recorded_on)
VALUES
    ('Huey', '2', '2025-01-05'),
    ('Scrooge', '30', '2025-01-06'),
    ('Louie', '6', '2025-01-09'),
    ('Dewey', '4', '2025-01-09'),
    ('Louie', '20', '2025-01-10'),
    ('Daisy', '14', '2025-01-11'),
    ('Daisy', '21', '2025-01-12'),
    ('Scrooge', '34', '2025-01-13'),
    ('Dewey', '9', '2025-01-15'),
    ('Louie', '17', '2025-01-16'),
    ('Donald', '24', '2025-01-17'),
    ('Huey', '3', '2025-01-18'),
    ('Donals', '30', '2025-01-19'),
    ('Dewey', '31', '2025-01-20'),
    ('Huey', '19', '2025-01-21'),
    ('Donald', '11', '2025-01-23'),
    ('Daisy', '7', '2025-01-24'),
    ('Huey', '3', '2025-01-26'),
    ('Dewey', '25', '2025-01-27'),
    ('Louie', '37', '2025-01-28'),
    ('Scrooge', '42', '2025-01-29');
