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
- **Access** the frontend at [http://localhost](http://localhost) (port 80).  
- **Register** at [http://localhost/register.html](http://localhost/register.html).  
- **Login** at [http://localhost/login.html](http://localhost/login.html).  
  - On success, a JWT is returned and stored in a cookie.  
- **TOTP** at [http://localhost/totp.html](http://localhost/totp.html).  
  - Enter the 6-digit code from the authenticator container (or your own TOTP script).  
- **Query** at [http://localhost/query.html](http://localhost/query.html).  
  - If the JWT is valid, you’ll see data from the “quack” DB.

---

## Authentication & TOTP Flow

- **Register** → Writes a new user into the `users` DB.  
- **Login** → Checks password with bcrypt. If correct, returns a JWT (expires in 1 hour).  
- **TOTP** → Verifies the 6-digit code is correct for that 30-second window.  
- **Query** → The Data API checks the JWT by calling `/validateToken`.

---

## Troubleshooting

- **CORS Errors**  
  - The user-management-api uses `cors({ origin: "http://localhost" })`. If your front-end runs on a different origin, update or broaden `origin`.

- **“Not Logged In”**  
  - Occurs if the front-end cannot read the `token` cookie. Make sure you do **not** set `HttpOnly` if you want JavaScript to access it.

- **Invalid ELF Header / Module Not Found**  
  - Ensure each service runs `npm install` inside Docker (avoid copying host-side `node_modules`).

- **Database Not Created**  
  - Check the MySQL containers. They run `.sql` scripts from `sql/`. Ensure environment variables match your `docker-compose.yml`.

- **TOTP Wrong**  
  - Check that `TOTPSECRET` is identical in user-management-api and the authenticator container. The codes must match the same secret.

---

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript (Vanilla)  
- **Backend**: Node.js (Express), bcrypt, jsonwebtoken, cors, mysql2  
- **Database**: MySQL in Docker  
- **Containerization**: Docker Compose (multiple services)

---

## Conclusion

This **Access Control Project** showcases a secure, multi-step authentication process using **JWT** and **TOTP**. By splitting the **User Management API** from the **Data API**, you enforce strict token-based access to sensitive data. Everything is containerized for easy setup.

Just run `docker-compose up`, open [http://localhost](http://localhost), and follow the **registration → login → TOTP → query** flow!

   docker-compose build
   docker-compose up
