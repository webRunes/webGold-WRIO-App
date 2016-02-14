/**
 * Created by michbil on 26.09.15.
 */
/**
 * Created by michbil on 26.09.15.
 */

import WebGold from './ethereum.js';
import {calc_percent,dumpError} from './utils';
import Web3 from 'web3'; var web3 = new Web3();
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
import logger from 'winston';


let MAX_DEBT = -500*100; // maximum allowed user debt to perfrm operations

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


router.get('/free_wrg',wrap(async (request,response) => {  // TODO: remove this method
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
    // TODO really BIG function!!! refactor it to few less or the class
    var to = request.query.to;
    var from = request.query.from;
    var amount = parseInt(request.query.amount) * 100;
    if (typeof amount !== "number") {
        throw new Error("Can't parse amount");
    }
    if (amount < 0) {
        throw new Error ("Amount can't be negative");
    }
    var userObj = new WrioUser();

    var user = await userObj.getByWrioID(from);
    if (!user) throw new Error("User not registered");

    var webGold = new WebGold(db.db);

    var dest = await webGold.getEthereumAccountForWrioID(to); // ensure that source adress and destination adress have ethereum adress
    var src = await webGold.getEthereumAccountForWrioID(user.wrioID);

    if (dest === src) {
        throw new Error("Can't donate to itself");
    }

    var dbBalance = user.dbBalance || 0;
    var blockchainBalance = await webGold.getBalance(src);
    blockchainBalance = blockchainBalance.toString();

    logger.debug("Checking balance before donation",amount,blockchainBalance);

    if (amount > blockchainBalance) {
        // Do virtual payment to the database record because user has insufficient funds
        // when funds arrive on the account, pending payments will be done

        var debt = dbBalance-amount;

        logger.debug("CALCULATED DEBT:",debt);

        if (debt > MAX_DEBT ) { // check if we havent reached maximum debt limit
            throw new Error("Insufficient funds");
        }
        await userObj.createPrepayment(user.wrioID,-amount,to);
        logger.info("Prepayment made");

    } else {
        // Make the real payment through the blockchain
       await webGold.makeDonate(user, to, amount);

    }
    var amountUser = amount*calc_percent(amount)/100;
    var fee = amount - amountUser;


    response.send({
        "success":true,
        "dest":dest,
        "src":src,
        amount:amount,
        amountUser: amountUser,
        fee:fee,
        feePercent:calc_percent(amount)
    });
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