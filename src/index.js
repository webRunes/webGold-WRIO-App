import express from 'express';
import bodyParser from 'body-parser';
import nconf from './server/wrio_nconf.js';
import path from 'path';
import stripe from './server/stripe';
import {init} from './server/db';

var app = express();
var wrioLogin;
function setup_server(db) {


	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true}));

	var session = require('express-session');
	var SessionStore = require('connect-mongo')(session);
	var cookieParser = require('cookie-parser');
	wrioLogin = require('./server/wriologin');

	const BASEDIR_PATH = path.dirname(require.main.filename);

//For app pages
	app.set('view engine', 'ejs');
	app.use(express.static(path.join(BASEDIR_PATH, '/')));

	const DOMAIN = nconf.get("db:workdomain");

	var cookie_secret = nconf.get("server:cookiesecret");
	var sessionStore = new SessionStore({db: db});
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
}
function setup_routes() {
	app.get('/', function (request, response) {
		response.sendFile(path.join(BASEDIR_PATH, '/index.htm'));
	});

	app.get('/add_funds', function (request, response) {
		response.sendFile(__dirname + '/client/views/index.html');
	});

	app.get('/add_funds_data', (request, response) => {
		wrioLogin.loginWithSessionId(request.sessionID, (err, res) => {
			if (err) {
				console.log('User not found');
				response.json({
					username: null,
					loginUrl: nconf.get('loginUrl'),
					balance: null,
					exchangeRate: nconf.get('payment:WRGExchangeRate')
				});
				return;
			}

			response.json({
				username: res.lastName,
				loginUrl: nconf.get('loginUrl'),
				balance: res.balance,
				exchangeRate: nconf.get('payment:WRGExchangeRate')
			});
		});
	});

	app.get('/get_user', function (request, response) {
		wrioLogin.loginWithSessionId(request.sessionID, (err, res) => {
			if (err) {
				console.log('User not found');
				return response.sendStatus(404);
			}

			console.log(res);
			response.json({'user': res});
		});
	});

	app.get('/logoff', function (request, response) {
		console.log("Logoff called");
		response.clearCookie('sid', {'path': '/', 'domain': DOMAIN});
		response.redirect('/');
	});

	app.get('/callback', function (request, response) {
		console.log("Our callback called");
		response.render('callback', {});
	});

	app.use('/api/stripe', stripe);
	app.use('/assets', express.static(path.join(__dirname, '/client')));
}

init()
	.then(function(db) {
		console.log('Successfuly connected to Mongo');
		app.listen(nconf.get("server:port"));
		console.log("Web application opened.");
		setup_server(db);
		setup_routes();
	})
	.catch(function(err) {
		console.log('Error while init '+err);
	});

