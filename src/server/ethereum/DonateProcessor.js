const WebGold = require('./ethereum.js');
const {dumpError} = require('wriocommon').utils;
const nconf = require('../utils/wrio_nconf');
const Donation = require('../models/donations.js');
const WrioUser = require('../models/wriouser.js');
const logger = require('winston');
const {calc_percent} = require('../utils/utils.js');
const Tx = require('ethereumjs-tx');
const {bufferToHex} = require('ethereumjs-util');


let MAX_DEBT = -500*100; // maximum allowed user debt to perfrm operations

/*

Donate processor can return 3 states

1. Payment rejected
2. Pre-payment created
3. Payment accepted, TX to sign generated
4. Signed TX received, tx-accepted, tx-rejected


 */


class DonateProcessor {

    constructor(to,from,amount) {
        this.to = to;
        this.from = from;
        this.amount = parseInt(amount) * 100;
        this.userObj = new WrioUser();
        this.webGold = new WebGold();
    }

    async verifyDonateParameters() {
        if (!this.to) {
            logger.error("Parameters error, to field not set");
            return false;
        }
        if (!this.from) {
            logger.error("Parameters error, from field not set");
            return false;
        }
        if (! this.amount) {
            logger.error("Parameters error, amount field not set");
            return false;
        }
        if (typeof this.amount !== "number") {
            throw new Error("Can't parse amount");
        }
        if (this.amount < 0) {
            throw new Error("Amount can't be negative");
        }

        if (this.to === this.from) {
            throw new Error("Can't donate to itself");
        }

        try {
            this.srcUser = await this.userObj.getByWrioID(this.from);
            this.destUser = await this.userObj.getByWrioID(this.to);
        } catch (e){
            dumpError(e);
            logger.error("Cannot resolve user id's from=>to ", this.from,this.to);
            return false;
        }
        this.formatTranasactionLog();
        return true;

    }

    formatTranasactionLog() {
        logger.info("About to start donation from ",this.srcUser.lastName,'to',this.destUser.lastName);

    }

    async createPrepayment(f) {
        // Do virtual payment to the database record because user has insufficient funds
        // when funds arrive on the account, pending payments will be done
        var dbBalance = this.srcUser.dbBalance || 0;
        var debt = dbBalance-this.amount;

        logger.debug("CALCULATED DEBT:",debt,"MAX DEBT",MAX_DEBT);

        if (debt < MAX_DEBT ) { // check if we haven't reached maximum debt limit
            throw new Error("Insufficient funds");
        }
        await this.userObj.createPrepayment(this.srcUser.wrioID,-this.amount,this.to);
        logger.info("Prepayment made");
    }

    async extractEthAdresses() {
        this.destEthId = await this.webGold.getEthereumAccountForWrioID(this.to); // ensure that source adress and destination adress have ethereum adress
        this.srcEthId = await this.webGold.getEthereumAccountForWrioID(this.srcUser.wrioID);
        logger.info("From ",this.srcEthId," to ", this.destEthId);
    }


    async process() {
        await this.extractEthAdresses();
        var blockchainBalance = await this.webGold.getBalance(this.srcEthId);
        blockchainBalance = blockchainBalance.toString();
        logger.debug("Checking balance before donation", this.amount, blockchainBalance);


        try {

            if (this.amount > blockchainBalance) {
                return {"success":false,'error':"Not enough funds"}
            } else {
                let donationObj = new Donation();
                donationObj.create(this.srcUser.wrioID,this.to,this.amount,0);
                let tx = await this.generateDonateTx(this.srcUser, this.to, this.amount);
                await donationObj.update({
                    unsignedTX: tx,
                    state: 'UNSIGNED'
                });
                return {
                    "success": "true",
                    "txID": donationObj.record_id,
                    "callback":"//webgold"+nconf.get('server:workdomain')+"/sign_tx?id="+donationObj.record_id
                };
            }
        } catch (e) {
            console.log("ERROR during donate", e);
            return {
                success: false,
                error: e
            }
        }


        /* Temporary disable prepayments

        if (this.amount > blockchainBalance) {
            this.createPrepayment();
        } else {
            //generate transaction to be signed by user
            return await this.generateDonateTx(this.srcUser, this.to, this.amount);

        }
        var amountUser = this.amount*calc_percent(this.amount)/100;
        var fee = this.amount - amountUser;

       return {
            "success":true,
            "dest":this.from,
            "src":this.to,
            amount:this.amount,
            amountUser: amountUser,
            fee:fee,
            feePercent:calc_percent(this.amount)
        };*/

    }


    async generateDonateTx(user,to,amount) {
        if (!this.destUser.ethereumWallet) {
            throw new Error("User don't have a wallet");
        }
        await this.webGold.ensureMinimumEther(user.ethereumWallet,user.wrioID);
        var hex = await this.webGold.makeDonateTx(this.srcEthId,this.destEthId,amount);
        return hex;
    }

    async makeDonate (user, to, amount)  {

        logger.debug("Prepare for transfer",this.destEthId,this.srcEthId,amount);
        await this.webGold.donate(this.srcEthId,this.destEthId,amount);

        var donate = new Donation();
        await donate.create(user.wrioID,to,amount,0);

    };



}

class TransactionSigner {

    constructor (signedTx, sourceTx) {
        this.tx = signedTx;
        this.sourceTx = sourceTx
        this.webGold = new WebGold();
    }

    async compareTxS(signed,source) {
       UnSignTransaction(signed);
       return signed == source;
    }

    validateTx(transaction) {

        try {
            var tx = new Tx(transaction);
            var v = tx.validate();
            var s = tx.verifySignature();
            console.log(tx.toJSON());
            console.log("VALID=",v," SIGNED=",s);
            return  v && s;
        } catch(e) {
            console.log("CHECKTX error",e);
            dumpError(e);
            return false;
        }
    }
    async executeTx() {
        console.log("Executing signed transaction", this.tx);
        return await this.webGold.executeSignedTransaction(this.tx);
    }

    async process() {
        if (this.validateTx(this.tx) && this.compareTxS(this.tx,this.sourceTx)) {
            console.log("CheckTX succeeded");
            return await this.executeTx();
        } else {
            throw new Error("CheckTX failed" + this.tx);
        }

    }

}


/**
 * Reconstructs original transaction from signed transaction
 * @constructor
 */

function UnSignTransaction (tx) {
    var tx = new Tx(tx);
    tx.validate();
    tx.v = new Buffer([0x1c]); // refer to https://github.com/ethereumjs/ethereumjs-tx/blob/master/index.js
    tx.r = new Buffer([]);
    tx.s = new Buffer([]);
    return bufferToHex(tx.serialize()).replace('0x','');

}

module.exports = {
    DonateProcessor,
    TransactionSigner,
    UnSignTransaction
};