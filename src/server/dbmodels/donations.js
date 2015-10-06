/*
 * Created by michbil on 03.10.15.
 */
// Donations made by users



import db from '../db';

export default class Donations {

    constructor () {

        this.donations = db.db.collection('webGold_Donations');

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
            this.donations.insertOne(invoice_data,function(err,res) {
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

            this.donations.findOne(mask,function (err,data) {
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
            this.donations.find({}).toArray(function (err,data) {
                if (err) {
                    console.log("Db user search error");
                    reject(err);
                    return;
                }
                if (!data) {
                    console.log('Db user not found');
                    reject('Users not found');
                    return;
                }
                resolve(data);
            })
        });
    }

}