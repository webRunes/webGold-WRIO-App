import WebGold from './ethereum.js';
import {calc_percent,dumpError} from './utils';
import {Promise} from 'es6-promise';
import db from './db';
import nconf from './wrio_nconf';
import BigNumber from 'bignumber.js';
import Donations from './dbmodels/donations.js';
import WrioUser from "./dbmodels/wriouser.js";
import logger from 'winston';

let MAX_DEBT = -500*100; // maximum allowed user debt to perfrm operations

export default class DonateProcessor {

    constructor(to,from,amount) {
        this.to = to;
        this.from = from;
        this.amount = parseInt(amount) * 100;
        this.userObj = new WrioUser();
        this.webGold = new WebGold(db.db);
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

        this.srcUser = await this.userObj.getByWrioID(this.from);
        this.destUser = await this.userObj.getByWrioID(this.to);
        this.formatTranasactionLog();
        return true;

    }

    formatTranasactionLog() {
        logger.info("About to start donation from ",this.srcUser.lastName,'to',this.destUser.lastName);
    }


    async process() {

        var destEthId = await this.webGold.getEthereumAccountForWrioID(this.to); // ensure that source adress and destination adress have ethereum adress
        var srcEthId = await this.webGold.getEthereumAccountForWrioID(this.srcUser.wrioID);

        var dbBalance = this.srcUser.dbBalance || 0;
        var blockchainBalance = await this.webGold.getBalance(srcEthId);
        blockchainBalance = blockchainBalance.toString();

        logger.debug("Checking balance before donation", this.amount, blockchainBalance);

        if (this.amount > blockchainBalance) {
            // Do virtual payment to the database record because user has insufficient funds
            // when funds arrive on the account, pending payments will be done

            var debt = dbBalance-this.amount;

            logger.debug("CALCULATED DEBT:",debt,"MAX DEBT",MAX_DEBT);

            if (debt < MAX_DEBT ) { // check if we haven't reached maximum debt limit
                throw new Error("Insufficient funds");
            }
            await this.userObj.createPrepayment(this.srcUser.wrioID,-this.amount,this.to);
            logger.info("Prepayment made");

        } else {
            // Make the real payment through the blockchain
            await this.webGold.makeDonate(this.srcUser, this.to, this.amount);

        }
        var amountUser = this.amount*calc_percent(this.amount)/100;
        var fee = this.amount - amountUser;


       return {
            "success":true,
            "dest":destEthId,
            "src":srcEthId,
            amount:this.amount,
            amountUser: amountUser,
            fee:fee,
            feePercent:calc_percent(this.amount)
        };

    }

}