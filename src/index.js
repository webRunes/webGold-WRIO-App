import express from 'express';
import bodyParser from 'body-parser';
import nconf from './server/wrio_nconf.js';
import path from 'path';
import {dumpError} from './server/utils.js';
//import braintree from './server/braintree';
import BlockChainRoute from './server/blockchain.info';
import {BlockChain} from './server/blockchain.info';
import EthereumRoute from './server/ethereum-route';
import UserStatsRoute from './server/user-stats.js';

import {init} from './server/db';
import {loginWithSessionId,getLoggedInUser} from './server/wriologin';
import WebGold from './server/ethereum';
import BigNumber from 'bignumber.js';

import session from 'express-session';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import logger from 'winston';


logger.level = 'debug';
var app = express();
app.ready = () => {};
app.override_session = {sid:null};

app.use(function (request, response, next) {
    //logger.log('info',request);

    var host = request.get('origin');
    if (host == undefined) host = "";
    logger.debug('Origin host:',host);

    var domain = nconf.get("server:workdomain");
    domain = domain.replace(/\./g,'\\.')+'$';
    logger.debug('Domaintempl',domain);

    if (host.match(new RegExp(domain,'m'))) {
        response.setHeader('Access-Control-Allow-Origin', host);
        logger.log('debug',"Allowing CORS for ",host);
    } else {
        logger.log('debug','host not match');
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
    //app.use(express.static(path.join(TEMPLATE_PATH, '/')));

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



    app.use((req,res,next)=> {  // stub for unit testing, we can override sessionID, if app.override_session is set
        if (app.override_session.sid) {
             req.sessionID = app.override_session.sid;
             logger.log('info',"Overriding session ID",app.override_session.sid);
        }
        return next();
    });



}
function setup_routes(db) {
    app.get('/', function (request, response) {
        response.sendFile(__dirname + '/hub/index.htm');
    });
    app.get('/coinadmin', function (request, response) {
        logger.log('debug',request);
        response.sendFile(path.join(TEMPLATE_PATH, '/admin.htm'));
    });

    app.get('/transactions', function (request, response) {
        response.sendFile(__dirname + '/client/views/webgold-transactions.htm');
    });

    app.get('/add_funds', function (request, response) {
        response.sendFile(__dirname + '/client/views/index.htm');
    });

    app.get('/add_funds_data', async (request, response) => {
        var loginUrl =  nconf.get('loginUrl') || ("https://login"+nconf.get('server:workdomain')+'/');
        logger.log('debug',loginUrl);

        logger.log('info',"WEBGOLD:Add funds data");

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
            logger.log('error','WEBGOLD:User not found',e);
            response.json({
                username: null,
                loginUrl: loginUrl,
                balance: null,
                exchangeRate: nconf.get('payment:WRGExchangeRate')
            });

        }
    });

    app.get('/get_user', function (request, response) {
        logger.log('debug',"WEBGOLD:/get_user");
        loginWithSessionId(request.sessionID, (err, res) => {
            if (err) {
                logger.log('error','User not found');
                return response.sendStatus(404);
            }

            logger.log('info',res);
            response.json({'user': res});
        });
    });

    app.get('/logoff', function (request, response) {
        logger.log('debug',"Logoff called");
        response.clearCookie('sid', {'path': '/', 'domain': DOMAIN});
        response.redirect('/');
    });

    app.get('/callback', function (request, response) {
        logger.log('debug',"Our callback called");
        response.render('callback', {});
    });

    //app.use('/api/braintree/', braintree);
    app.use('/api/blockchain/',BlockChainRoute);
    app.use('/api/webgold/',EthereumRoute);
    app.use('/api/user/',UserStatsRoute);
    app.use('/assets', express.static(path.join(__dirname, '/client')));

    app.use(function (err, req, res, next) {
        dumpError(err);
        res.status(403).send("There was error processing your request");
    });


}

init()
    .then(function(db) {
        logger.log('info','Successfuly connected to Mongo');
        app.listen(nconf.get("server:port"));
        logger.log('info',"Web application opened.");
        setup_server(db);
        setup_routes(db);
        app.ready();
    })
    .catch(function(err) {
        logger.log('info','Error while init '+err);
    });

module.exports = app;