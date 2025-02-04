# AccessControlProject

## Overview
The **Access Control Project** is a dockerized application testing user authentication, role-based access control, TOTP (Time-based One-Time Password) verification, and JWT-based access management. It utilizes:

- **User Management API** (for registration, login, TOTP checking, JWT validation, and role management)
- **Data API** (for querying protected data with role-based permissions)
- **MySQL** containers for separate user and data databases
- **Docker** to orchestrate and run all services

---

## Features
- **User Registration**: Secure password handling (bcrypt + salt + pepper) with role assignment (`member`, `premium`, `admin`)
- **User Login**: Issues a JWT upon successful password check, containing user roles
- **Role-Based Access Control**: Restricts access to certain APIs based on user roles
  - `member`: Access to basic data queries
  - `premium`: Access to extended data queries
  - `admin`: Full access, including administrative data queries
- **Time-based One-Time Password (TOTP)**: A second factor of authentication
- **JWT Validation**: Protects the Data API by verifying tokens via the User Management API
- **Separate MySQL Databases**: One for user credentials, one for "quack" data
- **Containerized**: Each service runs in its own Docker container
- **Audit Logging System**:
  - UUID-based log entries for each data access attempt
  - Tracks user identity, timestamp, accessed resource, and success/failure status
  - Admin-only access to log viewing interface
  - Visual statistics for security analysis
  - Real-time logging of all data access attempts
  - Automatic logging of unauthorized access attempts

---

