/**
 * Created by michbil on 16.02.16.
 */

import {Promise} from 'es6-promise';
import {dumpError,calc_percent} from './utils';
import Accounts from './ethereum-node';
import db from './db';
import {init} from './db';
import fs from 'fs';
import path from 'path';
import nconf from './wrio_nconf';
import BigNumber from 'bignumber.js';
import WebRunesUsers from './dbmodels/wriouser';
import EtherFeed from './dbmodels/etherfeed.js';
import Emissions from './dbmodels/emissions.js';
import Donation from './dbmodels/donations.js';
import mongoKeyStore from './payments/MongoKeystore.js';
import logger from 'winston';

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

        var amount = await webGold.getBalance(user.ethereumAccount);
        amount = amount.toString();
        this.setLock(user.wrioID);

        try {
            logger.info("****** PROCESS_PENDING_PAYMENTS",amount);
            /* Check all prepayments, if there's some, mark them as completed, */

            var pending = user['prepayments'] || [];
            logger.debug("Found "+pending.length+" pending payments for"+user.wrioID);

            if (pending.length == 0) {
                this.releaseLock(user.wrioID);
                return;
            }
            this.iteratePayments(pending,amount);
            this.releaseLock(user.wrioID);
        } catch (e) {
            this.releaseLock(user.wrioID);
            throw e; // Throw error down through the chain
        }
    }

    async iteratePayments(pending,amount) {
        var left = amount;
        for (var payment in pending) {
            var p = pending[payment];
            var paym_amount = - p.amount;
            logger.info ("   *****  PROCESSING PREPAYMENT "+payment);
            logger.debug(left,paym_amount);

            if (left >=paym_amount) {
                this.makeDonate(user,p,left);
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
        logger.info("Donating to",p.to,paym_amount);
        await this.webGold.unlockByWrioID(user.wrioID);
        await this.webGold.makeDonate(user, p.to, paym_amount);
        await this.wrioUser.cancelPrepayment(user.wrioID,p.id,-paym_amount); // remove payment amount from user's debt
        left -= paym_amount;
    }

}