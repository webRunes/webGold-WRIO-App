/**
 * Created by michbil on 03.10.15.
 */

import db from '../db';

export default class Invoice {

    constructor () {
        this.allowed_states = ['invoice_created', 'request_sent','payment_checking','payment_confirmed'];
        this.invoice_id = null;
        this.payments = db.db.collection('webGold_invoices');

    }

    createInvoice(userID) {
        var that = this;
        let invoice_data = {
            _id: uuid.v4(),
            state: 'invoice_created',
            userID: userID,
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

    updateInvoiceData(invoice_data) {
        var that = this;
        console.log("Updating invoice with data ", invoice_data);
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
        console.log(nonce);

        return new Promise((resolve,reject) => {

            this.payments.findOne({_id:nonce},function (err,data) {
                if (err) {
                    console.log("Error while searching invoice");
                    reject(err);
                    return;
                }
                if (!data) {
                    console.log('No invoice found');
                    reject('Invoce not found');
                    return;
                }
                that.invoice_id = data._id;
                resolve(data);
            })
        });
    }

}