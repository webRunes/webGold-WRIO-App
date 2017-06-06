/**
 * Created by michbil on 03.10.15.
 */

const db = require('wriocommon').db.getInstance;
const uuid = require('node-uuid');
const logger = require('winston');

class Invoice {

    constructor () {

        this.allowed_states = ['invoice_created', 'request_sent','payment_checking','payment_confirmed'];
        this.invoice_id = null;
        this.payments = db().collection('webGold_invoices');

    }

    createInvoice(userID,wrioID) {
        var that = this;
        let invoice_data = {
            _id: uuid.v4(),
            state: 'invoice_created',
            userID: userID,
            wrioID: wrioID,
            actions:[],
            timestamp: new Date()

        };

        return new Promise((resolve, reject) => {
            this.payments.insertOne(invoice_data,function(err,res) {
                if (err) {
                    reject(err);
                    return;
                }
                that.invoice_id = invoice_data._id;
                resolve(invoice_data._id);
            });
        });

    }

    recordAction(action) {
        var that = this;
        logger.debug("Recording action to db....");
        return new Promise((resolve,reject) => {
            this.payments.updateOne({_id:that.invoice_id },{$addToSet:{
                actions: action
            }},function(err) {
                if (err) {
                    return reject(err);
                }
                resolve("Ok");
            });
        });
    }

    updateInvoiceData(invoice_data) {
        var that = this;
        logger.debug("Updating invoice with data ", invoice_data);
        return new Promise((resolve, reject) =>{
            if (this.invoice_id == null) {
                reject("wrong invoice_id");
            }
            this.payments.updateOne({_id:that.invoice_id },{$set: invoice_data},function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(invoice_data._id);
            });
        });
    }

    getInvoice(nonce) {
        var that=this;
        logger.debug(nonce);

        return new Promise((resolve,reject) => {
            this.payments.findOne({_id:nonce},function (err,data) {
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
            this.payments.find({}).sort({'timestamp':-1}).toArray(function (err,feeds) {
                if (err) {
                    logger.error("Db invoice search error");
                    reject(err);
                    return;
                }
                if (!feeds) {
                    logger.error('Db invoice not found');
                    reject('Users not found');
                    return;
                }
                resolve(feeds);
            });
        });
    }

    clearTestDb() {

        return new Promise((resolve,reject) => {
                if (db().s.databaseName != "webrunes_test") {
                    return reject("Wipe can be made only on test db");
                }
                this.payments.remove({},(err) => {
                    if (err)  {
                        return reject(err);
                    }
                    resolve("Wipe ok");
                });
            }

        );
    }

}
module.exports = Invoice;