/**
 * Created by michbil on 12.01.17.
 */

import WebGold from '../ethereum/ethereum.js';
import {formatBlockUrl} from '../utils/utils';
import {db as dbMod} from '../common';var db = dbMod.db;
import WebRunesUsers from '../models/wriouser';
import nconf from '../utils/wrio_nconf';
import BigNumber from 'bignumber.js';
import Donations from '../models/donations.js';
import Emissions from '../models/emissions.js';
import EtherFeeds from '../models/etherfeed.js';
import Invoices from "../models/invoice.js";
import WrioUser from "../models/wriouser.js";

import DonateProcessor from '../ethereum/DonateProcessor.js';
import {TransactionSigner} from '../ethereum/DonateProcessor.js';
import Const from '../../constant.js';
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


export const giveaway = async (request,response) => {  // TODO: remove this method

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
};

export const free_wrg = async (request,response) => {  // TODO: remove this method

    setTimeout(async () => { // SAFETY DELAY TO PREVENT MULTIPLE EMISSIONS
        let user = request.user;
        logger.error("  =====  WARNING: FREE WRG CALLED, SHOULD BE USED ONLY ON TESTNET ====  to user", user);

        let emissions = new Emissions();
        if (await emissions.haveRecentEmission(user,1)) { // allom emission every hour
            return response.status(403).send("Please wait");
        };

        let amount = 10 * 100; // We can give 10 WRG every hour

        let webGold = new WebGold(db.db);
        const txId = await webGold.emit(user.ethereumWallet, amount, user.wrioID);
        const txUrl = formatBlockUrl(txId);
        response.send(`<html><body>Successfully sent ${amount}, transaction hash <a href="${txUrl}">${txId} </a></html></body>"`);
    },3000);


};

export const get_wallet = async(request,response) => {
    var user = request.user;
    if (user.ethereumWallet) {
        return response.send(user.ethereumWallet);
    } else {
        return response.status(403).send("User don't have ethereum wallet yet");
    }

};

export const save_wallet = async(request,response) => {
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

};

export const sign_tx = async (request,response) => {
    const tx = request.query.tx;
    let signer = new TransactionSigner(tx);
    response.send(await signer.process());

};


/*
 Donate API request
 parameters to: recipient WRIO-ID
 amount: amount to donate, in WRG
 sid: user's session id

 Should implement two stage donate process
 STAGE1 - get donation parameters, return transaction to sign
 STAGE2 - get signed donation, execute donation on the blockchain


 */

export const donate = async (request,response) => {
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

};

export const get_balance = async (request,response) => {

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

};

export const get_exchange_rate = async (request,response) => {
    response.send("10");
};