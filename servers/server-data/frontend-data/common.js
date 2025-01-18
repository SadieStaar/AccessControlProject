var parsedUrl = new URL(window.location.href);

// tologinpage: redirects user to the login page login.html
function tologinpage() {
    window.location.replace("login.html");
}

// toregistrationpage: redirects user to the registration page registration.html
function toregistrationpage() {
    window.location.replace("register.html");
}

// Function to retrieve a cookie by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}


// register: take username, email, and password, send to user-management-api
function register() {
    // get values and check if password matches
    let username = document.getElementById('username').value;
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    let passwordcheck = document.getElementById('passwordcheck').value;

    // if passwords match, send to user-management-api
    if (password === passwordcheck) {
        console.log("Passwords match, sending data to user-management-api...");
        fetch("http://" + parsedUrl.host + ":5002/register", {
            method:"POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password }),
        })
        .then((resp) => {
            console.log("returned successfully");
            // serve the proper response
            switch (resp.status) {
                case 201:
                    // success, redirect to home page
                    console.log("Registration successful, redirecting to homepage...");
                    window.location.replace("index.html");
                    break;
                case 409: // user already in system
                    console.error("User already exists");
                    alert("This username has been taken, try again.");
                    break;
                default:
                    console.error("this is the default case, error occurred");
                    alert("Error detected, please check the terminal");
            }
        })
        .catch((err) => {
            console.error("Network or unexpected error:", err);
            alert("A network error occurred during registration.");
        });
    }
    else {
        alert("Passwords do not match");
    }
}

// login function: take username and password, send to user-management-api
function login() {
    // Get entered username and password
    const inputusername = document.getElementById("userinput").value;
    const inputpassword = document.getElementById("password").value;

    // if nothing entered, tell user to do the thing
    if (!inputusername || !inputpassword) {
        alert("Please enter username and password.");
        return;
    }

    // Initiate POST request to user-management-api with login credentials
    fetch("http://" + parsedUrl.hostname + ":5002/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputusername, inputpassword }),
    })
    // handle response
    .then(async (data) => {
        switch(data.status) {
            case 200:  // successful login
                console.log("Frontend redirecting to TOTP...");
                try {
                    const response = await data.json(); // Parse response body to get token
                    const token = response.token;
                    if (token) {
                        // Store the token as a cookie
                        document.cookie = `token=${token}; Path=/; SameSite=Strict`; //HttpOnly; was here
                        console.log("JWT stored as cookie.");
                    } else {
                        console.error("No token received in response.");
                    }
                } catch (err) {
                    console.error("Failed to parse response body:", err);
                }
                window.location.replace("totp.html");
                return; // we're done here, leave
            case 401:  // password does not match
            case 404:  // user not found
                console.error("Username or password does not match database");
                alert("The username or password does not match.");
                break;
            case 500: // database error
                console.error("500: Database error: " + data.status);
                alert("The server ran into an issue. Please try again later.");
                break;
            default: // something uncaught
                console.error("Unexpected response status: " + data.status);
                alert("The server ran into an issue. Please try again later.");
        }
        // reset page so user can try again: only on login failure
        location.reload();
    })
    // error handler for fetch errors
    .catch((err) => {
        console.error(`Network or unexpected error: ${err.message}; Stack trace: ${err.stack}`);
        alert("A network error occurred. Please check your connection and try again.");
        location.reload();
    });
}

// totp function: take totp code, send to user-management-api
function submitTOTP() {
    // get totp from page
    const totpInput = document.getElementById('totp').value;
    console.log(`received: ${totpInput}`);

    // make sure user enters something
    if (!totpInput) {
        alert('Enter the 6 TOTP numbers in the textbox.');
        return;
    }

    // send to the user-management-api for processing
    fetch("http://" + parsedUrl.hostname + ":5002/totp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ totpInput }),
    })
    // handle response
    .then((resp) => {
        switch(resp.status){
            case 200: // successful totp
                console.log("TOTP verified. Redirecting to Query page...");
                window.location.replace("query.html");
                return;
            case 401: // totp doesn't match
                console.error("TOTP not verified.");
                alert("Code not verified. Try again.");
                break;
            default:
                console.log("TOTP not verified");
                location.reload();
        }
    })
    // error handler for fetch errors
    .catch((err) => {
        alert("An error occurred while processing the request.");
        console.error("Unexpected error occurred:", err);
        console.error("Stack trace:", err.stack);
    });
}

// query: the original function from the forked repo
function query() {
    const token = getCookie('token'); // Retrieve the JWT token

    if (!token) {
        alert("You are not logged in. Please log in first.");
        window.location.replace("login.html");
        return;
    }

    // The data API is presumably at port 80 (parsedUrl.host + "/query")
    fetch("http://" + parsedUrl.hostname + "/query", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
    })
    .then((resp) => {
        if (resp.ok) {
            return resp.text();
        } else if (resp.status === 401) {
            alert("Unauthorized access. Please log in again.");
            window.location.replace("login.html");
        } else {
            throw new Error("Failed to fetch data");
        }
    })
    .then((data) => {
        document.getElementById("response").innerHTML = data;
    })
    .catch((err) => {
        console.error("Query error:", err.message);
        alert("Failed to fetch data. Please try again.");
    });
}
