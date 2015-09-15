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
        console.log("Updating invoice with", invoice_data);
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

class BlockChain {
    constructor(options) {
        this.receivingAdress = nconf.get("payment:blockchain:receivingAdress");
        this.payments = db.db.collection('webGold_invoices');
        this.secret = nconf.get("payment:blockchain:secret");

        if (!this.receivingAdress || !this.secret) {
            throw "Blockchain.info configuration is not defined, please edit config.json to fix";
        }

        this.payments = db.db.collection('webGold_invoices');
    }


    getInvoices(userID) {
        console.log("Getting invoice list for",userID); //   wrioID: userID
        return new Promise((resolve,reject) => {
            this.payments.find({userID:db.ObjectID(userID)}).toArray((err,res) => {

                if (err) {
                    reject();
                } else {
                    resolve(res);
                }
            })
        });

    }

    request_payment(wrioID,amount)  {
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
                    'state': 'request_sent',
                    'requested_amount': amount
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

    handle_callback(req,resp) {
        return new Promise(async (resolve, reject) => {

            try {
                let secret = decodeURIComponent(req.query.secret);
                let nonce = req.query.nonce;
                let invoice_id = req.query.invoice_id;
                let transaction_hash = req.query.transaction_hash;
                let input_transaction_hash = req.query.input_transaction_hash;
                let input_address = req.query.input_address;
                let value = req.query.value; // value in satoshi
                let confirmations = req.query.confirmations;
                console.log("GOT CALLBACK FROM BLOCKCHAIN API: ",req.query);

                if (secret != this.secret) {
                    resp.status(403).send("");
                    console.log("ERROR: wrong secret");
                    return;
                }
                if (!nonce) {
                    resp.status(400).send("");
                    console.log("ERROR: nonce not provided");
                    return;
                }

                if (!invoice_id || !transaction_hash || !input_transaction_hash || !input_address || !value || !confirmations) {
                    resp.status(400).send("");
                    console.log("ERROR: missing required parameters");
                    return;

                }

                let invoice = new Invoice();
                var invoice_data = await invoice.getInvoice(nonce);
                console.log(invoice_data);


                console.log(invoice_data.input_addres, input_address);
                if (invoice_data.input_address != input_address) {
                    console.log("Wrong input address");
                    resp.status(403).send("");
                    return;
                }

                await invoice.updateInvoiceData({
                    amount: value,
                    invoice_id: invoice_id,
                    transaction_hash: transaction_hash,
                    input_transaction_hash: input_transaction_hash,
                    state: `payment_checking`

                });

                if (confirmations > 5) {
                    await invoice.updateInvoiceData({
                       state: "payment_confirmed"
                    });
                    resp.status(200).send("*ok*");
                    return;
                }

                resp.status(200).send("confirmation_received");


            } catch (e) {
                reject(e)
            }
        });
    }
}

router.get('/callback',async (request,response) => {
    try {
        var blockchain = new BlockChain();
        await blockchain.handle_callback(request,response);
    } catch(e) {
        console.log("Callback failed",e);
        dumpError(e);
        response.status(400).send({"error":"API operation failed"});
    }
});

router.post('/payment_history', async (request,response) => {

    try {
        var userID = await getLoggedInUser(request.sessionID);

        var blockchain = new BlockChain();
        var history = await blockchain.getInvoices(userID._id);
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
            response.status(400).send({"error":"This user has no userID, exiting"});
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


        blockchain.request_payment(userId, amount).then(function (resp) {
            console.log("Resp",resp);
            response.send(resp);
        },function (err) {
            response.status(400).send({"error": "error processing your request "+err});
        });

    });

});

export default router;