var $2A20x$express = require("express");
var $2A20x$path = require("path");
var $2A20x$expresssession = require("express-session");
var $2A20x$mysql = require("mysql");

var $84a264530b3fb4fb$var$__dirname = "";




const $84a264530b3fb4fb$var$PORT = 3000;
const $84a264530b3fb4fb$var$connection = $2A20x$mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "nodelogin"
});
const $84a264530b3fb4fb$var$app = $2A20x$express();
$84a264530b3fb4fb$var$app.use($2A20x$expresssession({
    secret: "secret",
    resave: true,
    saveUninitialized: true
}));
$84a264530b3fb4fb$var$app.use($2A20x$express.json());
$84a264530b3fb4fb$var$app.use($2A20x$express.urlencoded({
    extended: true
}));
$84a264530b3fb4fb$var$app.use($2A20x$express.static($2A20x$path.join($84a264530b3fb4fb$var$__dirname, "static")));
$84a264530b3fb4fb$var$app.use($2A20x$express.static("frontend"));
$84a264530b3fb4fb$var$app.get("/login", (req, res)=>{
    res.status(200);
    res.sendFile($2A20x$path.join($84a264530b3fb4fb$var$__dirname, "/frontend/login.html"));
});
$84a264530b3fb4fb$var$app.get("/", (req, res)=>{
    res.status(200);
    res.sendFile($2A20x$path.join($84a264530b3fb4fb$var$__dirname, "/frontend/index.html"));
});
$84a264530b3fb4fb$var$app.post("/auth", function(request, response) {
    // Capture the input fields
    let username = request.body.username;
    let password = request.body.password;
    // Ensure the input fields exists and are not empty
    if (username && password) // Execute SQL query that'll select the account from the database based on the specified username and password
    $84a264530b3fb4fb$var$connection.query("SELECT * FROM accounts WHERE username = ? AND password = ?", [
        username,
        password
    ], function(error, results, fields) {
        // If there is an issue with the query, output the error
        if (error) throw error;
        // If the account exists
        if (results.length > 0) {
            // Authenticate the user
            request.session.loggedin = true;
            request.session.username = username;
            // Redirect to home page
            response.redirect("/home");
        } else response.send("Incorrect Username and/or Password!");
        response.end();
    });
    else {
        response.send("Please enter Username and Password!");
        response.end();
    }
});
// http://localhost:3000/home
$84a264530b3fb4fb$var$app.get("/home", function(request, response) {
    // If the user is loggedin
    if (request.session.loggedin) // Output username
    response.send("Welcome back, " + request.session.username + "!");
    else // Not logged in
    response.send("Please login to view this page!");
    response.end();
});
$84a264530b3fb4fb$var$app.listen($84a264530b3fb4fb$var$PORT, (error)=>{
    if (!error) console.log("Server is Successfully Running, and App is listening on port " + $84a264530b3fb4fb$var$PORT);
    else console.log("Error occurred, server can't start", error);
});


//# sourceMappingURL=index.js.map
