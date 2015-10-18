/**
 * Created by michbil on 03.10.15.
 */
// Ether amount, sent to users to perform operations



import db from '../db';

export default class EtherFeed {

    constructor () {

        this.prepayments = db.db.collection('webGold_EtherFeeds');

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
            })
        });
    }
    getAll() {
        return new Promise((resolve,reject) =>{
            this.prepayments.find({}).sort({'timestamp':-1}).toArray(function (err,feeds) {
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
            })
        });
    }

}