import express from 'express';
import bodyParser from 'body-parser';
import nconf from './server/wrio_nconf.js';
import path from 'path';
import {utils} from 'wriocommon'; const dumpError = utils.dumpError;
import BlockChainRoute from './server/blockchain.info';
import {BlockChain} from './server/blockchain.info';
import EthereumRoute from './server/ethereum-route';
import UserStatsRoute from './server/user-stats.js';

import {login as loginImp} from 'wriocommon'; let {loginWithSessionId,getLoggedInUser,authS2S,wrioAdmin,wrap,wrioAuth} = loginImp;
import WebGold from './server/ethereum';
import BigNumber from 'bignumber.js';

import session from 'express-session';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import logger from 'winston';
import Const from './constant.js';

import {server,db,login} from 'wriocommon';

require("babel/polyfill");

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
    var dbInstance =  await db.init();
    logger.log('info','Successfuly connected to Mongo');
    server.initserv(app,dbInstance);
    app.listen(nconf.get("server:port"));
    console.log('app listening on port ' + nconf.get('server:port') + '...');
    setup_server(dbInstance);
    setup_routes(dbInstance);
    app.ready();
}

init_env();

const TEMPLATE_PATH = path.resolve(__dirname, 'client/views/');

function setup_server(db) {

    //For app pages
    app.set('view engine', 'ejs');
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
        response.sendFile(__dirname + '/client/views/webgold-transactions.html');
    });

    app.get('/add_funds', function (request, response) {
        response.sendFile(__dirname + '/client/views/index.html');
    });

    app.get('/sign_tx', function (request, response) {
        response.sendFile(__dirname + '/client/views/txsigner.html');
    });

    app.get('/create_wallet', function (request, response) {
        response.sendFile(__dirname + '/client/views/createwallet.html');
    });


    app.get('/add_funds_data', wrioAuth, async (request, response) => {
        var loginUrl =  nconf.get('loginUrl') || ("https://login"+nconf.get('server:workdomain')+'/');
        logger.log('info',"WEBGOLD:Add funds data");

        try {
            var user = request.user;
            if (user) {
                var bc = new BlockChain();
                var btc_rate = await bc.get_rates();
                var wg = new WebGold(db);
                var bitRate = wg.convertWRGtoBTC(new BigNumber(Const.WRG_UNIT),btc_rate);
                response.json({
                    username: user.lastName,
                    loginUrl: loginUrl,
                    balance: user.balance,
                    exchangeRate: nconf.get('payment:WRGExchangeRate'),
                    btcExchangeRate: bitRate
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
    app.use('/assets', express.static(path.join(__dirname, '/client')));
    app.use('/', express.static(path.join(__dirname, '/hub')));

    app.use(function (err, req, res, next) {
        utils.dumpError(err);
        res.status(403).send("There was error processing your request");
    });


}

module.exports = app;