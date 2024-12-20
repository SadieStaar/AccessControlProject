# AccessControlProject

## Project Overview
The Access Control Project is a simple web application for user authentication and database interaction. It includes a frontend for users to log in and query data, and a backend for handling authentication and database operations.

## Features
1. **Frontend**
   - **Homepage (`index.html`)**:
     - Provides a "Login" button that redirects users to the login page.
   - **Login Page (`login.html`)**:
     - Allows users to input their username and password.
     - Validates credentials with the backend and redirects successful logins to the query page.
   - **Query Page (`query.html`)**:
     - Lets users execute predefined queries to fetch data and display the results.

2. **Backend**
   - Built with Node.js and Express.
   - Connects to a MySQL database using the `mysql2` package.
   - Handles authentication (`/login`) and querying (`/query`).
   - **Environment Variables**: Configured for database and server connection.

3. **Styling**
   - **`common.css`**: Provides styling for buttons and layout with a clean and centered design.

4. **Scripts**
   - **`common.js`**: Manages frontend actions, including login validation and query execution.

## Setup Instructions
1. **Prerequisites**
   - Node.js and npm installed.
   - MySQL database configured with a `users` table.

2. **Environment Configuration**
   - Create a `.env` file with:
     ```
     PORT=your_port
     HOST=your_host
     MYSQLHOST=your_mysql_host
     MYSQLUSER=your_mysql_user
     MYSQLPASS=your_mysql_password
     ```

3. **Installation**
   - Run `npm install` to install dependencies (`express`, `mysql2`, `nodemon`, `bcrypt`).

4. **Start the Server**
   - Use `npm start` to launch the backend. The application will serve the frontend from the `frontend` directory.

5. **Frontend Usage**
   - Navigate to the homepage, log in with credentials, and access the query functionality.

## File Summary
- **Frontend**
  - `index.html`: Homepage with a login button.
  - `login.html`: Login form for user authentication.
  - `query.html`: Interface for querying data.
  - `common.css`: Stylesheet for consistent design.
  - `favicon.png`: Favicon for the application.
- **Backend**
  - `index.js`: Main server file with routes for login and queries.
  - `package.json`: Manages project dependencies and scripts.
  - `dockerfile`: Docker setup (details not provided here).

## Future Improvements
- Hash passwords using `bcrypt` for secure authentication.
- Add error alerts for failed login attempts.
- Implement role-based access control for queries.

---
