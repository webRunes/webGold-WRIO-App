/**
 * Created by michbil on 26.09.15.
 */
/**
 * Created by michbil on 26.09.15.
 */

import WebGold from '../ethereum.js';
import {calc_percent,dumpError} from '../utils';
import {Promise} from 'es6-promise';
import {Router} from 'express';
import {loginWithSessionId,getLoggedInUser,authS2S,wrioAdmin,wrap} from '../wriologin';
import db from '../db';
const router = Router();
import WebRunesUsers from '../dbmodels/wriouser';
import nconf from '../wrio_nconf';
import BigNumber from 'bignumber.js';
import Donations from '../dbmodels/donations.js';
import Emissions from '../dbmodels/emissions.js';
import EtherFeeds from '../dbmodels/etherfeed.js';
import Invoices from "../dbmodels/invoice.js";
import WrioUser from "../dbmodels/wriouser.js";
import logger from 'winston';
import Const from '../../constant.js';


let MAX_DEBT = Const.MAX_DEBT; // maximum allowed user debt to perfrm operations

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



router.get('/master', wrioAdmin, wrap(async (request,response) => {
    logger.debug("Coinadmin admin detected");
    var webGold = new WebGold(db.db);
    var wrgBalance = await webGold.getBalance(masterAccount);
    var ethBalance = await webGold.getEtherBalance(masterAccount);
    var syncing = await webGold.getBlockSync();
    var gasprice = await webGold.getGasPrice();

    var syncingFlag = true;
    if (syncing === false) {
        syncingFlag = false;
    }

    var resp = {
        "ethBalance": ethBalance / wei,
        "wrgBalance": wrgBalance / 100,
        "gasPrice": gasprice / wei,
        "syncing": syncingFlag,
        "currentBlock": syncing.currentBlock,
        "highestBlock": syncing.highestBlock
    };

    response.send(resp);
}));

async function formatUserData(user, wgUsers, webGold) {
    logger.debug(user);
    if (user.wrioID && user.ethereumWallet) {
        wgUsers.push({
            wrioID: user.wrioID,
            name: user.lastName,
            ethWallet: user.ethereumWallet,
            dbBalance: -(user.dbBalance || 0) / 100,
            ethBalance: await webGold.getEtherBalance(user.ethereumWallet) / wei,
            wrgBalance: await webGold.getBalance(user.ethereumWallet) / 100,
            widgets: user.widgets || []
        });
    }
}

router.get('/users', wrioAdmin, wrap(async (request,response) => {
    logger.debug("Coinadmin admin detected");
    var webGold = new WebGold(db.db);
    var wrioUsers = new WebRunesUsers(db.db);
    var users = await wrioUsers.getAllUsers({temporary:false});
    var wgUsers = [];
    for (var user of users) {
        await formatUserData(user, wgUsers, webGold);
    }
    response.send(wgUsers);
}));

router.get('/etherfeeds', wrioAdmin, wrap(async (request,response) => {
    logger.debug("Coinadmin admin detected");
    var d = new EtherFeeds();
    var ethFeeds = await d.getAll();
    response.send(ethFeeds);
}));

router.get('/donations', wrioAdmin, wrap(async (request,response) => {
    logger.debug("Coinadmin admin detected");
    var d = new Donations();
    var data = await d.getAll();
    response.send(data);
}));

router.get('/emissions', wrioAdmin, wrap(async (request,response) => {
    logger.debug("Coinadmin admin detected");
    var d = new Emissions();
    var data = await d.getAll();
    response.send(data);
}));

router.get('/invoices', wrioAdmin, wrap(async (request,response) => {
    logger.debug("Coinadmin admin detected");
    var d = new Invoices();
    var data = await d.getAll();
    response.send(data);
}));


export default router;