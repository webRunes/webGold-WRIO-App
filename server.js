var express = require('express');
var app = require("./wrio_app.js").init(express);
var nconf = require("./wrio_nconf.js").init();
var server = require('http').createServer(app).listen(nconf.get("server:port"));
var url = '/api/stripe';
//Main Files - Don't Change sequence/position.

var connection = require("./wrio_mysql.js").init(nconf);

// For sending email
//app.set('view engine', 'jade');
var stripe = require('stripe')(nconf.get('payment:stripe1:secreteKey'));

var mailer = require("./wrio_mailer.js").init(app, nconf);
require("./wrio_transactions.js")(app, nconf, connection);

var session = require('express-session');
var SessionStore = require('express-mysql-session');
var cookieParser = require('cookie-parser');
var wrioLogin = require('./wriologin');

//For app pages
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/'));

MYSQL_HOST = nconf.get("db:host");
MYSQL_USER = nconf.get("db:user");
MYSQL_PASSWORD = nconf.get("db:password");
MYSQL_DB = nconf.get("db:dbname");
DOMAIN = nconf.get("db:workdomain");

var session_options = {
		host: MYSQL_HOST,
		port: 3306,
		user: MYSQL_USER,
		password: MYSQL_PASSWORD,
		database: MYSQL_DB
};

var cookie_secret = nconf.get("server:cookiesecret");
var sessionStore = new SessionStore(session_options);
app.use(cookieParser(cookie_secret));
app.use(session(
	{
			secret: cookie_secret,
			saveUninitialized: true,
			store: sessionStore,
			resave: true,
			cookie: {
					secure: false,
					domain: DOMAIN,
					maxAge: 1000 * 60 * 24 * 30
			},
			key: 'sid'
	}
));

app.get('/', function(request, response) {
	response.sendFile(__dirname + '/index.htm');	
});

app.get('/add_funds', function(request, response) {
		//console.log(request.sessionID);
		wrioLogin.loginWithSessionId(request.sessionID, function(err, res) {
				if (err) {
						console.log("User not found")
						response.render('index.ejs', {"error": "Not logged in", "user": undefined});
				} else {
						response.render('index.ejs', {"user": res});
						console.log(res);
				}
		})
});


app.get('/logoff', function(request, response) {
		console.log("Logoff called");
		response.clearCookie('sid', {'path': '/', 'domain': DOMAIN});
		response.redirect('/');

});

app.get('/callback', function(request, response) {
		console.log("Our callback called");
		response.render('callback', {});
});

app.post(url + '/donate', function(request, response) {
		wrioLogin.loginWithSessionId(request.sessionID, function(err, User) {
				if (err) {
						console.log("User not found")
						response.render('index.ejs', {"error": "Not logged in", "user": undefined});
				} else {
						var chargeData = {
								amount: request.body.amount * 100,
								currency: 'usd',
								card: request.body.stripeToken,
								description: 'Donatation for WRIO'
						}
						var userId = User.userID;
						stripe.charges.create(chargeData, function(error, charge) {
							if (error) {
								console.log("Create charge error: ", error);
								return response.json(error.message);
							}
							response.json(charge);
							var flagCharge = (charge != null);
							if (flagCharge) {
									var transactionId = "id" in charge;
									if (transactionId) {
											var query = 'INSERT INTO webRunes_webGold (TransactionId, Amount , Added, UserId ) values ( ?,?,NOW(),? )';
											var amountInWRG = 100 * charge.amount / nconf.get('payment:WRGExchangeRate');
											connection.query(query, [charge.id, amountInWRG, userId], function(error, result) {
													return console.log(error);
											});
									} else {
											return response.json(error.message);
									}
							} else {
									return response.json({"message": "Fail to charge."});
							}
						});
				}
		})
});

app.post(url + '/withdraw', function(request, response) {
		var ssid = request.sessionID;
		var query = 'INSERT INTO webRunes_webGold_withdraw (Amount , Added, UserId ) values (?,NOW(),? )';
		connection.query(query, [request.body.amount, ssid], function(error, result) {
		});
});
app.post(url + '/sendemail', function(request, response) {
		//console.log(request.body)
		app.mailer.send('email', {
				to: request.body.to,
				subject: request.body.subject,
				message: request.body.message
		}, function(error) {
				if (error) {
						response.send('There was an error sending the email');
						return;
				}
				response.send('Email Sent');
		});
});
console.log("Web application opened.");