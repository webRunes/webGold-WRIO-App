/*
 * Created by michbil on 03.10.15.
 */
// Donations made by users


import logger from 'winston';
import {db as dbMod} from 'wriocommon';var db = dbMod.db;

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

    async haveRecentEmission(hours) {
        let target = new Date(new Date-hours* 60 * 60 *1000)
        return await this.get({
            timestamp: {
                $gte: target
            }
        })
    }

    get(mask) {
        logger.debug(nonce);
        return new Promise((resolve,reject) => {
            this.widgets.findOne(mask,function (err,data) {
                if (err) {
                    logger.error("Error while searching emission");
                    reject(err);
                    return;
                }
                if (!data) {
                    logger.error('No emission found');
                    reject('Emission not found');
                    return;
                }
                this.invoice_id = data._id;
                resolve(data);
            });
        });
    }
    async getAll() {
        return await this.get({});
    }

}