## Prerequisites
- **Docker** (and Docker Compose)
- **A Web Browser** for interacting with the frontend (e.g., [`http://localhost`](http://localhost))

---

## Project Structure

- **authenticator/**  
  - *dockerfile, package.json, totp.js*  
  - Stand-alone TOTP generator (optional)

- **server-data/**  
  - **backend-data/index.js**: Data API that serves `/query`, `/queryFlightLogs`, `/queryQuackStats`, and static files.  
  - **frontend-data/**: HTML, CSS, and JS (e.g., `common.js`) for registration, login, TOTP, and query pages.  
  - *dockerfile*: Builds the data server container.

- **servers/server-users/**  
  - **backend-users/index.js**: Handles user login and TOTP verification.  
  - *package.json*: Dependencies for express, bcrypt, crypto, jsonwebtoken, mysql2, etc.  
  - *dockerfile*: Builds the user server container.

- **sql/**  
  - **sql-users/**: Creates the `users` DB.  
  - **sql-quack/**: Creates the `quack` DB.

- **user-management-api/**  
  - **index.js**: Handles registration, login, TOTP verification, JWT validation, and role management.  
  - **package.json**: Dependencies for bcrypt, express, cors, jsonwebtoken, mysql2, node-fetch, etc.  
  - **.dockerignore**: Excludes `node_modules` and `.env`.

- **docker-compose.yml**  
  - Defines all services: `mysql-users`, `mysql-quack`, `user-management-api`, `server-data`, `server-users`, and `authenticator`.

---

## Services

1. **User Management API (user-management-api)**
   - **Port**: 5002  
   - **Responsibilities**:
     - **POST /register**  
       - Accepts a JSON body with `username`, `email`, `password`, and optionally `role`. Defaults to `member` if not specified.
       - Stores a salted+peppered hash in the `users` DB.
     - **POST /login**  
       - Accepts `inputusername` and `inputpassword`.  
       - On success, returns a JWT containing user information and roles (`{ "token": "<JWT>" }`).  
     - **POST /totp**  
       - Accepts a JSON body `{ "totpInput": "123456" }`.  
       - Verifies TOTP code (HMAC-based). Returns 200 if correct.  
     - **POST /validateToken**  
       - Expects `Authorization: Bearer <token>`.  
       - Verifies the JWT's signature and expiry. Returns 200 if valid, 401 if invalid.
     - **POST /log**  
       - Records access attempts with UUID, username, timestamp, and status
       - Accepts JSON body with `user`, `dataaccessed`, and `success`
       - Returns 201 on successful log creation
     - **GET /logs**  
       - Admin-only endpoint for accessing audit logs
       - Returns chronologically ordered access history
       - Self-logs access attempts (both successful and failed)
       - Returns 403 for non-admin users

2. **Data API (server-data)**
   - **Port**: 80  
   - **Responsibilities**:
     - Serves **frontend** pages (HTML, CSS, JS).  
     - **GET /query**:  
       - Accessible by `member`, `premium`, and `admin` roles.
       - Checks `Authorization: Bearer <token>`.  
       - Calls user-management-api's `/validateToken`.  
       - If valid, returns data from the `quack` DB; otherwise 401.
     - **GET /queryFlightLogs**:  
       - Accessible by `premium` and `admin` roles.
       - Checks `Authorization: Bearer <token>`.  
       - Calls user-management-api's `/validateToken`.  
       - If valid and role is sufficient, returns data from the `flight_logs` DB; otherwise 403 or 401.
     - **GET /queryQuackStats**:  
       - Accessible only by `admin` role.
       - Checks `Authorization: Bearer <token>`.  
       - Calls user-management-api's `/validateToken`.  
       - If valid and role is admin, returns data from the `quack_stats` DB; otherwise 403 or 401.
     - Automatic logging of all data access attempts
     - Integration with user-management-api's logging system
     - Tracks successful and failed query attempts

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
   ```
2. **Access** the frontend at [http://localhost](http://localhost) (port 80).  
3. **Register** at [http://localhost/register.html](http://localhost/register.html).  
   - Optionally, assign a role (`member`, `premium`, `admin`) during registration.
4. **Login** at [http://localhost/login.html](http://localhost/login.html).  
   - On success, a JWT is returned and stored in a cookie.
5. **TOTP** at [http://localhost/totp.html](http://localhost/totp.html).  
   - Enter the 6-digit code from the authenticator container (or your own TOTP script).
6. **Query** at [http://localhost/query.html](http://localhost/query.html).  
   - Depending on your role, access different datasets:
     - **Member**: Access basic quack data.
     - **Premium**: Access flight logs in addition to quack data.
     - **Admin**: Access quack stats along with all other data.

---

## Authentication & TOTP Flow
1. **Register** → Writes a new user into the `users` DB with an assigned role.  
2. **Login** → Checks password with bcrypt. If correct, returns a JWT (expires in 1 hour) containing user roles.  
3. **TOTP** → Verifies the 6-digit code is correct for that 30-second window.  
4. **Query** → The Data API checks the JWT by calling `/validateToken` and enforces role-based access.

---

## Troubleshooting
- **CORS Errors**  
  - The user-management-api uses `cors({ origin: "http://localhost" })`. If your front-end runs on a different origin, update or broaden `origin`.

- **"Not Logged In"**  
  - Occurs if the front-end cannot read the `token` cookie. Make sure you do **not** set `HttpOnly` if you want JavaScript to access it.

- **Invalid ELF Header / Module Not Found**  
  - Ensure each service runs `npm install` inside Docker (avoid copying host-side `node_modules`).

- **Database Not Created**  
  - Check the MySQL containers. They run `.sql` scripts from `sql/`. Ensure environment variables match your `docker-compose.yml`.

- **TOTP Wrong**  
  - Check that `TOTPSECRET` is identical in user-management-api and the authenticator container. The codes must match the same secret.

- **Role-Based Access Issues**  
  - Ensure that user has correct role assigned during registration.
  - Verify that JWT contains correct role information.
  - Check that frontend requests include the valid `Authorization` header with the JWT.

---

## Technologies 
- **Frontend**: HTML, CSS, JavaScript (Vanilla)  
- **Backend**: Node.js (Express), bcrypt, jsonwebtoken, cors, mysql2, node-fetch  
- **Database**: MySQL in Docker  
- **Containerization**: Docker Compose (multiple services)

---

## Admin Interface
The admin interface includes a new logging dashboard accessible at `/adminquery.html`:
- **Access Statistics**:
  - Total number of access attempts
  - Successful vs. failed access counts
  - Real-time statistics updates
- **Log Table View**:
  - Chronological list of all access attempts
  - Color-coded success/failure indicators
  - Detailed information including:
    - Timestamp
    - Username
    - Accessed resource
    - Access status

## Security Features
- **Comprehensive Audit Trail**:
  - All data access attempts are logged
  - Failed authentication attempts are tracked
  - Admin access to logs is itself logged
  - UUID-based log entry identification
  - Human-readable timestamps
  - Success/failure status tracking

Run `docker-compose up` in the project directory to start the application. Turn off the server-data container, and the user-management-api while the SQL containers are starting to avoid `ECONNREFUSED` errors. Once, the users-sql and quack-sql containers are ready for connections, start the server-data and user-management-api containers.
Then you can continue to register, login, and activate authenticator in docker to get your TOTP code. Now you can query.
