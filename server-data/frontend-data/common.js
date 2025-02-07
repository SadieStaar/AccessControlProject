// MAIN URL
var parsedUrl = new URL(window.location.href);

// TO LOG-IN
function tologinpage() {
    window.location.replace("login.html");
    console.log("attempted swap");
}

// TO REGISTRATION
function toregistrationpage() {
    window.location.replace("register.html");
}

// RETRIEVE COOKIE
function getCookie(name) {
    let value = `; ${document.cookie}`;
    let parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// REGISTRATION
function register() {
    //get values and check if password matches
    let username = document.getElementById('username').value;
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    let passwordcheck = document.getElementById('passwordcheck').value;

    //if passwords match, send to user-management-api
    if (password === passwordcheck) {
        console.log("Passwords match, sending data to user-management-api...");
        fetch("http://" + parsedUrl.host + ":5002/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password }),
        })
        .then((resp) => {
            console.log("returned successfully");
            //serve response
            switch (resp.status) {
                case 201:
                    // success, redirect to home page
                    console.log("Registration successful, redirecting to homepage...");
                    alert("Registered successfully. Welcome to the flock, Quackian!");
                    window.location.replace("index.html");
                    break;
                case 400: // invalid syntax or characters
                    console.log("Invalid character:", resp.message);
                    alert("Invalid character");
                    break;
                case 409: // user already in system
                    console.error("User already exists");
                    alert("This username has been taken, please try again.");
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
    } else {
        alert("Passwords do not match");
    }
}

// LOGIN
function login() {
    //Get entered username and password
    let inputusername = document.getElementById("userinput").value;
    let inputpassword = document.getElementById("password").value;

    //if nothing entered, tell user to do the thing
    if (!inputusername || !inputpassword) {
        alert("Please enter username and password.");
        return;
    }

    //POST request to user-management-api with login credentials
    fetch("http://" + parsedUrl.hostname + ":5002/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputusername, inputpassword }),
    })

    //response
    .then(async (data) => {
        switch(data.status) {

            // success
            case 200:
                console.log("Frontend redirecting to TOTP...");
                try {
                    let response = await data.json(); 
                    let token = response.token;

                    //store the token as a cookie
                    if (token) {
                        document.cookie = `token=${token}; Path=/; SameSite=Strict`;
                        console.log("JWT stored as cookie.");
                        window.location.replace("totp.html");
                    } else {
                        console.error("No token received in response.");
                        alert("ERROR HERE");
                    }
                } catch (err) {
                    console.error("Failed to parse response body:", err);
                    alert("ERROR HERE");
                }
                return; 
            
            // user or password does not match
            case 401:
            case 404:
                console.error("Username or password does not match database");
                alert("The username or password does not exist.");
                break;

            //database error
            case 500:
                console.error("500: Database error: " + data.status);
                alert("The server ran into an issue. Please try again later.");
                break;

            // unknown error
            default:
                console.error("Unexpected response status: " + data.status);
                alert("The server ran into an issue. Please try again later.");
        }
        // reload for failed attempts
        location.reload();
    })

    //error handler
    .catch((err) => {
        console.error(`Network or unexpected error: ${err.message}; Stack trace: ${err.stack}`);
        alert("A network error occurred. Please check your connection and try again.");
        location.reload();
    });
}

// TOTP
function submitTOTP() {
    let totpInput = document.getElementById('totp').value;
    console.log(`received: ${totpInput}`);

    // incorrect input
    if (!totpInput) {
        alert('Enter the 6 TOTP numbers in the textbox.');
        return;
    }

    let token = getCookie('token');
    if (!token){
        console.error("No token found, redirecting to login.");
        alert("Invalid session. Please log in again.");
        window.location.replace("login.html");
        return;
    }
    let payload = JSON.parse(atob(token.split('.')[1]));
    let inputusername = payload.username;
    let role = payload.role;

    fetch("http://" + parsedUrl.hostname + ":5002/totp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ totpInput, inputusername }),
    })
    .then((resp) => {
        switch (resp.status) {

            // success
            case 200:
                console.log("TOTP verified. Redirecting based on role...");

                    // load page based on role
                    switch (role) {
                        case 'member':
                            window.location.replace("member.html");
                            break;
                        case 'premium':
                            window.location.replace("premium.html");
                            break;
                        case 'admin':
                            window.location.replace("admin.html");
                            break;
                        default:
                            console.error("Unknown role, redirecting to default page.");
                            window.location.replace("index.html");
                    }
                break;
        
            case 401:
                console.error("TOTP not verified.");
                alert("Code not verified. Try again.");
                break;
        
            default:
                console.log("TOTP not verified");
                location.reload();
        }        
    })
    .catch((err) => {
        alert("An error occurred while processing the request.");
        console.error("Unexpected error occurred:", err);
        console.error("Stack trace:", err.stack);
    });
}

// QUACK TABLE
function queryQuackTable() {

    // check if valid session
    let token = getCookie('token'); 
    if (!token) {
        alert("You are not logged in. Please log in first.");
        window.location.replace("login.html");
        return;
    }

    // make GET request to backend data
    fetch("http://" + parsedUrl.hostname + "/queryQuackTable", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`, //include token auth header
        },
    })

    // handle response
    .then((resp) => {
        switch (resp.status){

            // success
            case 200:
                return resp.text();

            // failed token
            case 401:
                alert("Unauthorized access. Please log in again.");
                window.location.replace("login.html");
                break;

            // unknown error
            default:
                throw new Error("Failed to fetch data");
        }
    })

    // send data to page
    .then((data) => {
        document.getElementById("response").innerHTML = data;
    })

    // error catch
    .catch((err) => {
        console.error("Query error:", err.message);
        alert("Failed to fetch data. Please try again.");
    });
}

// FLIGHT LOGS
function queryFlightLogs() {

    // check if valid session
    const token = getCookie('token');
    if (!token) {
        alert("You are not logged in. Please log in first.");
        window.location.replace("login.html");
        return;
    }

    // make GET request to backend data
    fetch("http://" + parsedUrl.hostname + "/queryFlightLogs", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        },
    })

    // handle response
    .then((resp) => {
        switch (resp.status) {

            // success
            case 200:
                return resp.text();
    
            // failed token
            case 401:
                alert("Unauthorized access. Please log in again.");
                window.location.replace("login.html");
                break;
    
            // failed role access
            case 403:
                alert("Forbidden: You do not have the required role.");
                break;
    
            // unknown error
            default:
                throw new Error("Failed to fetch data");
        }
    })

    // send data to page
    .then((data) => {
        document.getElementById("response").innerHTML = data;
    })

    // error catch
    .catch((err) => {
        console.error("QueryFlightLogs error:", err.message);
        alert("Failed to fetch flight logs. Please try again.");
    });
}

// QUACK STATS
function queryQuackStats() {

    // check if valid session
    const token = getCookie('token');
    if (!token) {
        alert("You are not logged in. Please log in first.");
        window.location.replace("login.html");
        return;
    }

    // make GET request to backend data
    fetch("http://" + parsedUrl.hostname + "/queryQuackStats", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        },
    })

    // handle response
    .then((resp) => {
        switch (resp.status) {

            // success
            case 200:
                return resp.text();
    
            // failed token
            case 401:
                alert("Unauthorized access. Please log in again.");
                window.location.replace("login.html");
                break;
    
            // failed role access
            case 403:
                alert("Forbidden: You do not have the required role.");
                break;
    
            // unknown error
            default:
                throw new Error("Failed to fetch data");
        }
    })

    // send data to page
    .then((data) => {
        document.getElementById("response").innerHTML = data;
    })

    // error catch
    .catch((err) => {
        console.error("QueryQuackStats error:", err.message);
        alert("Failed to fetch quack stats. Please try again.");
    });
}