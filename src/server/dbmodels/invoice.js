/**
 * Created by michbil on 03.10.15.
 */

import db from '../db';
import uuid from 'node-uuid';

export default class Invoice {

    constructor () {

        this.allowed_states = ['invoice_created', 'request_sent','payment_checking','payment_confirmed'];
        this.invoice_id = null;
        this.payments = db.db.collection('webGold_invoices');

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
        console.log("Recording action to db....");
        return new Promise((resolve,reject) => {
            this.payments.updateOne({_id:that.invoice_id },{$addToSet:{
                actions: action
            }},function(err) {
                if (err) {
                    return reject(err);
                }
                resolve("Ok");
            })
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
    getAll() {
        return new Promise((resolve,reject) =>{
            this.payments.find({}).sort({'timestamp':-1}).toArray(function (err,feeds) {
                if (err) {
                    console.log("Db invoice search error");
                    reject(err);
                    return;
                }
                if (!feeds) {
                    console.log('Db invoice not found');
                    reject('Users not found');
                    return;
                }
                resolve(feeds);
            })
        });
    }

}