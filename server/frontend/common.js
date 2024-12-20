var parsedUrl = new URL(window.location.href);

// HOME PAGE FUNCTIONS:

// tologinpage: redirects user to the login page login.html
function tologinpage() {
    window.location.replace("login.html");
}


// LOGIN.HTML FUNCTION:

// login: takes a username and password, passes into backend and returns result
//  will reroute successful matches to query page
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
                console.log("Frontend redirecting to query...");
                window.location.replace("query.html");
            } else if (resp.status === 401) {
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
            alert("A network error occurred. Please check your connection and try again.");
        });
}



// QUERY.HTML FUNCTION

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