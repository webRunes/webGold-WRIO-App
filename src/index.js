import express from 'express';
import bodyParser from 'body-parser';
import nconf from './server/wrio_nconf.js';
import path from 'path';
//import braintree from './server/braintree';
import blockchain from './server/blockchain.info'
import {BlockChain} from './server/blockchain.info'
import ethereum_route from './server/ethereum-route'
import {init} from './server/db';
import {loginWithSessionId,getLoggedInUser} from './server/wriologin'
import WebGold from './server/ethereum'
import BigNumber from 'bignumber.js';

import session from 'express-session'
import cookieParser from 'cookie-parser'
import MongoStore from 'connect-mongo'

var app = express();
app.ready = () => {};

app.use(function (request, response, next) {
	//console.log(request);

	var host = request.get('origin');
	if (host == undefined) host = "";
	console.log(host);

	var domain = nconf.get("server:workdomain");
	domain = domain.replace(/\./g,'\\.')+'$';
	console.log(domain);

	if (host.match(new RegExp(domain,'m'))) {
		response.setHeader('Access-Control-Allow-Origin', host);
		console.log("Allowing CORS for webrunes domains");
	} else {
		console.log('host not match');
	}

	//response.setHeader('Access-Control-Allow-Origin', '*');
	response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	response.setHeader('Access-Control-Allow-Credentials', true);
	next();
});


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
function setup_routes(db) {
	app.get('/', function (request, response) {
		response.sendFile(path.join(TEMPLATE_PATH, '/index.htm'));
	});
	app.get('/coinadmin', function (request, response) {
		response.sendFile(path.join(TEMPLATE_PATH, '/admin.html'));
	});

	app.get('/add_funds', function (request, response) {
		response.sendFile(__dirname + '/client/views/index.html');
	});

	app.get('/add_funds_data', async (request, response) => {
		var loginUrl =  nconf.get('loginUrl') || ("//login"+nconf.get('server:workdomain')+'/');
		console.log(loginUrl);

		console.log("WEBGOLD:Add funds data");

		try {
			var user = await getLoggedInUser(request.sessionID);

			if (user) {
				var bc = new BlockChain();
				var btc_rate = await bc.get_rates();
				var wg = new WebGold(db);
				var bitRate = wg.convertWRGtoBTC(new BigNumber(10000),btc_rate);
				response.json({
					username: user.lastName,
					loginUrl: loginUrl,
					balance: user.balance,
					exchangeRate: nconf.get('payment:WRGExchangeRate'),
					btcExchangeRate: bitRate
				});
			}


		} catch(e) {
			console.log('WEBGOLD:User not found',e);
			response.json({
				username: null,
				loginUrl: loginUrl,
				balance: null,
				exchangeRate: nconf.get('payment:WRGExchangeRate')
			});

		}



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
		setup_routes(db);
		app.ready();
	})
	.catch(function(err) {
		console.log('Error while init '+err);
	});

module.exports = app;