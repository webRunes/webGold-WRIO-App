import express from 'express';
import nconf from './utils/wrio_nconf.js';
import path from 'path';
import {utils} from './common'; const dumpError = utils.dumpError;
import BlockChain from './api/blockchainApi.js';
import {login as loginImp} from './common'; let {loginWithSessionId,getLoggedInUser,authS2S,wrioAdmin,wrap,wrioAuth} = loginImp;
import {ObjectID} from 'mongodb'
import WebGold from './ethereum/ethereum';
import BigNumber from 'bignumber.js';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import logger from 'winston';
import Const from '../constant.js';
import Donations from './models/donations.js';
import ejs from 'ejs';
import util from 'util';

//import setupIO from './notifications.js';
import {server,db,login} from './common';
import BlockChainRoute from './routes/blockchain.info.js';
import EthereumRoute from './routes/ethereum-route';
import UserStatsRoute from './routes/user-stats.js';
import CurrencyConverter from '../currency.js';
const converter = new CurrencyConverter();

logger.level = 'debug';
var app = null;

/**
 * Initialize server wrapper
 * @returns {App} app object after initialization
 */

async function init_serv() {
    if (app) return app;
    try {
        let app = await init();
        return app;
    } catch (e) {
        console.log("Caught error during server init");
        utils.dumpError(e);
        throw(e);
    }
}

/**
 * Initialize server
 * @returns {Promise} app object after initialization
 */

async function init() {
    app = express();
    app.override_session = {sid:null};
    let dbInstance =  await db.init();
    logger.log('info','Successfuly connected to Mongo');
    server.initserv(app,dbInstance);
    let httpServ = app.listen(nconf.get("server:port"));
    console.log('app listening on port ' + nconf.get('server:port') + '...');
    setup_server(dbInstance);
    setup_routes(dbInstance);
    return app;
}


const TEMPLATE_PATH = path.resolve(__dirname, '../client/views/');

function setup_server(db) {

    //For app pages
    app.set('view engine', 'ejs');
    app.set('views',path.resolve(__dirname, '../client/views/'));
    //app.use(express.static(path.join(TEMPLATE_PATH, '/')));
    const DOMAIN = nconf.get("db:workdomain");

    app.use((req,res,next)=> {  // stub for unit testing, we can override sessionID, if app.override_session is set
        if (app.override_session.sid) {
             req.sessionID = app.override_session.sid;
             logger.log('info',"Overriding session ID",app.override_session.sid);
        }
        return next();
    });





}
function setup_routes(db) {
    /*app.get('/', function (request, response) {
        response.sendFile(__dirname + '/hub/index.html');
    });*/
    app.get('/coinadmin', function (request, response) {
        response.sendFile(path.join(TEMPLATE_PATH, '/admin.html'));
    });

    app.get('/transactions', function (request, response) {
        response.sendFile(path.join(TEMPLATE_PATH,'/webgold-transactions.html'));
    });

    app.get('/wrg_faucet', function (request, response) {
        response.sendFile(path.join(TEMPLATE_PATH,'/get-wrg.html'));
    });

    app.get('/presale', (request, response) => response.sendFile(path.join(TEMPLATE_PATH, '/presale.html')));

    app.get('/add_funds', function (request, response) {
        let testnet = nconf.get('payment:ethereum:testnet');
        if (testnet) {
            response.sendFile(path.join(TEMPLATE_PATH,'/get-wrg.html'));
        } else {
            response.sendFile(path.join(TEMPLATE_PATH, '/index.html'));
        }

    });

    app.get('/sign_tx' ,wrioAuth, wrap(async function (request, response) {

        request.checkQuery('id', 'Invalid ID').isHexadecimal();
        let result = await request.getValidationResult();
        if (!result.isEmpty()) {
            response.status(400).send('There have been validation errors: ' + util.inspect(result.array()));
            return;
        }

        const d = await (new Donations()).get({
            _id: ObjectID(request.query.id)
        });

        if (!d) {
            response.status(400).send('Invalid ID');
        }

        console.log("=============================================",d);

        response.render('txsigner.ejs', {
            "tx":d.unsignedTX,
            "ethID": request.user.ethereumWallet
        });

    }));

    app.get('/create_wallet', function (request, response) {
        response.sendFile(path.join(TEMPLATE_PATH,'/createwallet.html'));
    });


    app.get('/add_funds_data', wrioAuth, async (request, response) => {
        var loginUrl =  nconf.get('loginUrl') || ("https://login"+nconf.get('server:workdomain')+'/');
        logger.log('info',"WEBGOLD:Add funds data");

        try {
            var user = request.user;
            if (user) {
                const bc = new BlockChain();
                const btc_rate = await bc.get_rates();
                const grammPrice = converter.grammPriceUSD;
                const btcToWrgRate = converter.getRate(grammPrice, btc_rate);
                const bitRate = converter.convertWRGtoBTC(new BigNumber(Const.WRG_UNIT),btcToWrgRate);
                response.json({
                    username: user.lastName,
                    loginUrl: loginUrl,
                    balance: user.balance,
                    btcExchangeRate: bitRate, // deprecated
                    exchangeRate: grammPrice, // deprecated
                    grammPriceUSD: grammPrice,
                    btcToWrgRate: btcToWrgRate
                });
            }
        } catch(e) {
            utils.dumpError(e);
            response.json({
                username: null,
                loginUrl: loginUrl,
                balance: null,
                exchangeRate: nconf.get('payment:WRGExchangeRate')
            });

        }
    });

    app.get('/get_user', wrioAuth, function (request, response) {
        logger.log('debug',"WEBGOLD:/get_user");
        response.json({'user': request.user});
    });

    app.get('/logoff', wrioAuth,function (request, response) {
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
    app.use('/assets', express.static(path.join(__dirname, '../client')));

    function setupDevServer () {
        const webpack = require('webpack');
        const webpackDevMiddleware = require('webpack-dev-middleware');
        let config = require('../../webpack.config');
        config.output.filename = 'client.js'; //override output filename
        config.output.path = '/';
        const compiler = webpack(config);


        app.use(webpackDevMiddleware(compiler,{
            publicPath: "/assets/",
            stats: {colors: true},
            watchOptions: {
                aggregateTimeout: 600,
                poll: true
            },
        }))
    }

    const localdev = nconf.get("db:workdomain") === '.wrioos.local';
    const isInTest = typeof global.it === 'function';

    if (localdev && !isInTest) {
        setupDevServer();
    }

    app.use('/', express.static(path.join(__dirname, '../../hub')));

    app.use(function (err, req, res, next) {
        console.log("Error catch middleware");
        dumpError(err);
        res.status(403).send("There was error processing your request");
    });


}

export default init_serv;