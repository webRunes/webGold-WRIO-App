import request from 'superagent';
import nconf from './wrio_nconf';
import uuid from 'node-uuid';
import {Router} from 'express';
import {loginWithSessionId,getLoggedInUser} from './wriologin';
import {dumpError} from './utils';
import BigNumber from 'bignumber.js';
import {init} from './db';
import WebGold from './ethereum'
import db from './db';
import Invoice from './dbmodels/invoice.js'
import User from './dbmodels/wriouser.js'


const router = Router();

/* Blockchain.info client for bitcoin payments */

export class BlockChain {
    constructor(options) {
        console.log("Creating blockchain object");
        this.receivingAdress = nconf.get("payment:blockchain:receivingAdress");
        this.payments = db.db.collection('webGold_invoices');
        this.secret = nconf.get("payment:blockchain:secret");

        if (!this.receivingAdress || !this.secret) {
            throw "Blockchain.info configuration is not defined, please edit config.json to fix";
        }

        this.payments = db.db.collection('webGold_invoices');
        this.webgold = new WebGold(db.db);
        this.get_rates().then((res)=>{
            console.log("Got current rates from blockhain API",res.toString());
        })
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

    async get_rates() {
        try {

            var isInTest = typeof global.it === 'function';

            if (isInTest) {
                return new BigNumber(433.0);
            }

            let api_request = "https://blockchain.info/ru/ticker";
            console.log("Sending get_rates request",api_request);
            var result = await request.post(api_request);

            return new BigNumber(result.body.USD.buy);

        }
        catch(e) {
            console.log("get_rates request failed",e);
            dumpError(e);

            }

        }

    request_payment(userID,wrioID,amount)  {
        return new Promise(async (resolve,reject) => {

           try {

               let invoice = new Invoice();
               let invoiceID = await invoice.createInvoice(userID,wrioID);
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
                    amount: amount
                });
            } catch(e) {
                console.log("Blockchain API request failed",e);
                dumpError(e);
                reject(e)
            }
        });

    }

    handle_callback(req,resp) {
        var that = this;
        return new Promise(async (resolve, reject) => {
            try {
                let secret = decodeURIComponent(req.query.secret);
                let nonce = req.query.nonce;
                let transaction_hash = req.query.transaction_hash;
                let input_transaction_hash = req.query.input_transaction_hash;
                let input_address = req.query.input_address;
                let value = req.query.value; // value in satoshi
                let confirmations = req.query.confirmations;
                let test = req.query.test;
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

                let invoice = new Invoice();
                var invoice_data = await invoice.getInvoice(nonce);
                console.log("Got invoice ID:",invoice_data);

                await invoice.recordAction({
                    "request":req.query,
                    "timestamp": new Date()
                });

                var user = new User();
                user = await user.getByWrioID(invoice_data.wrioID);


                if ( !transaction_hash || !input_transaction_hash || !input_address || !value || !confirmations) {
                    resp.status(400).send("");
                    console.log("ERROR: missing required parameters");
                    return;

                }

                console.log("Comparing input adress from invoice",invoice_data.input_address, input_address);
                if (invoice_data.input_address != input_address) {
                    console.log("Wrong input address");
                    resp.status(403).send("");
                    return;
                }

                await invoice.updateInvoiceData({
                    amount: value,
                    transaction_hash: transaction_hash,
                    input_transaction_hash: input_transaction_hash,
                    state: `payment_checking`

                });

                if (test) { // if test request, don't do anything with user account
                    console.log("This is only a test, don't doing anything furthermore");
                    resp.status(200).send("test_received");
                    return;
                }

                if (confirmations > 5) { // if there's more than 5 confirmations
                    await invoice.updateInvoiceData({
                       state: "payment_confirmed"
                    });
                    var wrg = this.webgold.convertBTCtoWRG(new BigNumber(value),await this.get_rates());
                    wrg = wrg.times(100).toFixed(0); // multipy 100 and round to make value in centiWRG
                    await this.generateWrg(user.ethereumWallet, parseInt(wrg), user.wrioID); // send ether to user
                    console.log(wrg,"WRG was emitted");
                    resp.status(200).send("*ok*"); // send success to blockchain.info server
                    return;
                }
                console.log("**Confirmation recieved",confirmations);
                resp.status(200).send("confirmation_received");



            } catch (e) {
                reject(e)
                console.log("Error during blockchain callback: ",e);
            }
        });
    }

    async generateWrg(who,amount,id) {
        var isInTest = typeof global.it === 'function';
        if (isInTest) {
            console.log(" ====  Mocking emission of WRG ==== ");
            return;
        } else {
            return await this.webgold.emit(who, amount, id); // send ether to user
        }

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
       // console.log("History",history);
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

        //var userId =   User.userID;
        var userId = User._id;
        var wrioId = User.wrioID;

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


        blockchain.request_payment(userId, wrioId, amount).then(function (resp) {
            console.log("Resp",resp);
            response.send(resp);
        },function (err) {
            response.status(400).send({"error": "error processing your request "+err});
        });

    });

});

export default router;