/**
 * Created by michbil on 06.12.15.
 */

import {Promise} from 'es6-promise';
import {db as dbMod} from '../common';var db = dbMod.db;
import WebRunesUsers from '../models/wriouser';
import Donations from '../models/donations.js';
import Emissions from '../models/emissions.js';
import EtherFeeds from '../models/etherfeed.js';
import Invoices from "../models/invoice.js";
import WrioUser from "../models/wriouser.js";
import logger from 'winston';

var decodeUserNames = async (names) => {
    var nameHash = {};
    var users = await getUserNames(names);
    for (var i in users) {
        var user = users[i];
        nameHash[user.wrioID]=user.lastName;
    }
    return nameHash;
};

var getUserNames = async (names)=> {
    var Users = new WrioUser();
    var query = {
        wrioID : {
            $in: names
        }
    };

    return await Users.getAllUsers(query);

};

export const prepayments = async (request,response) => {
    var user = request.user;
    var Users = new WrioUser(db.db);

    // search in User arrays for prepayments designated for us

    var prepQuery = {
        prepayments:
        {
            $elemMatch:
            {
                to: user.wrioID
            }
        }
    };

    var matchingUsers = await Users.getAllUsers(prepQuery);

    var names = [user.wrioID];
    var prepayments = [];

    if (user.widgets) { // add user's pening payments to the output list
        prepayments = prepayments.concat(user.widgets.map((item)=>{
            item.from = user.wrioID;
            item.incoming = false;
            names.push(item.to);
            return item;
        }));
    }

    matchingUsers.map((u) => {
        names.push(u.wrioID);
        var payments = u.widgets.map((item)=> {
            item.from = u.wrioID; // add from reference
            item.incoming = true;
            return item;
        });
        prepayments = prepayments.concat(payments);
    });

    var nameHash = await decodeUserNames(names);

    response.send(prepayments.map((pre) => {
        logger.debug(user.wrioID, pre);
        if ((pre.to == user.wrioID) || (pre.from == user.wrioID)) {
            logger.debug("MATCH");
            return {
                id: pre.id,
                incoming: pre.incoming,
                amount:-pre.amount,
                timestamp: pre.timestamp,
                srcName:nameHash[pre.from],
                destName:nameHash[pre.to]
            };
        }
    }));
};

export const donations = async (request,response) => {
    var user = request.user;
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
    var nameHash = await decodeUserNames(names);
    data = data.map((item)=> {
        item.destName = nameHash[item.destWrioID];
        item.srcName = nameHash[item.srcWrioID];
        return item;
    });
    response.send(data);

};