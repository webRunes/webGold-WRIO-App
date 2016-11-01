import express from 'express';
import bodyParser from 'body-parser';
import nconf from './wrio_nconf.js';
import path from 'path';
import {utils} from 'wriocommon'; const dumpError = utils.dumpError;
import BlockChainRoute from './blockchain.info';
import {BlockChain} from './blockchain.info';
import EthereumRoute from './ethereum-route';
import UserStatsRoute from './user-stats.js';
import {login as loginImp} from 'wriocommon'; let {loginWithSessionId,getLoggedInUser,authS2S,wrioAdmin,wrap,wrioAuth} = loginImp;
import WebGold from './ethereum';
import BigNumber from 'bignumber.js';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import logger from 'winston';
import Const from '../constant.js';
import setupIO from './notifications.js';
import {server,db,login} from 'wriocommon';

import CurrencyConverter from '../currency.js';
const converter = new CurrencyConverter();

logger.level = 'debug';
var app = express();
app.ready = () => {};
app.override_session = {sid:null};


async function init_env() {
    try {
        await init();
    } catch (e) {
        console.log("Caught error during server init");
        utils.dumpError(e);
    }
}

async function init() {
    let dbInstance =  await db.init();
    logger.log('info','Successfuly connected to Mongo');
    server.initserv(app,dbInstance);
    let httpServ = app.listen(nconf.get("server:port"));
    console.log('app listening on port ' + nconf.get('server:port') + '...');
    setup_server(dbInstance);
    setup_routes(dbInstance);
    setupIO(httpServ,dbInstance);
    app.ready();
}

init_env();

const TEMPLATE_PATH = path.resolve(__dirname, '../client/views/');

function setup_server(db) {

    //For app pages
  //  app.set('view engine', 'ejs');
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

    app.get('/sign_tx', function (request, response) {
        response.sendFile(path.join(TEMPLATE_PATH, '/txsigner.html'));
    });

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
    app.use('/', express.static(path.join(__dirname, '../hub')));

    app.use(function (err, req, res, next) {
        utils.dumpError(err);
        res.status(403).send("There was error processing your request");
    });


}

module.exports = app;