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
import {login as loginImp} from 'wriocommon'; let {loginWithSessionId,getLoggedInUser,authS2S,wrioAdmin,wrap,wrioAuth,restOnly} = loginImp;
import {db as dbMod} from 'wriocommon';var db = dbMod.db;
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
import {TransactionSigner} from './DonateProcessor.js';
import Const from '../constant.js';
import logger from 'winston';




let wei = Const.WEI;
let min_amount = Const.MIN_ETH_AMOUNT; //0.002// ETH, be sure that each ethereum account has this minimal value to have ability to perform one transaction

let masterAccount = nconf.get("payment:ethereum:masterAdr");
let masterPassword = nconf.get("payment:ethereum:masterPass");
if (!masterAccount) {
    throw new Error("Can't get master account address from config.json");
}
if (!masterPassword) {
    throw new Error("Can't get master account password from config.json");
}

router.get('/giveaway',wrioAuth, wrap(async (request,response) => {  // TODO: remove this method

    if (nconf.get('server:workdomain') !== '.wrioos.local') {
        logger.error("  ===== LOG FORBIDDEN ACTION DETECTED!!! =====");
        response.status(404).send('Not found');
        return;
    }
    logger.error("  =====  WARNING: GIVEAWAY CALLED, ONLY FOR DEBUGGING PURPOSES ====  ");
    var user = request.user;
    var webGold = new WebGold(db.db);
    await webGold.unlockByWrioID(user.wrioID); // TODO request user sign transaction
    await webGold.giveAwayEther(user.ethereumWallet);
    response.send("Successfully given away");
}));

router.get('/free_wrg',wrioAuth, wrap(async (request,response) => {  // TODO: remove this method

    if (nconf.get('server:workdomain') !== '.wrioos.local') {
        logger.error("  ===== LOG FORBIDDEN ACTION DETECTED!!! =====");
        response.status(404).send('Not found');
        return;
    }
    logger.error("  =====  WARNING: FREE WRG CALLED, ONLY FOR DEBUGGING PURPOSES ====  to user", user);

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

   Should implement two stage donate process
   STAGE1 - get donation parameters, return transaction to sign
   STAGE2 - get signed donation, execute donation on the blockchain


 */

router.get('/get_wallet', restOnly, wrioAuth, wrap(async(request,response) => {
    var user = request.user;
    if (user.ethereumWallet) {
        return response.send(user.ethereumWallet);
    } else {
        return response.status(403).send("User don't have ethereum wallet yet");
    }

}));


router.post('/save_wallet', restOnly, wrioAuth, wrap(async(request,response) => {
    let wallet = request.query.wallet;

    if (!wallet) { // TODO: validate vallet there
        return response.status(403).send("Wrong parameters");
    }
    var user = request.user;

    if (user.ethereumWallet) {
        return response.status(403).send("User already have ethereum wallet, aborting");
    }
    var Users = new WrioUser();
    await Users.updateByWrioID(user.wrioID,{
        ethereumWallet: wallet
    });
    response.send("Success");

}));

router.get('/signtx', restOnly, wrioAuth, wrap(async (request,response) => {
    const tx = request.query.tx;
    let signer = new TransactionSigner(tx);
    response.send(await signer.process());

}));


router.get('/donate', authS2S, wrap(async (request,response) => {
    var to = request.query.to;
    var from = request.query.from;
    var amount = request.query.amount;
    var tx = request.query.tx;

    var donate = new DonateProcessor(to,from,amount,tx);
    if (!(await donate.verifyDonateParameters())) {
        logger.error("Verify failed");
        return response.status(403).send("Wrong donate parameters");
    }
    response.send(await donate.process());

}));

router.get('/get_balance', restOnly, wrioAuth, wrap(async (request,response) => {

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


    await webGold.processPendingPayments(user);

    //logger.debug("balance:",balance.add(dbBalance).toString());
    response.send({
        "balance": bal,
        "promised": dbBalance,
        "blockchain": balance
    });



}));


router.get('/get_exchange_rate', restOnly, wrioAuth, async (request,response) => {
  response.send("10");
});

router.use('/coinadmin',AdminRoute);


export default router;