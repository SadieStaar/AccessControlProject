# AccessControlProject

## Overview
The **Access Control Project** is a multi-container application demonstrating user authentication, TOTP (Time-based One-Time Password) verification, and JWT-based access control. It uses:

- **User Management API** (for registration, login, TOTP checking, and JWT issuance/validation)  
- **Data API** (for querying protected data)  
- **MySQL** containers for separate user and data databases  
- **Docker** to orchestrate and run all services

---

## Features
- **User Registration**: Secure password handling (bcrypt + salt + pepper)  
- **User Login**: Issues a JWT upon successful password check  
- **Time-based One-Time Password (TOTP)**: A second factor of authentication  
- **JWT Validation**: Protects the Data API by verifying tokens via the User Management API  
- **Separate MySQL Databases**: One for user credentials, one for “quack” data  
- **Containerized**: Each service runs in its own Docker container  

---

## Prerequisites
- **Docker** (and Docker Compose)  
- **A Web Browser** for interacting with the frontend (e.g., `http://localhost`)

---

## Project Structure

- **authenticator/**  
  - *dockerfile, package.json, totp.js*  
  - Stand-alone TOTP generator (optional)

- **servers/server-data/**  
  - **backend-data/index.js**: Data API that serves `/query` and static files.  
  - **frontend-data/**: HTML, CSS, and JS (e.g. `common.js`) for registration, login, TOTP, and query pages.  
  - *dockerfile*: Builds the data server container.

- **sql/**  
  - **sql-users/**: Creates the `users` DB.  
  - **sql-quack/**: Creates the `quack` DB.

- **user-management-api/**  
  - **index.js**: Handles registration, login, TOTP verification, and JWT validation.  
  - **package.json**: Dependencies for bcrypt, express, cors, etc.  
  - **.dockerignore**: Excludes `node_modules` and `.env`.

- **docker-compose.yml**  
  - Defines all services: `mysql-users`, `mysql-quack`, `user-management-api`, `server-data`, and `authenticator`.

---

## Services

1. **User Management API (user-management-api)**
   - **Port**: 5002  
   - **Responsibilities**:
     - **POST /register**  
       - Accepts a JSON body with `username`, `email`, `password`.  
       - Stores a salted+peppered hash in the `users` DB.  
     - **POST /login**  
       - Accepts `inputusername` and `inputpassword`.  
       - On success, returns a JWT (`{ "token": "<JWT>" }`).  
     - **POST /totp**  
       - Accepts a JSON body `{ "totpInput": "123456" }`.  
       - Verifies TOTP code (HMAC-based). Returns 200 if correct.  
     - **POST /validateToken**  
       - Expects `Authorization: Bearer <token>`.  
       - Verifies the JWT’s signature and expiry. Returns 200 if valid, 401 if invalid.

2. **Data API (server-data)**
   - **Port**: 80  
   - **Responsibilities**:
     - Serves **frontend** pages (HTML, CSS, JS).  
     - **GET /query**:  
       - Checks `Authorization: Bearer <token>`.  
       - Calls user-management-api’s `/validateToken`.  
       - If valid, returns data from the `quack` DB; otherwise 401.

3. **MySQL Containers**
   - **mysql-users**: Initializes the `users` DB from `sql-users/users.sql`.  
   - **mysql-quack**: Initializes the `quack` DB from `sql-quack/quack.sql`.

4. **Authenticator (optional helper)**
   - Runs `totp.js` to generate a real-time TOTP code, matching the `TOTPSECRET`. Handy for testing.

---

## How to Run
1. **Build and Start** all containers:
   ```bash
   docker-compose build
   docker-compose up
