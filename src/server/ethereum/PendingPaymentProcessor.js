/**
 * Created by michbil on 16.02.16.
 */

import {Promise} from 'es6-promise';
import {utils} from '../common'; const dumpError = utils.dumpError;
import {db as dbMod} from '../common';var db = dbMod.db;
import fs from 'fs';
import path from 'path';
import nconf from '../utils/wrio_nconf';
import BigNumber from 'bignumber.js';
import WebRunesUsers from '../models/wriouser';
import Emissions from '../models/emissions.js';
import Donation from '../models/donations.js';
import logger from 'winston';
import DonateProcessor from "./DonateProcessor.js";

var prepaymentProcessLock = {};

export default class PendingPaymentProcessor {

    constructor() {
         this.wrioUser = new WebRunesUsers();
    }

    setLock(id) {
        logger.debug("Setting lock for ",id);
        prepaymentProcessLock[id] = true; // engage lock
    }
    releaseLock(id) {
        delete prepaymentProcessLock[id]; //  make sure lock is released in unexpected situation
        logger.debug("Releasing lock for ",id);
    }

    checkPrePaymentExpired(payment) {
        let timeLeft =new Date() - new Date(payment.timestamp);
        logger.debug("Prepayment data", timeLeft);
        return timeLeft < 0 ? true : false;
    }


    async process(user,webGold) {

        this.webGold = webGold;

        if (user.wrioID in prepaymentProcessLock) {
            logger.debug("Payments already processing, exit"); // TODO make this lock multi instance wide, not only process wide
            return;
        }

        if (!user.ethereumWallet) {
            throw new Error("User have no ethereum wallet, stopping");
        }

        var amount = await webGold.getBalance(user.ethereumWallet);
        amount = amount.toString();
        this.setLock(user.wrioID);

        logger.debug(user);

        try {
            logger.info("****** PROCESS_PENDING_PAYMENTS, total eth=",amount);
            /* Check all prepayments, if there's some, mark them as completed, */

            var pending = user['widgets'] || [];
            logger.debug("Found "+pending.length+" pending payments for"+user.wrioID);

            if (pending.length == 0) {
                this.releaseLock(user.wrioID);
                return;
            }
            await this.iteratePayments(pending,amount,user);
        }
        finally {
            this.releaseLock(user.wrioID);
        }

    }


    async iteratePayments(pending,amount,user) {
        var left = amount;
        for (var payment in pending) {
            var p = pending[payment];
            var paym_amount = - p.amount;
            logger.info ("   *****  PROCESSING PREPAYMENT "+payment,p);
            logger.debug(left,paym_amount);

            if (left >=paym_amount) {
                logger.info ("Have sufficent sum, forcing donate");
                await this.makeDonate(user,p,left);
            } else {
                logger.error("Insufficient funds to complete the payment", payment);
            }
            if (this.checkPrePaymentExpired(pending[payment])) {
                logger.verbose("Deleteting expired prepayment");
                await this.wrioUser.cancelPrepayment(user.wrioID, p.id, -paym_amount); // remove payment amount from user's debt
            }
            logger.debug("Pre-payments paid, left",left.toString());
        }
    }

    async makeDonate(user,p,left) {
        var paym_amount = - p.amount;
        logger.info("Donating to",p.to,paym_amount);
        await this.webGold.unlockByWrioID(user.wrioID);  // TODO save signed transactions in db or ask user to sign every transaction manually
        var donate = new DonateProcessor(p.to,user.wrioID,paym_amount);
        if (!(await donate.verifyDonateParameters())) {
            logger.error("Verify failed");
            throw new Error("Verify donate failed");
        }
        await donate.process();
        await this.wrioUser.cancelPrepayment(user.wrioID,p.id,-paym_amount); // remove payment amount from user's debt
        left -= paym_amount;
    }

}