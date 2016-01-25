/*
 * Created by michbil on 03.10.15.
 */
// Pre payments with 0 balance



import db from '../db';

export default class PrePayments {

    constructor () {

        this.prepayments = db.db.collection('webGold_PrePayments');

    }

    create(userID,amount,to) {
        var that = this;
        let invoice_data = {
            amount: amount,
            userID: userID,
            to: to,
            timestamp: new Date(),
            state: "pending"

        };

        return new Promise((resolve, reject) => {
            this.prepayments.insertOne(invoice_data,function(err,res) {
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
        console.log(nonce);

        return new Promise((resolve,reject) => {

            this.prepayments.findOne(mask,function (err,data) {
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
            });
        });
    }
    getAll(where) {
        where = where || {};
        return new Promise((resolve,reject) =>{
            this.prepayments.find(where).sort({'timestamp':-1}).toArray(function (err,feeds) {
                if (err) {
                    console.log("Db user search error");
                    reject(err);
                    return;
                }
                if (!feeds) {
                    console.log('Db user not found');
                    reject('Users not found');
                    return;
                }
                resolve(feeds);
            });
        });
    }
    updateByWrioID(id, data) {
        return new Promise((resolve,reject) =>{
            this.prepayments.updateOne({_id:id},{$set:data},function (err,data) {
                if (err) {
                    console.log("Db prepayments search error");
                    reject(err);
                    return;
                }
                if (!data) {
                    console.log('Db prepayment not found');
                    reject('User not found '+wrioID);
                    return;
                }
                resolve(data);
            });
        });
    }

}