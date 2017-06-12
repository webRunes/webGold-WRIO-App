/*
 * Created by michbil on 03.10.15.
 */
// Donations made by users
// TODO: switch to mongo promised API

const logger = require('winston');
const db = require('wriocommon').db.getInstance;
const {dumpError} = require('wriocommon').utils;

class Emissions {

    constructor () {
        this.widgets = db().collection('webGold_Emission');
    }

    create(userID,amount) {
        let invoice_data = {
            amount: amount,
            userID: userID,
            timestamp: new Date()
        };

        return new Promise((resolve, reject) => {
            this.widgets.insertOne(invoice_data,(err,res) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.invoice_id = invoice_data._id;
                resolve(invoice_data._id);
            });
        });
    }

    async haveRecentEmission(user,hours) {
        const target = new Date(new Date-hours* 60 * 60 *1000);
        try {
            const q = {
                userID: user.wrioID,
                timestamp: {
                    $gte: target
                }
            };
            console.log(q);
            let em =  await this.get(q);
            console.log("Found emissions",em);
            return (new Date(em.timestamp).getTime() - target)/(60*1000);
        } catch(e) {
            dumpError(e);
            console.log("No emission found in time interval");
            return false;
        }

    }

    get(mask) {
        return new Promise((resolve,reject) => {
            this.widgets.findOne(mask, (err,data) => {
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
module.exports = Emissions;