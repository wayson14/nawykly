/* ======================== */
/* IMPORTS			 		*/
/* ======================== */
const express = require("express");
const path = require("path");
const session = require("express-session");
const mysql = require("mysql");
const ejs = require("ejs");
const services = require("./services")
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer");

/* ======================== */
/* SERVER PROPERITIES		*/
/* ======================== */
const PORT = 3000;
const app = express();

/* ======================== */
/* APP SETUPS			*/
/* ======================== */

/* specifies middleware used to recognize incoming
data in put and post requests */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* sets template engine used to generate html files
on server side to ejs (see views) */
app.set("view engine", "ejs");

/* sets properities for user sessions */
app.use(
	session({
		secret: "secret",
		resave: false,
		saveUninitialized: true,
	})
);

/* exposes static files */
app.use(express.static(path.join(__dirname, "static")));

/* ======================== */
/* DATABASE CONNECTION 		*/
/* ======================== */
const connection = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "nawykly",
});

/* ======================== */
/* NODEMAILER SETUP			*/
/* ======================== */


/* ======================== */
/* TEST ENDPOINT			*/
/* ======================== */

app.get("/test", (req, res) => {
	res.render("form_template", {message: ""})
});

app.get("/hash", (req, res) => {
	res.render("hash", { data: "" })
})
app.post("/hash", (req, res) => {
	data = req.body.data
	console.log(data)
	bcrypt.hash(data, 13)
		.then(hash => {
			console.log('hashed:' + hash)
			res.render("hash", { data: hash })
		})
		.catch(err => {
			res.render("hash", { data: err })
		})

})
/* ======================== */
/* LANDING					*/
/* ======================== */
app.get("/", (req, res) => {
	if (req.session.loggedin) {
		res.render("index");
	} else {
		res.redirect("/login");
	}
});



/* ======================== */
/* HABITS DASHBOARD 		*/
/* ======================== */
app.get("/dashboard", (req, res) => {
	if (req.session.loggedin) {
		res.status(200);
		// res.sendFile(path.join(__dirname, '/frontend/index.html'));
		res.render("index", { username: req.session.username });
	} else {
		res.redirect("/login");
	}
});

app.get("/session_details", function (req, res) {
	res.send({
		username: req.session.username,
	});
});

/* ======================== */
/* POMODORO TIMER			*/
/* ======================== */

/* ======================== */
/* LOGIN, REGISTER, LOGOUT	*/
/* ======================== */
app.get("/login", (req, res) => {
	res.status(200);
	res.render("login", { message: "" });
});

app.get("/register", (req, res) => {
	res.status(200);
	res.render("register", { message: "" });
});

app.get("/logout", (req, res) => {
	console.log("LOGGED OUT");
	req.session.destroy();
	/*if call to an api is made with fetch, we need to 
	  send target endpoint in res json and on frontend
	  handle it with special function, which takes this 
	  endpoint and set header specially for it (see below)
	  */
	res.send({ redirect: "/dashboard" });
	res.status(200);
});


app.post("/login", async function (req, res) {
	// Capture the input fields
	const username = req.body.username;
	const password = req.body.password;

	connection.query(
		"SELECT * FROM user WHERE username = ?",
		[username],
		function (error, results, fields) {
			if (error) {
				console.log("FAILURE" + err)
				res.render("login", {
					message: "DB issues!",
				})
			}

			else if (results.length < 1) {
				console.log("USER NOT FOUND")
				res.render("login", {
					message: "User with provided credentials not found!",
				})
			}
			else {
				console.log(results)
				storedPassword = results[0].password
				bcrypt.compare(password, storedPassword)
					.then(result => {
						if (result) {
							req.session.loggedin = true;
							req.session.username = username;
							res.redirect('/dashboard')
						}
						else {
							throw "Incorrect password!"
						}
						console.log("LOGGED IN", result)

					})
					.catch(err => {
						console.log("FAILURE" + err)
						res.render("login", {
							message: err,
						});

					})
			}
		});
});

