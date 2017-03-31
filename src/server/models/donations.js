/*
 * Created by michbil on 03.10.15.
 */
// Donations made by users


import logger from 'winston';
import {db as dbMod} from '../common';var db = dbMod.db;

export default class Donations {

    constructor () {

        this.widgets = db.db.collection('webGold_Donations');

    }

    create(srcWrioID,destWrioID,amount,feePaid) {
        var that = this;
        let invoice_data = {
            srcWrioID:srcWrioID,
            destWrioID:destWrioID,
            amount: amount,
            feePaid: feePaid,
            timestamp: new Date()


        };

        return new Promise((resolve, reject) => {
            this.widgets.insertOne(invoice_data,function(err,res) {
                if (err) {
                    reject(err);
                    return;
                }
                that.invoice_id = invoice_data._id;
                resolve(invoice_data._id);
            });
        });

    }

    get(mask) {
        var that=this;
        logger.debug(nonce);

        return new Promise((resolve,reject) => {

            this.widgets.findOne(mask,function (err,data) {
                if (err) {
                    logger.error("Error while searching invoice");
                    reject(err);
                    return;
                }
                if (!data) {
                    logger.error('No invoice found');
                    reject('Invoce not found');
                    return;
                }
                that.invoice_id = data._id;
                resolve(data);
            });
        });
    }
    getAll(query) {
        query = query || {};
        return new Promise((resolve,reject) =>{
            this.widgets.find(query).sort({'timestamp':-1}).toArray(function (err,data) {
                if (err) {
                    logger.error("Db user search error");
                    reject(err);
                    return;
                }
                if (!data) {
                    logger.error('Db user not found');
                    reject('Users not found');
                    return;
                }
                resolve(data);
            });
        });
    }

}