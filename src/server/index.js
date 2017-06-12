const express = require('express');
const nconf = require('./utils/wrio_nconf.js');
const path = require('path');
const {dumpError} = require('wriocommon').utils;
const {loginWithSessionId,getLoggedInUser,authS2S,wrioAdmin,wrap,restOnly,wrioAuth} = require('wriocommon').login;
const {ObjectID} = require('mongodb');
const BigNumber = require('bignumber.js');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const logger = require('winston');
const Const = require('../constant.js');


const ejs = require('ejs');
const util = require('util');

//const setupIO = require('./notifications.js');
const {server,db,login} = require('wriocommon');
const CurrencyConverter = require('../currency.js');
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
        dumpError(e);
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



    const validator = require('express-validator');
    app.use(validator());

    //For app pages
    app.set('view engine', 'ejs');
    app.set('views',path.resolve(__dirname, '../client/views/'));
    //app.use(express.static(path.join(TEMPLATE_PATH, '/')));
   

    app.use((req,res,next)=> {  // stub for unit testing, we can override sessionID, if app.override_session is set
        if (app.override_session.sid) {
             req.sessionID = app.override_session.sid;
             logger.log('info',"Overriding session ID",app.override_session.sid);
        }
        return next();
    });





}
function setup_routes(db) {

    const Donations = require('./models/donations.js');
    const BlockChain = require('./api/blockchainApi.js');

    const BlockChainRoute = require('./routes/blockchain.info.js');
    const EthereumRoute = require('./routes/ethereum-route');
    const UserStatsRoute = require('./routes/user-stats.js');

    const DOMAIN = nconf.get("db:workdomain");
    const staticDomain = {domain: (DOMAIN === '.wrioos.local') ? '//localhost:3033/' : '//wrioos.local/'};
    
    app.get('/coinadmin',     (req, res) => res.render('admin.ejs',staticDomain));
    app.get('/transactions',  (req, res) => res.render('transactions.ejs',staticDomain));
    app.get('/wrg_faucet',             (req, res) => res.sendFile(path.join(TEMPLATE_PATH,'/get-wrg.html')));
    app.get('/presale',                (req, res) =>   res.render('presale.ejs',staticDomain));
    app.get('/create_wallet',wrioAuth, (req, res) => {
        res.render('createwallet.ejs',{
            domain: staticDomain.domain,
            wrioID:req.user.wrioID
        })
    });

    /*app.get('/add_funds', function (request, response) {
        let testnet = nconf.get('payment:ethereum:testnet');
        if (testnet) {
            response.sendFile(path.join(TEMPLATE_PATH,'/get-wrg.html'));
        } else {
            response.sendFile(path.join(TEMPLATE_PATH, '/index.html'));
        }

    });*/

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
            domain: staticDomain.domain,
            "tx": d.unsignedTX,
            "to":d.destWrioID,
            "amount":d.amount,
            "wrioID":request.user.wrioID,
            "ethID": request.user.ethereumWallet
        });

    }));

   


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
            dumpError(e);
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


    const localdev = nconf.get("db:workdomain") === '.wrioos.local';
    const isInTest = typeof global.it === 'function';

    app.use('/', express.static(path.join(__dirname, '../../hub')));

    app.use(function (err, req, res, next) {
        console.log("Error catch middleware");
        dumpError(err);
        res.status(403).send("There was error processing your request");
    });


}

module.exports = init_serv;