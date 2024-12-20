# AccessControlProject

## Overview

The **Access Control Project** is a simple web application designed to manage user authentication and database queries. It features a Node.js backend with MySQL integration and a frontend served through Express. Docker is used to containerize the application for easy deployment and scalability.

---

## Features

- **Homepage**: Provides a button to navigate to the login page.  
- **Login Page**: Authenticates users using stored credentials in the database.  
- **Query Page**: Allows users to perform database queries and view results.   
- **API Endpoints**: Simple RESTful APIs for login and data retrieval.
- **bcrypt**: Added to the package for secure password handling.

---

## Prerequisites

- **Docker**: Ensure Docker is installed and running.  
 

---


## Project Structure

- **Frontend**:  
  - `index.html`: Homepage.  
  - `login.html`: User login page.  
  - `query.html`: Query results page.  
  - `common.css`: Shared styling.  
  - `common.js`: Frontend logic for navigation and API calls.  

- **Backend**:  
  - `index.js`: Express server with API routes for login and query.  
  - `package.json`: Manages project dependencies.  

- **Docker**:  
  - `Dockerfile`: Configures the Docker environment.

---

## API Endpoints

1. **Login**  
   - URL: `/login`  
   - Method: `POST`  
   - Request Body:  
     ```json
     {
         "inputusername": "username",
         "inputpassword": "password"
     }
     ```
   - Responses:  
     - `200 OK`: Login successful.  
     - `401 Unauthorized`: Invalid credentials.  
     - `500 Internal Server Error`: Database error.

2. **Query**  
   - URL: `/query`  
   - Method: `GET`  
   - Responses:  
     - `200 OK`: Query results.  
     - `500 Internal Server Error`: Database error.

---

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript.  
- **Backend**: Node.js, Express, MySQL.  
- **Containerization**: Docker.  

---

