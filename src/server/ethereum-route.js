/**
 * Created by michbil on 26.09.15.
 */
/**
 * Created by michbil on 26.09.15.
 */

import WebGold from './ethereum.js'
import {calc_percent,dumpError} from './utils'
import web3 from 'web3'
import {Promise} from 'es6-promise'
import {Router} from 'express';
import {loginWithSessionId,getLoggedInUser} from './wriologin';
import db from './db';
const router = Router();
import WebRunesUsers from './dbmodels/wriouser'
import nconf from './wrio_nconf';
import BigNumber from 'bignumber.js';
import Donations from './dbmodels/donations.js'
import Emissions from './dbmodels/emissions.js'
import EtherFeeds from './dbmodels/etherfeed.js'
import Invoices from "./dbmodels/invoice.js"
//import PrePayment from './dbmodels/prepay.js'
import WrioUser from "./dbmodels/wriouser.js"



let MAX_DEBT = -500*100; // maximum allowed user debt to perfrm operations

let wei = 1000000000000000000;
let min_amount = 0.02; //0.002// ETH, be sure that each ethereum account has this minimal value to have ability to perform one transaction

let masterAccount = nconf.get("payment:ethereum:masterAdr");
let masterPassword = nconf.get("payment:ethereum:masterPass");
if (!masterAccount) {
    throw new Error("Can't get master account address from config.json");
}
if (!masterPassword) {
    throw new Error("Can't get master account password from config.json");
}





router.get('/free_wrg',async (request,response) => {  // TODO: remove this method
    console.log("  =====  WARING: FREE WRG CALLED, ONLY FOR DEBUGGING PURPOSES ====  ");
    try {

        var amount = parseInt(request.query.amount);
        console.log(typeof amount);
        if (typeof amount !== "number") {
            throw new Error("Can't parse amount");
        }

        amount *= 100;

        var user = await getLoggedInUser(request.sessionID);
        if (!user) throw new Error("User not registered");
        if (user.wrioID) {
            var webGold = new WebGold(db.db);
            await webGold.emit(user.ethereumWallet, amount, user.wrioID);

            response.send("Successfully sent "+amount);
        } else {
            throw new Error("User has no vaid userID, sorry");
        }
    } catch(e) {
        console.log("Errro during free_wrg ",e);
        dumpError(e);
        response.status(403).send("Error");
    }

});





/*
    Donate API request
    parameters to: recipient WRIO-ID
    amount: amount to donate, in WRG
    sid: user's session id

 */



router.get('/donate',async (request,response) => { // TODO : add authorization, important !!!!
    try {
        var to = request.query.to;
        var amount = parseInt(request.query.amount) * 100;
        if (typeof amount !== "number") {
            throw new Error("Can't parse amount");
        }
        if (amount < 0) {
            throw new Error ("Amount can't be negative");
        }

        var sid = request.query.sid || '';

        var user = await getLoggedInUser(sid);
        if (!user) throw new Error("User not registered");
        if (user.wrioID) {
            var webGold = new WebGold(db.db);

            var dest = await webGold.getEthereumAccountForWrioID(to); // ensure that source adress and destination adress have ethereum adress
            var src = await webGold.getEthereumAccountForWrioID(user.wrioID);

            if (dest === src) {
                throw new Error("Can't donate to itself");
            }

            var dbBalance = user.dbBalance || 0;
            var blockchainBalance = await webGold.getBalance(src);
            blockchainBalance = blockchainBalance.toString();

            console.log("Checking balance before donation",amount,blockchainBalance);


            if (amount > blockchainBalance) {
                // Do virtual payment to the database record because user has insufficient funds
                // when funds arrive on the account, pending payments will be done

                if ((dbBalance-amount) < MAX_DEBT ) { // check if we havent reached maximum debt limit
                    throw new Error("Insufficient funds");
                }

                var userObj = new WrioUser();
                await userObj.createPrepayment(user.wrioID,-amount,to);

                console.log("Prepayment made");


            } else {

                // Make the real payment through the blockchain
               await webGold.makeDonate(user, to, amount);

            }
            var amountUser = amount*calc_percent(amount)/100;
            var fee = amount - amountUser;


            response.send({
                "success":true,
                "dest":dest,
                "src":src,
                amount:amount,
                amountUser: amountUser,
                fee:fee,
                feePercent:calc_percent(amount)
            });
        } else {
            throw new Error("User has no valid userID, sorry");
        }

    } catch(e) {
        console.log("Error during donate",e);
        dumpError(e);
        if (!e) e = "null";
        var textResult = e.toString();
        response.status(403).send({"error":textResult});
    }

});

