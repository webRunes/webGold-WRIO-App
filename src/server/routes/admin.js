/**
 * Created by michbil on 26.09.15.
 */
/**
 * Created by michbil on 26.09.15.
 */

import WebGold from '../ethereum/ethereum.js';
import {Router} from 'express';
import {login as loginImp} from '../common'; let {loginWithSessionId,getLoggedInUser,authS2S,wrioAdmin,wrap} = loginImp;
import {db as dbMod} from '../common';var db = dbMod.db;
const router = Router();
import WebRunesUsers from '../models/wriouser';
import nconf from '../utils/wrio_nconf';
import BigNumber from 'bignumber.js';
import Donations from '../models/donations.js';
import Emissions from '../models/emissions.js';
import EtherFeeds from '../models/etherfeed.js';
import Invoices from "../models/invoice.js";
import Presales from "../models/presale.js";
import WrioUser from "../models/wriouser.js";
import logger from 'winston';
import Const from '../../constant.js';



let MAX_DEBT = Const.MAX_DEBT; // maximum allowed user debt to perfrm operations
let wei = Const.WEI;
let min_amount = Const.MIN_ETH_AMOUNT; //0.002// ETH, be sure that each ethereum account has this minimal value to have ability to perform one transaction
let masterAccount = nconf.get("payment:ethereum:masterAdr");




router.get('/master', wrioAdmin, wrap(async (request,response) => {
    logger.debug("Coinadmin admin detected");
    let webGold = new WebGold(db.db);
    let wrgBalance = await webGold.getBalance(masterAccount);
    let ethBalance = await webGold.getEtherBalance(masterAccount);
    let syncing = await webGold.getBlockSync();
    let gasprice = await webGold.getGasPrice();
    let latest = await webGold.getLatestBlock();

    var syncingFlag = true;
    if (syncing === false) {
        syncingFlag = false;
    }

    var resp = {
        "masterAddr": nconf.get('payment:ethereum:masterAdr'),
        "ethBalance": ethBalance / wei,
        "wrgBalance": wrgBalance / 100,
        "gasPrice": gasprice / wei,
        "syncing": syncingFlag,
        "latest": latest,
        "currentBlock": syncing.currentBlock,
        "highestBlock": syncing.highestBlock
    };

    response.send(resp);
}));

const formatUserData = (webGold) => async (user) => {

    const [eth,wrg,rtx] = await Promise.all([
        webGold.getEtherBalance(user.ethereumWallet),
        webGold.getBalance(user.ethereumWallet),
        webGold.getRtxBalance(user.ethereumWallet),
    ]);

    return {
        wrioID: user.wrioID,
        name: user.lastName,
        ethWallet: user.ethereumWallet,
        dbBalance: -(user.dbBalance || 0) / 100,
        ethBalance: eth / wei,
        wrgBalance: wrg / 100,
        rtxBalance: rtx,
        widgets: user.widgets || []
    }

};

router.get('/users', wrioAdmin, wrap(async (request,response) => {
    logger.debug("Coinadmin admin detected");
    const webGold = new WebGold(db.db);
    const wrioUsers = new WebRunesUsers(db.db);
    const users = await wrioUsers.getAllUsers({temporary:false});
    const wgUsers = users.
        filter((user) => user.wrioID && user.ethereumWallet).
        map(formatUserData(webGold));

    response.send(await Promise.all(wgUsers));
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

router.get('/presales', wrioAdmin, wrap(async (request,response) => {
    logger.debug("Coinadmin admin detected");
    var d = new Presales();
    var data = await d.getAll();
    response.send(data);
}));


export default router;