app.post("/register", function (req, res) {
	// Capture the input fields
	let username = req.body.username;
	let password = req.body.password;
	let password_repeat = req.body.password_repeat;
	let email = req.body.email;

	// ensure that passwords match
	if (password_repeat !== password) {
		res.render("register", { message: "Passwords do not match!" });
		res.end();
	}
	// Ensure the input fields exists and are not empty
	else if (username && email) {
		bcrypt.hash(password, 13)
			.then(hashedPassword => {
				connection.query(
					`INSERT INTO user (username, password, email) 
					VALUES (?, ?, ?);`,
					[username, hashedPassword, email],
					function (error, results, fields) {
						if (error) {
							// console.error(error.stack)
							console.log(error.message);
							reg = /(uq)\w+/;
							if (error.code == "ER_DUP_ENTRY") {
								if (reg.exec(error.message)[0] == "uq_username") {
									message = "User with provided username already exists!";
								} else if (reg.exec(error.message)[0] == "uq_email") {
									message = "User with provided email already exists!";
								}
							} else {
								message = "Unknown database error.";
							}
							res.render("register", { message: message });
						} else {
							req.session.loggedin = true;
							req.session.username = username;
							res.redirect("/dashboard");
						}
					}
				);
			})
			.catch(err => console.log("HASHING ERROR: " + err))

	}
});

/* ======================== */
/* PASSWORD RESET			*/
/* ======================== */
function generateToken(){
	function randomString(length, chars) {
		let result = '';
		for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
		return result;
	}
	return randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
}

app.get("/reset", (req, res) => {
	res.render("reset", {message: ""})
})

app.post("/reset", (req, res) => {
	const email = req.body.email
	connection.query(`SELECT id, email FROM user WHERE ? = user.email;`,
	[email],
	function (error, results, fields) {
		if (error) {
			console.log(error.message)
			res.render("reset", {message: error})
		}
		else if (results.length < 1) {
			res.render("reset", {message: "No user matches provided email!"})
		}
		else {
			tokenValue = generateToken()
			userId = results[0].id
			console.log("USER ID: "+ userId)
			console.log("userId TYPE" + typeof(userId))
			// email = results[0].email
			//generating token, storing it in db
			connection.query(`INSERT INTO reset_token (id, value, user_id)
			VALUES (null, ?, ?)`,
			[tokenValue, userId],
			function (error, results, fields) {
				if (error) {
					console.log(error.message)
					res.render("reset", {message: error.message})

				}
				else {
					console.log("Token generated succesfully.")
					res.render("reset", {message: "Email with reset token will be sent, when developer implements this function. For now, contact with service administration for further info."})

				}
			})
			//sending email on provided address
		}
	} )
})

app.get("/new_password", (req, res) => {
	res.render("new_password", {message: ""})
})

app.post("/new_password", (req, res) => {
	const password = req.body.password;
	const password_repeat = req.body.password_repeat;
	const token = req.body.token;

	if (password !== password_repeat){
		res.render("new_password", {message: "Passwords do not match!"})
	}
	else {
		connection.query(`SELECT user_id, expiry_datetime FROM reset_token WHERE value = ?;`,
		[token],
		function (error, results, fields) {
			if (error) {
				console.log(error);
				res.render("new_password", {message: error})
			}
			else if (results.length < 1) {
				res.render("new_password", {message: "Wrong token!"})
			}
			else if (results[0].expiry_datetime.getTime() < new Date){
				res.render("new_password", {message: "Reset token has expired!"})
			}
			else {
				expiryDatetime = results[0].expiry_datetime
				userId = results[0].user_id

				bcrypt.hash(password, 13)
					.then(hashedPassword => {
						connection.query(
							`UPDATE user SET password = ? WHERE id = ?;`,
							[hashedPassword, userId],
							function (error, results, fields) {
								if (error) {
									console.log(error.message)
									res.render("new_password", {message: error.message})
								}
								else {
									res.render("new_password", {message: "Password updated successfully!"})
								}
							})
						})
				// console.log("OK, "+ expiryDatetime.getTime())
			}
				
		
			
		})
	}
})

/* ======================== */
/* SERVER 					*/
/* ======================== */
app.listen(PORT, (error) => {
	if (!error)
		console.log(
			"Server is Successfully Running, and App is listening on port " + PORT
		);
	else console.log("Error occurred, server can't start", error);
});
