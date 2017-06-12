/**
 * Created by michbil on 03.10.15.
 */
// Ether amount, sent to users to perform operations


const logger = require('winston');
const db = require('wriocommon').db.getInstance;

class EtherFeed {

    constructor () {

        this.widgets = db().collection('webGold_EtherFeeds');

    }

    create(eth_account,amount,toWrio) {
        var that = this;
        let invoice_data = {
            amount: amount,
            eth_account: eth_account,
            to_id:toWrio,
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
            this.widgets.find({}).sort({'timestamp':-1}).toArray(function (err,feeds) {
                if (err) {
                    logger.error("Db user search error");
                    reject(err);
                    return;
                }
                if (!feeds) {
                    logger.error('Db user not found');
                    reject('Users not found');
                    return;
                }
                resolve(feeds);
            });
        });
    }

}
module.exports = EtherFeed;