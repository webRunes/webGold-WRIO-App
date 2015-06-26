"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _serverWrio_mysqlJs = require("./server/wrio_mysql.js");

var _serverWrio_mysqlJs2 = _interopRequireDefault(_serverWrio_mysqlJs);

var _serverStripe = require("./server/stripe");

var _serverStripe2 = _interopRequireDefault(_serverStripe);

var app = require("../wrio_app.js").init(_express2["default"]);
var nconf = require("./server/wrio_nconf.js");
var server = require("http").createServer(app).listen(nconf.get("server:port"));

require("../wrio_transactions.js")(app, nconf, _serverWrio_mysqlJs2["default"]);

var session = require("express-session");
var SessionStore = require("express-mysql-session");
var cookieParser = require("cookie-parser");
var wrioLogin = require("./server/wriologin");

var BASEDIR_PATH = _path2["default"].dirname(require.main.filename);

//For app pages
app.set("view engine", "ejs");
app.use(_express2["default"]["static"](_path2["default"].join(BASEDIR_PATH, "/")));

var MYSQL_HOST = nconf.get("db:host");
var MYSQL_USER = nconf.get("db:user");
var MYSQL_PASSWORD = nconf.get("db:password");
var MYSQL_DB = nconf.get("db:dbname");
var DOMAIN = nconf.get("db:workdomain");

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
app.use(session({
	secret: cookie_secret,
	saveUninitialized: true,
	store: sessionStore,
	resave: true,
	cookie: {
		secure: false,
		domain: DOMAIN,
		maxAge: 1000 * 60 * 24 * 30
	},
	key: "sid"
}));

app.get("/", function (request, response) {
	response.sendFile(_path2["default"].join(BASEDIR_PATH, "/index.htm"));
});

app.get("/add_funds", function (request, response) {
	response.sendFile(__dirname + "/client/views/index.html");
});

app.get("/add_funds_data", function (request, response) {
	wrioLogin.loginWithSessionId(request.sessionID, function (err, res) {
		if (err) {
			console.log("User not found");
			response.json({
				username: null,
				loginUrl: nconf.get("loginUrl"),
				balance: null,
				exchangeRate: nconf.get("payment:WRGExchangeRate")
			});
			return;
		}

		response.json({
			username: res.lastName,
			loginUrl: nconf.get("loginUrl"),
			balance: res.balance,
			exchangeRate: nconf.get("payment:WRGExchangeRate")
		});
	});
});

app.get("/get_user", function (request, response) {
	wrioLogin.loginWithSessionId(request.sessionID, function (err, res) {
		if (err) {
			console.log("User not found");
			return response.sendStatus(404);
		}

		console.log(res);
		response.json({ "user": res });
	});
});

app.get("/logoff", function (request, response) {
	console.log("Logoff called");
	response.clearCookie("sid", { "path": "/", "domain": DOMAIN });
	response.redirect("/");
});

app.get("/callback", function (request, response) {
	console.log("Our callback called");
	response.render("callback", {});
});

app.use("/api/stripe", _serverStripe2["default"]);
app.use("/assets", _express2["default"]["static"](_path2["default"].join(__dirname, "/client")));

console.log("Web application opened.");