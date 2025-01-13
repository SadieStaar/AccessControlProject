var parsedUrl = new URL(window.location.href);

// tologinpage: redirects user to the login page login.html
function tologinpage() {
    window.location.replace("login.html");
}

// toregistrationpage: redirects user to the registration page registration.html
function toregistrationpage() {
    alert("Function not supported yet, try again later.");
}

// login function: take username and password, send to backend
function login() {
    // Get entered username and password
    const inputusername = document.getElementById("userinput").value;
    const inputpassword = document.getElementById("password").value;

    // Initiate POST request to the backend with login credentials
    fetch("http://" + parsedUrl.host + "/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputusername, inputpassword }),
    })
        // Handle response
        .then((resp) => {
            if (resp.status === 200) {
                // Login successful
                console.log("Frontend redirecting to TOTP...");
                window.location.replace("totp.html");
            } else if (resp.status === 404 || resp.status === 401) {
                // Authentication failed
                console.log("Resetting login page...");
                document.getElementById("userinput").value = "";
                document.getElementById("password").value = "";
                alert("Incorrect username or password. Please try again.");
            } else if (resp.status === 500) {
                // Server or database error
                console.log("Server error detected.");
                alert("An error occurred on the server. Please try again later.");
            } else {
                throw new Error("Unexpected response status: " + resp.status);
            }
        })
        // Error handler
        .catch((err) => {
            console.error("Network or unexpected error:", err);
            console.error("Stack trace:", err.stack);
            alert("A network error occurred. Please check your connection and try again.");
        });
}

// totp function: take totp code, send to backend
function submitTOTP() {
    const totpInput = document.getElementById('totp').value;

    console.log(`recieved: ${totpInput}`);

    // make sure user enters something
    if (!totpInput) {
        alert('Enter the 6 TOTP numbers in the textbox.');
        return;
    }
    
    // send to the backend for processing
    fetch("http://" + parsedUrl.host + "/totp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({totpInput}),
    })

    // check for errors
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error: status: ${response.status}`);
        }
        return response.json();
    })

    // parse and act on data from backend
    .then((data) => {
        if (data.success) { // 200: request good
            console.log("TOTP verified. Redirecting to Query page...");
            window.location.replace("query.html");
        }
        else {
            console.log("How did we get here?");
        }
    })
    
    // error handler if frontend parsing fails
    .catch((err) => {
        alert("An error occured while processing the request.");
        console.error("Unexpected error occured:", err);
        console.error("Stack trace:", err.stack);
    });
}

// query: the original function from the forked repo
function query() {
    fetch("http://" + parsedUrl.host + "/query", {
        method: "GET",
        mode: "no-cors",
    })
    .then((resp) => resp.text())
    .then((data) => {
        document.getElementById("response").innerHTML = data;
    })
    .catch((err) => {
        console.log(err);
    })
}