router.post('/get_balance',async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
        if (!user) throw new Error("User not registered");
        if (user.wrioID) {

            // try to get temp balance stored in db record

            var dbBalance = new BigNumber(0);
            if (user.balance) {
                dbBalance = new BigNumber(user.balance);
            }

            console.log("balance from db:", dbBalance.toString());

            var webGold = new WebGold(db.db);



            var dest = await webGold.getEthereumAccountForWrioID(user.wrioID);
            var balance = await webGold.getBalance(dest) / 100;

            var bal = balance;

            if (user.dbBalace) { // adjust sum if we have pending payments
                bal -=  (user.dbBalance/100);
            }


            //console.log("balance:",balance.add(dbBalance).toString());
            response.send({
                "balance": bal
            })

            await webGold.processPendingPayments(user,balance*100);


        } else {
            throw new Error("User has no vaid userID, sorry");
        }
    } catch(e) {
        console.log("Errro during get_balance",e);
        dumpError(e);
        response.status(403).send("Error");
    }

});

function auth(id) {
    if ((id == "819702772935") || (id == "713372365175")) {
        return true;
    }
    return false;
}

router.get('/coinadmin/master', async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
        if (!user) throw new Error("User not registered");
        if (auth(user.wrioID)) {
            console.log("Coinadmin admin detected");
            var webGold = new WebGold(db.db);
            var wrgBalance = await webGold.getBalance(masterAccount);
            var ethBalance = await webGold.getEtherBalance(masterAccount);

            var gasprice = web3.eth.gasPrice;

            response.send({
                "ethBalance": ethBalance / wei,
                "wrgBalance": wrgBalance / 100,
                "gasPrice": gasprice / wei
            });
        } else {
            throw new Error("User not admin,sorry");
        }
    } catch(e) {
        console.log("Coinadmin error",e);
        dumpError(e);
        response.status(403).send("Error");
    }
});

router.get('/coinadmin/users', async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
        if (!user) throw new Error("User not registered");
        if (auth(user.wrioID)) {
            console.log("Coinadmin admin detected");
            var webGold = new WebGold(db.db);
            var wrioUsers = new WebRunesUsers(db.db);
            var users = await wrioUsers.getAllUsers();
            var wgUsers = [];
            for (var user of users) {
                console.log(user);
                if (user.wrioID && user.ethereumWallet) {

                    wgUsers.push ({
                        wrioID: user.wrioID,
                        name: user.lastName,
                        ethWallet: user.ethereumWallet,
                        dbBalance: -(user.dbBalance || 0) / 100,
                        ethBalance: await webGold.getEtherBalance(user.ethereumWallet) / wei,
                        wrgBalance: await webGold.getBalance(user.ethereumWallet) / 100,
                        prepayments: user.prepayments || []
                    });
                }
            }

            response.send(wgUsers);
        } else {
            throw new Error("User not admin,sorry");
        }
    } catch(e) {
        console.log("Coinadmin error",e);
        dumpError(e);
        response.status(403).send("Error");
    }
});

/*
router.get('/coinadmin/prepayments', async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
        if (!user) throw new Error("User not registered");
        if (auth(user.wrioID)) {
            console.log("Coinadmin admin detected");
            var p = new PrePayment();
            var prepayments = await p.getAll();

            response.send(prepayments);
        } else {
            throw new Error("User not admin,sorry");
        }
    } catch(e) {
        console.log("Coinadmin prepayments error",e);
        dumpError(e);
        response.status(403).send("Error");
    }
});*/

router.get('/coinadmin/etherfeeds', async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
        if (!user) throw new Error("User not registered");
        if (auth(user.wrioID)) {
            console.log("Coinadmin admin detected");
            var d = new EtherFeeds();
            var ethFeeds = await d.getAll();

            response.send(ethFeeds);
        } else {
            throw new Error("User not admin,sorry");
        }
    } catch(e) {
        console.log("Coinadmin ethFeed error",e);
        dumpError(e);
        response.status(403).send("Error");
    }
});


router.get('/coinadmin/donations', async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
        if (auth(user.wrioID)) {
            console.log("Coinadmin admin detected");
            var d = new Donations();
            var data = await d.getAll();

            response.send(data);
        } else {
            throw new Error("User not admin,sorry");
        }
    } catch(e) {
        console.log("Coinadmin donations error",e);
        dumpError(e);
        response.status(403).send("Error");
    }
});


router.get('/coinadmin/emissions', async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
        if (auth(user.wrioID)) {
            console.log("Coinadmin admin detected");
            var d = new Emissions();
            var data = await d.getAll();

            response.send(data);
        } else {
            throw new Error("User not admin,sorry");
        }
    } catch(e) {
        console.log("Coinadmin emissions error",e);
        dumpError(e);
        response.status(403).send("Error");
    }
});

router.get('/coinadmin/invoices', async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
        if (auth(user.wrioID)) {
            console.log("Coinadmin admin detected");
            var d = new Invoices();
            var data = await d.getAll();

            response.send(data);
        } else {
            throw new Error("User not admin,sorry");
        }
    } catch(e) {
        console.log("Coinadmin emissions error",e);
        dumpError(e);
        response.status(403).send("Error");
    }
});


router.post('/get_exchange_rate',async (request,response) => {
  response.send("10");
});



/*
console.log("App start");
init().then(async (database) => {
    console.log("Database init");
    await operate(database);

}).catch((err)=>{
    console.log("Failed to init db",err);
});*/


export default router;