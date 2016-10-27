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
import User from './dbmodels/wriouser.js';
import RateGetter from './payments/RateGetter.js';
import CurrencyConverter from '../currency.js';
import logger from 'winston';

const router = Router();
const converter = new CurrencyConverter();

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

    request_payment(userID,wrioID,amount)  {
        return new Promise(async (resolve,reject) => {

           try {
               let key = nconf.get("");
               let invoice = new Invoice();
               let invoiceID = await invoice.createInvoice(userID,wrioID);
               let callback = 'https://webgold.wrioos.com/api/blockchain/callback/?nonce='+invoiceID + '&secret='+ this.secret;
               let api_request = "https://api.blockchain.info/v2/receive?xpub=" + this.xpub + "&callback="+ encodeURIComponent(callback) + "&key=" + this.key ;

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

                resolve({
                    adress: result.body.address,
                    amount: amount
                });
            } catch(e) {
                logger.error("Blockchain API request failed",e);
                dumpError(e);
                reject(e);
            }
        });

    }

    handle_callback(req,resp) {
        return new Promise(async (resolve, reject) => {
            try {
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

                let invoice = new Invoice();
                var invoice_data = await invoice.getInvoice(nonce);
                logger.debug("Got invoice ID:",invoice_data);

                await invoice.recordAction({
                    "request":req.query,
                    "timestamp": new Date()
                });

                var user = new User();
                user = await user.getByWrioID(invoice_data.wrioID);
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
                    await this.generateWrg(user.ethereumWallet, valueSatoshis, user.wrioID); // send ether to user
                    logger.info("WRG was emitted");
                    return resp.status(200).send("*ok*"); // send success to blockchain.info server
                }
                logger.verbose("**Confirmation recieved",confirmations);
                resp.status(200).send("confirmation_received");

            } catch (e) {
                reject(e);
                logger.error("Error during blockchain callback: ",e);
            }
        });
    }

    btcToMilliWRG(btc,rate) {
        const wrg = converter.convertBTCtoWRG(new BigNumber(btc),rate).times(100).toFixed(0);
        return parseInt(wrg);
    }

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


});

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