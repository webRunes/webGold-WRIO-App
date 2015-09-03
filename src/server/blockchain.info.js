import request from 'superagent';
import nconf from './wrio_nconf';

import {init} from './db';

init().then(function(database) {
    var blockchain = new BlockChain();
    blockchain.request_payment(11);
    database.close();
});


import db from './db';

function promisify(r) {
    return new Promise((resolve) => {
        r.end(resolve);
    });
}



class BlockChain {
    constructor(options) {
        this.receivingAdress ='33d8PRJty5hPb6rCYbYYLF6P72WATJ6C3J';
        this.payments = db.db.collection('webRunes_webGold');
    }

    createPaymentRequest(wrioID) {

        let payment = {
            state: 'request_sent',
            wrioID: wrioID,
            timestamp: $currentDate

        }

        return new Promise((resolve, reject) => {
            this.payments.insertOne(payment,function(err,res) {
                if (err) {
                    reject();
                    return;
                }
                console.log(res);
                resolve();
            });
        });

    }

    async request_payment(wrioID)  {
        let callback = 'http://webgold.wrioos.com/api/blockchaing/receive/?nonce='+wrioID;
        let api_request = "https://blockchain.info/ru/api/receive?method=create&address=" + this.receivingAdress + "&callback="+ encodeURIComponent(callback);
        try {
            console.log("Sending payment request",api_request);
            var result = await request.post(api_request);
            if (result.error) {
                console.log("Error",result.error);
                return;
            }

            if (!result.body) {
                console.log("Wrong response");
                return;
            }

            console.log("Server response:",result.body);

            var respID = await this.createPaymentRequest(wrioID);

            return result.body.input_adress;
        } catch(e) {
            console.log("Blockchaing API request failed",e);
            return null;
        }

    }

    handle_callback(nonce) {

    }
}



