import express from 'express';
import bodyParser from 'body-parser';
import nconf from './server/wrio_nconf.js';
import path from 'path';
//import braintree from './server/braintree';
import blockchain from './server/blockchain.info'
import ethereum_route from './server/ethereum-route'
import {init} from './server/db';
import {loginWithSessionId} from './server/wriologin'

import session from 'express-session'
import cookieParser from 'cookie-parser'
import MongoStore from 'connect-mongo'

var app = express();
app.ready = function () {};

const TEMPLATE_PATH = path.resolve(__dirname, 'client/views/');

function setup_server(db) {

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true}));



//For app pages
	app.set('view engine', 'ejs');
	app.use(express.static(path.join(TEMPLATE_PATH, '/')));

	const DOMAIN = nconf.get("db:workdomain");

	var SessionStore = MongoStore(session);
	var cookie_secret = nconf.get("server:cookiesecret");
	app.use(cookieParser(cookie_secret));
	var sessionStore = new SessionStore({db: db});
	app.use(session(
		{

			secret: cookie_secret,
			saveUninitialized: true,
			store: sessionStore,
			resave: true,
			cookie: {
				secure: false,
				domain: DOMAIN,
				maxAge: 1000 * 60 * 60 * 24 * 30
			},
			key: 'sid'
		}
	));
}
function setup_routes() {
	app.get('/', function (request, response) {
		response.sendFile(path.join(TEMPLATE_PATH, '/index.htm'));
	});
	app.get('/coinadmin', function (request, response) {
		response.sendFile(path.join(TEMPLATE_PATH, '/admin.html'));
	});

	app.get('/add_funds', function (request, response) {
		response.sendFile(__dirname + '/client/views/index.html');
	});

	app.get('/add_funds_data', (request, response) => {
		console.log("WEBGOLD:Add funds data");
		loginWithSessionId(request.sessionID, (err, res) => {
			if (err) {
				console.log('WEBGOLD:User not found');
				response.json({
					username: null,
					loginUrl: nconf.get('loginUrl'),
					balance: null,
					exchangeRate: nconf.get('payment:WRGExchangeRate')
				});
				return;
			}

			if (res) {
				response.json({
					username: res.lastName,
					loginUrl: nconf.get('loginUrl'),
					balance: res.balance,
					exchangeRate: nconf.get('payment:WRGExchangeRate')
				});
			} else {
				response.json({
					error:"not logged in"
				})
			}

		});
	});

	app.get('/get_user', function (request, response) {
		console.log("WEBGOLD:/get_user");
		loginWithSessionId(request.sessionID, (err, res) => {
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

	//app.use('/api/braintree/', braintree);
	app.use('/api/blockchain/',blockchain);
	app.use('/api/webgold/',ethereum_route);
	app.use('/assets', express.static(path.join(__dirname, '/client')));
}

init()
	.then(function(db) {
		console.log('Successfuly connected to Mongo');
		app.listen(nconf.get("server:port"));
		console.log("Web application opened.");
		setup_server(db);
		setup_routes();
		app.ready();
	})
	.catch(function(err) {
		console.log('Error while init '+err);
	});

module.exports = app;