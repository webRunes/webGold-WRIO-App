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
import WebRunesUsers from './wriouser'

let wei = 1000000000000000000;
let min_amount = 0.002; //0.002// ETH, be sure that each ethereum account has this minimal value to have ability to perform one transaction

async function ensureMinimumEther(webGold,user,dest) { //TODO: add ethereum queue for adding funds, to prevent multiple funds transfer
    var ethBalance = await webGold.getEtherBalance(user.ethereumWallet);
    if (ethBalance < min_amount) {
        console.log("Adding minium ethere amount",ethBalance);
        await webGold.etherTransfer(dest,min_amount);
    } else {
        console.log("Account has minimum ether, cancelling");
    }
}


router.get('/free_wrg',async (request,response) => {  // TODO: remove this method
    console.log("  =====  WARING: FREE WRG CALLED, ONLY FOR DEBUGGING PURPOSES ====  ");
    try {

        var amount = parseInt(request.query.amount);
        console.log(typeof amount);
        if (typeof amount !== "number") {
            throw new Error("Can't parse amount");
        }

        var user = await getLoggedInUser(request.sessionID);
        if (user.wrioID) {
            var webGold = new WebGold(db.db);
            var dest = await webGold.getEthereumAccountForWrioID(user.wrioID);
            await webGold.coinTransfer(web3.eth.accounts[0],dest,amount);

            await ensureMinimumEther(webGold,user,dest);

            response.send("Successfully sent "+amount);
        } else {
            throw new Error("User has no vaid userID, sorry");
        }
    } catch(e) {
        console.log("Errro during free_wrg",e);
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

        var user = await getLoggedInUser(request.sessionID);
        if (user.wrioID) {
            var webGold = new WebGold(db.db);
            var dest = await webGold.getEthereumAccountForWrioID(to);
            var src = await webGold.getEthereumAccountForWrioID(user.wrioID);

            await webGold.unlockByWrioID(user.wrioID);

            console.log("Prepare for transfer",dest,src,amount);
            await webGold.coinTransfer(src,dest,amount);

            //await ensureMinimumEther(webGold,user,src);

            response.send("Successfully sent sum",amount,"from",src, "to",dest);
        } else {
            throw new Error("User has no vaid userID, sorry");
        }

    } catch(e) {
        console.log("Errro during donate",e);
        response.status(403).send("Error");
    }

});

router.post('/get_ballance',async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
        if (user.wrioID) {
            var webGold = new WebGold(db.db);
            var dest = await webGold.getEthereumAccountForWrioID(user.wrioID);
            var ballance = await webGold.getBalance(dest);
            console.log("ballance:",ballance.toString());
            response.send({
                "ballance": ballance.toString()
            })
        } else {
            throw new Error("User has no vaid userID, sorry");
        }
    } catch(e) {
        console.log("Errro during get_ballance",e);
        response.status(403).send("Error");
    }

});


router.get('/coinadmin/master', async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
        if (user.wrioID == "819702772935") { // TODO : change to something more elegant
            console.log("Coinadmin admin detected");
            var webGold = new WebGold(db.db);
            var wrgBalance = await webGold.getBalance(web3.eth.accounts[0]);
            var ethBalance = await webGold.getEtherBalance(web3.eth.accounts[0]);

            var gasprice = web3.eth.gasPrice;

            response.send({
                "ethBalance": ethBalance / wei,
                "wrgBalance": wrgBalance,
                "gasPrice": gasprice / wei
            });
        } else {
            throw new Error("User not admin,sorry");
        }
    } catch(e) {
        console.log("Coinadmin error",e);
        response.status(403).send("Error");
    }
});

router.get('/coinadmin/users', async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);
        if (user.wrioID == "819702772935") { // TODO : change to something more elegant
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
                        wrgBalance: await webGold.getBalance(user.ethereumWallet)
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