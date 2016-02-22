/**
 * Created by michbil on 26.09.15.
 */
/**
 * Created by michbil on 26.09.15.
 */

import WebGold from './ethereum.js';
import {calc_percent,dumpError} from './utils';
import {Promise} from 'es6-promise';
import {Router} from 'express';
import {loginWithSessionId,getLoggedInUser,authS2S,wrioAuth,wrap} from './wriologin';
import db from './db';
const router = Router();
import WebRunesUsers from './dbmodels/wriouser';
import nconf from './wrio_nconf';
import BigNumber from 'bignumber.js';
import Donations from './dbmodels/donations.js';
import Emissions from './dbmodels/emissions.js';
import EtherFeeds from './dbmodels/etherfeed.js';
import Invoices from "./dbmodels/invoice.js";
import WrioUser from "./dbmodels/wriouser.js";
import AdminRoute from './admin/route.js';
import DonateProcessor from './DonateProcessor.js';

import logger from 'winston';



let wei = 1000000000000000000;
let min_amount = 0.02; //0.002// ETH, be sure that each ethereum account has this minimal value to have ability to perform one transaction

let masterAccount = nconf.get("payment:ethereum:masterAdr");
let masterPassword = nconf.get("payment:ethereum:masterPass");
if (!masterAccount) {
    throw new Error("Can't get master account address from config.json");
}
if (!masterPassword) {
    throw new Error("Can't get master account password from config.json");
}


router.get('/free_wrg',wrioAuth, wrap(async (request,response) => {  // TODO: remove this method

    if (nconf.get('server:workdomain') !== '.wrioos.local') {
        logger.error("  ===== LOG FORBIDDEN ACTION DETECTED!!! =====");
        response.status(404).send('Not found');
        return;
    }
    logger.error("  =====  WARNING: FREE WRG CALLED, ONLY FOR DEBUGGING PURPOSES ====  ");

    var amount = parseInt(request.query.amount);
    logger.debug(typeof amount);
    if (typeof amount !== "number") {
        throw new Error("Can't parse amount");
    }

    amount *= 100;

    var user = request.user;
    var webGold = new WebGold(db.db);
    await webGold.emit(user.ethereumWallet, amount, user.wrioID);
    response.send("Successfully sent " + amount);

}));


/*
    Donate API request
    parameters to: recipient WRIO-ID
    amount: amount to donate, in WRG
    sid: user's session id

 */

router.get('/donate', authS2S, wrap(async (request,response) => {
    var to = request.query.to;
    var from = request.query.from;
    var amount = request.query.amount;

    var donate = new DonateProcessor(to,from,amount);
    if (!(await donate.verifyDonateParameters())) {
        logger.error("Verify failed");
        return response.status(403).send("Wrong donate parameters");
    }
    response.send(await donate.process());

}));

router.post('/get_balance', wrioAuth, wrap(async (request,response) => {

    var user = request.user;
    var dbBalance = 0;
    if (user.dbBalance) {
        dbBalance = user.dbBalance / 100;
    }
    logger.debug("balance from db:", dbBalance);

    var webGold = new WebGold(db.db);
    var dest = await webGold.getEthereumAccountForWrioID(user.wrioID);
    var balance = await webGold.getBalance(dest) / 100;
    var bal = balance - dbBalance;


    //logger.debug("balance:",balance.add(dbBalance).toString());
    response.send({
        "balance": bal,
        "promised": dbBalance,
        "blockchain": balance
    });

    await webGold.processPendingPayments(user);

}));


router.post('/get_exchange_rate', wrioAuth, async (request,response) => {
  response.send("10");
});

router.use('/coinadmin',AdminRoute);


export default router;