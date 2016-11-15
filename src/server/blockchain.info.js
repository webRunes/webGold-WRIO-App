import request from 'superagent';
import nconf from './wrio_nconf';
import uuid from 'node-uuid';
import {Router} from 'express';
import {login as loginImp} from 'wriocommon'; let {loginWithSessionId,getLoggedInUser,authS2S,wrioAdmin,wrap,wrioAuth,restOnly} = loginImp;
import {utils} from 'wriocommon'; const dumpError = utils.dumpError;
import BigNumber from 'bignumber.js';
import WebGold from './ethereum';
import {db as dbMod} from 'wriocommon';var db = dbMod.db;
import Invoice from './dbmodels/invoice.js';
import Presale from './dbmodels/presale.js';
import User from './dbmodels/wriouser.js';
import RateGetter from './payments/RateGetter.js';
import CurrencyConverter from '../currency.js';
import logger from 'winston';
import verifyMiddleware from './recaptcha.js';
import PresaleEtherscan from './etherscan.js';

const router = Router();
const converter = new CurrencyConverter();
const isInTest = typeof global.it === 'function';

/* Blockchain.info client for bitcoin payments */

export class BlockChain {
    constructor(options) {
        logger.silly("Creating blockchain object");
        this.key = nconf.get("payment:blockchain_v2:key");
        this.xpub = nconf.get("payment:blockchain_v2:xpub");
        this.payments = db.db.collection('webGold_invoices');
        this.secret = nconf.get("payment:blockchain_v2:secret");

        if (!this.key || !this.xpub || !this.secret) {
            throw "Blockchain.info configuration is not defined, please edit config.json to fix";
        }


        this.payments = db.db.collection('webGold_invoices');
        this.webgold = new WebGold(db.db);
        this.get_rates().then((res)=>{
            logger.info("Got current rates from blockhain API",res.toString());
        });
    }


    getInvoices(userID) {
        logger.verbose("Getting invoice list"); //   wrioID: userID
        return new Promise((resolve,reject) => {
            this.payments.find({userID:db.ObjectID(userID)}).toArray((err,res) => {

                if (err) {
                    reject();
                } else {
                    resolve(res);
                }
            });
        });

    }

    async get_rates() {
        try {

            return await RateGetter.getRates();

        }
        catch(e) {
            logger.error("get_rates request failed",e);
            dumpError(e);

            }

        }

    // get currect address gap
    async get_gap() {
        let api_request = `https://api.blockchain.info/v2/receive/checkgap?xpub=${this.xpub}&key=${this.key}`;
        var result = await request.get(api_request);
        if (result.error) {
            logger.debug("Error during checkgap",result.error);
            return;
        }
        return result.body;
    }

    async request_payment(userID,wrioID,amount)  {

        let invoice = new Invoice();
        let invoiceID = await invoice.createInvoice(userID,wrioID);
        const callback = `https://webgold.wrioos.com/api/blockchain/callback/?nonce=${invoiceID}&secret=${this.secret}`;
        const api_request = `https://api.blockchain.info/v2/receive?xpub=${this.xpub}&callback=${encodeURIComponent(callback)}&key=${this.key}`;

        logger.info("Sending payment request",api_request);
        var result = await request.get(api_request);
        if (result.error) {
            logger.debug("Error",result.error);
            return;
        }

        if (!result.body) {
            logger.error("Wrong response");
            return;
        }

        logger.verbose("Server response:",result.body);
        await invoice.updateInvoiceData({
            address: result.body.address,
            index: result.body.index,
            callback: result.body.callback,
            'state': 'request_sent',
            'requested_amount': amount
        });

        return {
            adress: result.body.address,
            amount: amount
        };
    }

    async request_presale(amount,email,ethID)  {

        let invoice = new Presale();
        let invoiceID = await invoice.createPresale(email,ethID);
        const callback = `https://webgold.wrioos.com/api/blockchain/callback/?nonce=${invoiceID}&secret=${this.secret}`;
        const api_request = `https://api.blockchain.info/v2/receive?xpub=${this.xpub}&callback=${encodeURIComponent(callback)}&key=${this.key}`;

        logger.info("Sending payment request",api_request);
        var result = await request.get(api_request);
        if (result.error) {
            logger.debug("Error",result.error);
            return;
        }

        if (!result.body) {
            logger.error("Wrong response");
            return;
        }

        logger.verbose("Server response:",result.body);
        await invoice.updateInvoiceData({
            'type': 'presale',
            address: result.body.address,
            index: result.body.index,
            callback: result.body.callback,
            'state': 'request_sent',
            'requested_amount': amount,
        });

        return {
            adress: result.body.address,
            amount: amount
        };
    }

