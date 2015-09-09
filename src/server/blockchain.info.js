import request from 'superagent';
import nconf from './wrio_nconf';
import uuid from 'node-uuid'
import {Router} from 'express';
import {loginWithSessionId,getLoggedInUser} from './wriologin';

import {init} from './db';

const router = Router();
/*
init().then(function(database) {
    var blockchain = new BlockChain();
    blockchain.request_payment(11).then(function (){
        database.close();
    });

});
*/


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
        this.secret = 'asdfNzxcAasf99azsgjgkslslsizzz';
    }

    createPaymentRequest(wrioID) {

        let payment = {
            _id: uuid.v4(),
            state: 'request_sent',
            wrioID: wrioID,
            timestamp: new Date()

        };
        console.log(payment);

        return new Promise((resolve, reject) => {
            this.payments.insertOne(payment,function(err,res) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(payment._id);
            });
        });

    }

    get_payment_history(userID) {
        console.log("getting history"); //   wrioID: userID
        return new Promise((resolve,reject) => {
            this.payments.find({

            }).toArray((err,res) => {
                console.log("got result");
                if (err) {
                    reject();

                } else {
                    resolve(res);
                }

            })
        });

    }

    request_payment(wrioID)  {
        return new Promise(async (resolve,reject) => {

            let callback = 'http://webgold.wrioos.com/api/blockchain/callback/?nonce='+wrioID;
            let api_request = "https://blockchain.info/ru/api/receive?method=create&address=" + this.receivingAdress + "&callback="+ encodeURIComponent(callback) + '&secret='+ this.secret;
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

                console.log("Registered id", respID);

                resolve({
                    adress: result.body.input_address,
                    amount: 0.0
                });
            } catch(e) {
                console.log("Blockchaing API request failed",e);
                reject(e)
            }
        });

    }

    handle_callback(request) {

    }
}

router.get('/callback',function(request,response) {
    var blockchain = new BlockChain();
});

router.post('/payment_history', async (request,response) => {

    try {
        var userID = getLoggedInUser(request.sessionID);

        var blockchain = new BlockChain();
        var history = blockchain.get_payment_history(userID);
        console.log(history);
        response.send(history);

    } catch (e) {
        console.log("Caught error: ",e);
        response.status(403).send({"error":e.toString()});
    }


});

router.post('/request_payment',function(req,response) {
    console.log("Request payment is called");
    loginWithSessionId(req.sessionID, function(err, User) {

        if (err) {
            console.log("User not found");
            return response.status(403).render('index.ejs', {"error": "Not logged in", "user": undefined});
        }
        var blockchain = new BlockChain();
        var userId = User.userID;

        if (!userId) {
            response().status(400).send({"error":"This user has no userID, exiting"})
        }

        var nonce = req.body.payment_method_nonce;
        var webRunes_webGold = db.db.collection('webRunes_webGold');
        var amount = parseFloat(req.body.amount);
        var amountWRG = parseFloat(req.body.amountWRG);
        if (isNaN(amount) || (amount < 0)) {
            response.status(400).send({"error": "bad request"});
            return;
        }
        if (isNaN(amountWRG) || (amountWRG < 0)) {
            response.status(400).send({"error": "bad request"});
            return;
        }
        console.log("Got nonce", nonce);


        blockchain.request_payment(userId).then(function (resp) {
            console.log("Resp",resp);
            response.send(resp);
        },function (err) {
            response.status(400).send({"error": "error processing your request "+err});
        });

    });

});

export default router;