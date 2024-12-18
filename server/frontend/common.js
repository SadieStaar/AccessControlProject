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
    // get entered username and password
    const inputusername = document.getElementById("userinput").value;
    const inputpassword = document.getElementById("password").value;

    // init post req to backend with login creds
    fetch("http://" + parsedUrl.host + "/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({inputusername, inputpassword}),
    })

    // handle response
    .then((resp) => resp.text())
    .then((data) => {
        console.log(JSON.parse(data).success);

        // if login was successful, redirect
        if (JSON.parse(data).success) {
            // login successful
            console.log("Frontend redirecting to query...");
            window.location.replace("query.html");
        }

        // else, reset fields !!! MUST ADD ALERT !!!
        else{
            console.log("Resetting login page...");
            document.getElementById("userinput").value = "";
            document.getElementById("password").value = "";
        }
    })

    // error handler (this should be edited to work for users as well)
    .catch((err) => {
        console.log(err);
    })
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