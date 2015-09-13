import request from 'superagent';
import nconf from './wrio_nconf';
import uuid from 'node-uuid';
import {Router} from 'express';
import {loginWithSessionId,getLoggedInUser} from './wriologin';
import {dumpError} from './utils';

import {init} from './db';

const router = Router();

/*
init().then(function(database) {
    var blockchain = new BlockChain();
    blockchain.get_payment_history(11).then(function (res){
        console.log(res);
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


class Invoice {

    constructor () {
        this.allowed_states = ['invoice_created', 'request_sent','confirmation_received','payment_confirmed'];
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
        return new Promise((resolve, reject) => {
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

    getInvoice() {

    }

}

class BlockChain {
    constructor(options) {
        this.receivingAdress = nconf.get("payment:blockchain:receivingAdress");
        this.payments = db.db.collection('webGold_invoices');
        this.secret = nconf.get("payment:blockchain:secret");
        this.payments = db.db.collection('webGold_invoices');
    }


    getInvoices(userID) {
        console.log("Getting invoice list for",userID); //   wrioID: userID
        return new Promise((resolve,reject) => {
            this.payments.find({_id:userID}).toArray((err,res) => {

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

           try {

               let invoice = new Invoice();
               let invoiceID = await invoice.createInvoice(wrioID);
               let callback = 'http://webgold.wrioos.com/api/blockchain/callback/?nonce='+invoiceID + '&secret='+ this.secret;
               let api_request = "https://blockchain.info/ru/api/receive?method=create&address=" + this.receivingAdress + "&callback="+ encodeURIComponent(callback);

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

                await invoice.updateInvoiceData({
                    input_address: result.body.input_address,
                    destination: result.body.destination,
                    fee_percent: result.body.fee_percent,
                    callback: result.body.callback,
                    'state': 'request_sent'
                });



                resolve({
                    adress: result.body.input_address,
                    amount: 0.0
                });
            } catch(e) {
                console.log("Blockchain API request failed",e);
                dumpError(e);
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
        var userID = await getLoggedInUser(request.sessionID);

        var blockchain = new BlockChain();
        var history = await blockchain.getInvoices(userID);
        console.log("History",history);
        response.send(history);

    } catch (e) {
        console.log("Caught error: ",e);
        dumpError(e);
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

        //var userId = User.userID;
        var userId = User._id;

        console.log("Logged in user:",userId);

        if (!userId) {
            response.status(400).send({"error":"This user has no userID, exiting"})
            return;
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