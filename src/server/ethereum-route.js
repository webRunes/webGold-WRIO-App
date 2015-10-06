/**
 * Created by michbil on 26.09.15.
 */
/**
 * Created by michbil on 26.09.15.
 */

import WebGold from './ethereum.js'
import {dumpError} from './utils'
import web3 from 'web3'
import {Promise} from 'es6-promise'
import {Router} from 'express';
import {loginWithSessionId,getLoggedInUser} from './wriologin';
import db from './db';
const router = Router();
import WebRunesUsers from './dbmodels/wriouser'
import nconf from './wrio_nconf';

import Donations from './dbmodels/donations.js'
import Emissions from './dbmodels/emissions.js'
import EtherFeeds from './dbmodels/etherfeed.js'
import PrePayments from './dbmodels/prepay.js'



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
        if (user.wrioID) {
            var webGold = new WebGold(db.db);
            await webGold.emit(user.ethereumWallet,amount, user.wrioID);

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


router.get('/donate',async (request,response) => {
    try {
        var to = request.query.to;
        var amount = parseInt(request.query.amount);
        console.log(typeof amount);
        if (typeof amount !== "number") {
            throw new Error("Can't parse amount");
        }

        amount *= 100;

        var user = await getLoggedInUser(request.sessionID);
        if (user.wrioID) {
            var webGold = new WebGold(db.db);
            var dest = await webGold.getEthereumAccountForWrioID(to);
            var src = await webGold.getEthereumAccountForWrioID(user.wrioID);

            await webGold.unlockByWrioID(user.wrioID);

            console.log("Prepare for transfer",dest,src,amount);
            await webGold.donate(src,dest,amount);

            var d = new Donatate();
            await donate.create(user.wrioID,to,amount,0);

            //await ensureMinimumEther(webGold,user,src);

            response.send("Successfully sent sum",amount,"from",src, "to",dest);
        } else {
            throw new Error("User has no vaid userID, sorry");
        }

    } catch(e) {
        console.log("Errro during donate",e);
        dumpError(e);
        response.status(403).send("Error");
    }

});

router.post('/get_balance',async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
        if (user.wrioID) {
            var webGold = new WebGold(db.db);
            var dest = await webGold.getEthereumAccountForWrioID(user.wrioID);
            var balance = await webGold.getBalance(dest) / 100;
            console.log("balance:",balance.toString());
            response.send({
                "balance": balance.toString()
            })
        } else {
            throw new Error("User has no vaid userID, sorry");
        }
    } catch(e) {
        console.log("Errro during get_balance",e);
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
        if (auth(user.wrioID)) {
            console.log("Coinadmin admin detected");
            var webGold = new WebGold(db.db);
            var wrgBalance = await webGold.getBalance(masterAccount);
            var ethBalance = await webGold.getEtherBalance(masterAccount);

            var gasprice = web3.eth.gasPrice;

            response.send({
                "ethBalance": ethBalance / wei,
                "wrgBalance": wrgBalance/100,
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
                        ethBalance: await webGold.getEtherBalance(user.ethereumWallet) / wei,
                        wrgBalance: await webGold.getBalance(user.ethereumWallet) / 100
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

router.get('/coinadmin/donations', async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
        if (auth(user.wrioID)) {
            console.log("Coinadmin admin detected");
            var d = new Donations();
            var donations = await d.getAll();

            response.send(donations);
        } else {
            throw new Error("User not admin,sorry");
        }
    } catch(e) {
        console.log("Coinadmin donations error",e);
        dumpError(e);
        response.status(403).send("Error");
    }
});

router.get('/coinadmin/etherfeeds', async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
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


router.get('/coinadmin/prepayments', async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
        if (auth(user.wrioID)) {
            console.log("Coinadmin admin detected");
            var d = new PrePayments();
            var data = await d.getAll();

            response.send(data);
        } else {
            throw new Error("User not admin,sorry");
        }
    } catch(e) {
        console.log("Coinadmin prepayments error",e);
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