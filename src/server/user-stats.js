/**
 * Created by michbil on 06.12.15.
 */

import WebGold from './ethereum.js'
import {calc_percent,dumpError} from './utils'
import Web3 from 'web3'; var web3 = new Web3();
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



var getUserNames = async (names)=> {
    var Users = new WrioUser();
    var query = {
        wrioID : {
            $in: names
        }
    };

    return await Users.getAllUsers(query);

}


router.get('/donations', async (request,response) => {
    try {
        var user = await getLoggedInUser(request.sessionID);


        var d = new Donations();
        var query = {
            $or:[
                {srcWrioID: user.wrioID},
                {destWrioID: user.wrioID}
            ]
        };
        var data = await d.getAll(query);
        var names = [];
        data = data.map((item)=> {
            names.push(item.destWrioID);
            names.push(item.srcWrioID);
            if (item.destWrioID === user.wrioID) {
                item.incoming = true;
            } else {
                item.incoming = false;
            }
            return item;
        });
        // create mappings for usernames
        var nameHash = {};
        var users = await getUserNames(names);
        for (var i in users) {
            var user = users[i];
            nameHash[user.wrioID]=user.lastName;
        }

        data = data.map((item)=> {
            item.destName = nameHash[item.destWrioID];
            item.srcName = nameHash[item.srcWrioID];
            return item;
        });
        response.send(data);

    } catch(e) {
        console.log("Error getting donations",e);
        dumpError(e);
        response.status(403).send("Error");
    }
});


export default router;