    async handle_callback(req,resp) {
        let secret = decodeURIComponent(req.query.secret);
        let nonce = req.query.nonce;

        let transaction_hash = req.query.transaction_hash;
        let address = req.query.address;
        let valueSatoshis = req.query.value; // value in satoshi
        let confirmations = req.query.confirmations;
        let test = req.query.test;
        logger.debug("GOT CALLBACK FROM BLOCKCHAIN API: ",req.query);

        if (secret != this.secret) {
            resp.status(403).send("");
            logger.error("ERROR: wrong secret");
            return;
        }
        if (!nonce) {
            resp.status(400).send("");
            logger.error("ERROR: nonce not provided");
            return;
        }

        //let invoice = new Invoice();
        //var invoice_data = await invoice.getInvoice(nonce);
        let invoice = new Presale();
        let invoice_data = await invoice.getPresale(nonce);
        logger.debug("Got invoice ID:",invoice_data);

        await invoice.recordAction({
            "request":req.query,
            "timestamp": new Date()
        });

        if ( !transaction_hash  || !address || !valueSatoshis || !confirmations) {
            resp.status(400).send("");
            logger.error("ERROR: missing required parameters");
            return;

        }

        logger.debug("Comparing input adress from invoice",invoice_data.address, address);
        if (invoice_data.address != address) {
            logger.error("Wrong input address");
            resp.status(403).send("");
            return;
        }

        await invoice.updateInvoiceData({
            amount: valueSatoshis,
            transaction_hash: transaction_hash,
            state: `payment_checking`

        });

        if (test) { // if test request, don't do anything with user account
            logger.error("This is only a test, don't making anything furthermore");
            resp.status(200).send("test_received");
            return;
        }

        if (confirmations > 5) { // if there's more than 5 confirmations
            await invoice.updateInvoiceData({
               state: "payment_confirmed"
            });
            const inv = await invoice.getPresale(nonce);
            console.log("Payment confirmed by blockchain.info", inv);
            await this.presaleMake(inv);
            return resp.status(200).send("*ok*"); // send success to blockchain.info server
        }
        logger.verbose("**Confirmation recieved",confirmations);
        resp.status(200).send("confirmation_received");

    }

   /*
    async generateWrg(who,btcAmount,id) {
        const wrg = this.btcToMilliWRG(btcAmount, await this.get_rates());
        var isInTest = typeof global.it === 'function';
        if (isInTest) {
            logger.info(` ====  Mocking emission of WRG ==== ${wrg} milliwrgs`);
            return;
        } else {
            return await this.webgold.emit(who, wrg, id); // send ether to user
        }
    }
    */

    async presaleMake(invoice) {
        const logPresale = !isInTest ?
            PresaleEtherscan :
            (wg, mail, adr, satoshis, milliWRG,bitcoinSRC, bitcoinDEST)=> console.log(wg, mail, adr, satoshis, milliWRG,bitcoinSRC, bitcoinDEST);

        await logPresale (this.webgold, invoice.email, "0x"+invoice.ethID, invoice.amount, converter.satoshiTomilliWRGUsingPresalePrice(invoice.amount), "notImplemented", invoice.address);
    }
}


router.get('/callback',async (request,response) => {
    try {
        var blockchain = new BlockChain();
        await blockchain.handle_callback(request,response);
    } catch(e) {
        logger.error("Callback failed",e);
        dumpError(e);
        response.status(400).send({"error":"API operation failed"});
    }
});



router.get('/payment_history', restOnly, wrioAuth, wrap(async (request,response) => {

        var userID = request.user;
        var blockchain = new BlockChain();
        var history = await blockchain.getInvoices(userID._id);
        response.send(history);

}));

/*
// disable request now, just accept prepayments
router.post('/request_payment', restOnly, wrioAuth, function(req,response) {
    logger.debug("Request payment is called");
    var blockchain = new BlockChain();

    var userId = req.user._id;
    var wrioId = req.user.wrioID;

    var nonce = req.body.payment_method_nonce;
    var webRunes_webGold = db.db.collection('webRunes_webGold');
    var amount = parseFloat(req.body.amount);
    var amountWRG = parseFloat(req.body.amountWRG);
    if (isNaN(amount) || (amount < 0)) {
        response.status(400).send({"error": "bad request"});
        return;
    }
    if (isNaN(amountWRG) || (amountWRG < 0)) {
        response.status(400).send({"error": "bad request"});
        return;
    }
    logger.debug("Got nonce", nonce);

    blockchain.request_payment(userId, wrioId, amount).then(function (resp) {
        logger.debug("Resp",resp);
        response.send(resp);
    },function (err) {
        response.status(400).send({"error": "error processing your request "+err});
    });

}); */

const verifyMiddlewareFactory = () => {
    const isInTest = typeof global.it === 'function';
    return isInTest? (request,response,next) => next() : verifyMiddleware;
};


router.post('/request_presale', restOnly, verifyMiddlewareFactory(), (req,response) =>{ // TODO add anti-spam protection
    logger.debug("Request payment is called");
    var blockchain = new BlockChain();

    const email = req.body.mail; // TODO: validate it!
    const ethID = req.body.ethID;
    const amount = parseFloat(req.body.amount);
    const amountWRG = parseFloat(req.body.amountWRG); // amountWRG is ignored, we don't trust it

    logger.info(`Got presale request to ${email} ETH: ${ethID} amount ${amount} BTC(satoshis) ${amountWRG} WRG`);

    const checkNumber = (amount) => isNaN(amount) || (amount < 0);
    if (checkNumber(amount) || checkNumber(amountWRG)) {
        return response.status(400).send({"error": "bad request"});
    }
    blockchain.request_presale(amount, email,ethID).then((resp) => {
        logger.debug("Resp", resp);
        response.send(resp);
    }, (err) => {
        dumpError(err);
        response.status(400).send({"error": "error processing your request " + err});
    });

});

/**
 * Get current adress gap for bitcoin addresses
 */

router.get('/get_gap', restOnly, wrioAdmin, function(req,response) {
    logger.debug("Request payment is called");
    var blockchain = new BlockChain();

    blockchain.get_gap().then(function (resp) {
        logger.debug("Resp",resp);
        response.send(resp);
    },function (err) {
        response.status(400).send({"error": "error processing your request "+err});
    });


});


export default router;