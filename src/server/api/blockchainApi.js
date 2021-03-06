const request = require('superagent');
const nconf = require('../utils/wrio_nconf');
const uuid = require('node-uuid');
const {dumpError} = require('wriocommon').utils;
const WebGold = require('../ethereum/ethereum');
const db = require('wriocommon').db.getInstance();
const Invoice = require('../models/invoice.js');
const Presale = require('../models/presale.js');
const User = require('../models/wriouser.js');
const RateGetter = require('./RateGetter.js');
const CurrencyConverter = require('../../currency.js');
const logger = require('winston');
const PresaleEtherscan = require('./etherscan.js');
const {ObjectID}  = require('mongodb');



const converter = new CurrencyConverter();
const isInTest = typeof global.it === 'function';

/* Blockchain.info client for bitcoin payments */

class BlockChainApi {
    constructor(options) {
        logger.silly("Creating blockchain object");
        this.key = nconf.get("payment:blockchain_v2:key");
        this.xpub = nconf.get("payment:blockchain_v2:xpub");
        this.payments = db.collection('webGold_invoices');
        this.secret = nconf.get("payment:blockchain_v2:secret");

        if (!this.key || !this.xpub || !this.secret) {
            throw "Blockchain.info configuration is not defined, please edit config.json to fix";
        }


        this.webgold = new WebGold();
        this.get_rates().then((res)=>{
            logger.info("Got current rates from blockhain API",res.toString());
        });
    }


    getInvoices(userID) {
        logger.verbose("Getting invoice list"); //   wrioID: userID
        return new Promise((resolve,reject) => {
            this.payments.find({userID:ObjectID(userID)}).toArray((err,res) => {

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
            (wg, mail, adr, satoshis, milliWRG,bitcoinSRC, bitcoinDEST)=> console.log("Emulating presale",mail, adr, satoshis, milliWRG,bitcoinSRC, bitcoinDEST);

        await logPresale (this.webgold, invoice.email, "0x"+invoice.ethID, invoice.amount, converter.satoshiTomilliWRGUsingPresalePrice(invoice.amount), "notImplemented", invoice.address);
    }
}

module.exports = BlockChainApi;