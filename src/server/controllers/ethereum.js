/**
 * Created by michbil on 12.01.17.
 */

const WebGold = require('../ethereum/ethereum.js');
const {formatBlockUrl} = require('../utils/utils');
const WebRunesUsers = require('../models/wriouser');
const nconf = require('../utils/wrio_nconf');
const BigNumber = require('bignumber.js');
const Donations = require('../models/donations.js');
const Emissions = require('../models/emissions.js');
const EtherFeeds = require('../models/etherfeed.js');
const Invoices = require('../models/invoice.js');
const WrioUser = require('../models/wriouser.js');
const util = require('util');
const {ObjectID} = require('mongodb');

const {DonateProcessor} = require('../ethereum/DonateProcessor.js');
const {TransactionSigner} = require('../ethereum/DonateProcessor.js');
const Const = require('../../constant.js');
const logger = require('winston');
const amqplib = require('amqplib');

let wei = Const.WEI;
let min_amount = Const.MIN_ETH_AMOUNT; //0.002// ETH, be sure that each ethereum account has this minimal value to have ability to perform one transaction

var queuePromise = require('amqplib').connect(nconf.get('rabbitmq:url'));

let ch;
const QUEUE = nconf.get('rabbitmq:tweetQueue');
queuePromise.then((q)=>{
    console.log('Connected to the rabbitmq server');
    return q.createChannel();
}).then((channel)=>{
    channel.assertQueue(QUEUE);
    ch = channel;
}).catch((err)=>{
    console.log("Unable connect to the queue, aborting",err);
    process.exit(-1);
});

const formatWRGamount = (amount) => amount / 100;



const giveaway = async (request,response) => {  // TODO: remove this method

    if (nconf.get('server:workdomain') !== '.wrioos.local') {
        logger.error("  ===== LOG FORBIDDEN ACTION DETECTED!!! =====");
        response.status(404).send('Not found');
        return;
    }
    logger.error("  =====  WARNING: GIVEAWAY CALLED, ONLY FOR DEBUGGING PURPOSES ====  ");
    var user = request.user;
    var webGold = new WebGold();
    await webGold.giveAwayEther(user.ethereumWallet);
    response.send("Successfully given away");
};

const free_wrg = async (request,response) => {  // TODO: remove this method

   // setTimeout(async () => { // SAFETY DELAY TO PREVENT MULTIPLE EMISSIONS
        let user = request.user;
        logger.error("  =====  WARNING: FREE WRG CALLED, SHOULD BE USED ONLY ON TESTNET ====  to user", user);

        let emissions = new Emissions();
        let emissionTimeStamp = await emissions.haveRecentEmission(user,1);
        if (emissionTimeStamp) { // allom emission every hour
            return response.status(403).send({
                reason: "wait",
                timeleft: emissionTimeStamp
            });
        };

        let amount = 10 * 100; // We can give 10 WRG every hour

        let webGold = new WebGold();
        const txId = await webGold.emit(user.ethereumWallet, amount, user.wrioID);
        const txUrl = formatBlockUrl(txId);
        //response.send(`<html><body>Successfully sent ${formatWRGamount(amount)}, transaction hash <a href="${txUrl}">${txId} </a></html></body>"`);
        const resp = {
            amount: formatWRGamount(amount),
            txhash: txId,
            txurl: txUrl
        };
        response.send(resp);
   // },3000);
};


const tx_poll = async (request,response) => {

        const user = request.user;
        const hash = request.query.txhash; // todo add validation
        const webGold = new WebGold();
        console.log("Validating hash");
        response.send(await webGold.getTxHashData(hash));

};

const get_wallet = async(request,response) => {
    var user = request.user;
    if (user.ethereumWallet) {
        return response.send(user.ethereumWallet);
    } else {
        return response.status(403).send("User don't have ethereum wallet yet");
    }

};


const get_user_wallet = async(request,response) => {
    request.checkQuery('wrioID', 'Invalid wrio id').isInt();
    let result = await request.getValidationResult();

    if (!result.isEmpty()) {
        return response.status(403).send("Invalid parameters");
    }

    let wrioUser = new WebRunesUsers();
    try {
        let user = await wrioUser.getByWrioID(request.query.wrioID);
        return response.json({"wallet":user.ethereumWallet});
    } catch (err) {
        console.log(err);
        response.send("false");
    }

};

const save_wallet = async(request,response) => {
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

/**
 * Sign transaction made by donate() method
 * @param request
 * @param response
 *
 * GET PARAMETERS:
 *
 * tx - signed tx code
 * txId - transaction id code
 *
 */

const sign_tx = async (request,response) => {

    request.checkQuery('tx', 'Invalid TX').isHexadecimal();
    request.checkQuery('id', 'Invalid transaction id').isHexadecimal();

    let result = await request.getValidationResult();
    if (!result.isEmpty()) {
        response.status(400).send('There have been validation errors: ' + util.inspect(result.array()));
        return;
    }

    let donationObj = new Donations();
    let donate = await donationObj.get({
        "status": 'pending',
        _id: ObjectID(request.query.id)
    });

    if (!donate) {
        throw new Error("Cannot find source transaction");
    }

    const tx = request.query.tx;
    let signer = new TransactionSigner(tx);
    let dResult = await signer.process();
    await donationObj.update({
        "status": 'finished'
    });
    ch.sendToQueue(QUEUE, new Buffer(request.query.id));
    response.send(dResult);

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

const donate = async (request, response) => {
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

const get_balance = async (request,response) => {

    const user = request.user;

    if (!user.ethereumWallet) {
        return response.status(406).send("No ethereum wallet")
    }

    let dbBalance = 0;
    if (user.dbBalance) {
        dbBalance = user.dbBalance / 100;
    }
    logger.debug("balance from db:", dbBalance);

    const webGold = new WebGold();
    const dest = await webGold.getEthereumAccountForWrioID(user.wrioID);
    let [rtx,balance] = await Promise.all([webGold.getRtxBalance(dest), webGold.getBalance(dest)]);
    balance = balance / 100;

    if (!rtx) {
        rtx = 0;
    }
    rtx = rtx / 100;
//    await webGold.processPendingPayments(user);
    //const bal = balance - dbBalance;

    //logger.debug("balance:",balance.add(dbBalance).toString());
    response.send({
	"wrioID":request.user.wrioID,    
        "balance": balance,
        "rtx":rtx,
        "promised": dbBalance,
        "blockchain": balance
    });

};

const get_exchange_rate = async (request,response) => {
    response.send("10");
};

module.exports = {
    giveaway,
    free_wrg,
    tx_poll,
    get_wallet,
    get_user_wallet,
    save_wallet,
    sign_tx,
    donate,
    get_balance,
    get_exchange_rate
};
