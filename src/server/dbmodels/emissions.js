/*
 * Created by michbil on 03.10.15.
 */
// Donations made by users


import logger from 'winston';
import db from '../db';

export default class Emissions {

    constructor () {

        this.widgets = db.db.collection('webGold_Emission');

    }

    create(userID,amount) {
        var that = this;
        let invoice_data = {
            amount: amount,
            userID: userID,
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
    getAll() {
        return new Promise((resolve,reject) =>{
            this.widgets.find({}).sort({'timestamp':-1}).toArray(function (err,data) {
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