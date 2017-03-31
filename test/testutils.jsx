import nconf from '../src/server/utils/wrio_nconf';
import app from "../src/server/index.js";
import request from 'supertest';
import assert from 'assert';
import should from 'should';

import {db as dbMod} from '../src/server/common';var db = dbMod.db;
import Invoices from '../src/server/models/invoice.js'
import Users from '../src/server/models/wriouser.js'
import apitest from "./apitest"

var stdout_write = process.stdout._write,
    stderr_write = process.stderr._write;

process.stdout._write = stdout_write;
process.stderr._write = stderr_write;

var ready = false;
app.ready = () => {
    ready = true;
};

export function generateFakeSession(userID) {
    var sessions = db.db.collection('sessions');

    return new Promise((resolve,reject) => {
        var item = {
            _id: "--QGt2nm4GYtw3a5uIRoFQgmy2-fWvaW",
            expires: new Date(909090909090990),
            session: JSON.stringify({
                cookie: {
                    "originalMaxAge": 0,
                    expires: "2025-11-22"
                },
                passport: {
                    user: userID
                }
            })
        };

        sessions.insertOne(item,(err,res) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });

}

/*
 Clears test db records when unit testing (promised)
 DON'T use in production environment !!!!
 */

export function clearTestDb() {
    var sessions = db.db.collection('sessions');
    return new Promise((resolve,reject) => {


            if (db.db.s.databaseName != "webrunes_test") {
                return reject("Wipe can be made only on test db");
            }
            sessions.remove({},(err) => {
                if (err)  {
                    return reject(err);
                }
                resolve("Wipe ok");
            });
        }

    );
}


function waitdb() {
    return new Promise((resolve,reject) => {
        setInterval(function() {
            if (ready) {
                console.log("App ready, starting tests");
                resolve();
                clearInterval(this);
            }

        }, 1000);
    });

}


var serialize = (obj) => {
    var str = [];
    for(var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
};

let testObjId = "55da495d0d925e152e73f5f6";
let testID = '1234567890';
let input_address = "30450221008949f0cb400094ad2b5eb3";
let destination = 'b388ab8935022079656090d7f6bac4c9';
var invoiceID;

var prepareDb = async () => {
    await waitdb();
};

var createTestDB = async () => {
    var invoice = new Invoices();
    var users = new Users();

    await users.clearTestDb();
    await invoice.clearTestDb();
    await clearTestDb();

    var user = await users.create({
        "_id": db.ObjectID(testObjId),
        "wrioID": testID,
        "titterID": "186910661",
        "lastName": "John Doe",
        "ethereumWallet": "0xc40e6bd934b31b312bfe55441fc086b19aa4df4d"
    });
    invoiceID = await invoice.createInvoice(user._id,user.wrioID);
    await invoice.updateInvoiceData({
        input_address: input_address,
        destination: destination,
        fee_percent: 0,
        callback: '',
        'state': 'request_sent',
        'requested_amount': "13131131313"

    });

    app.override_session.sid = "--QGt2nm4GYtw3a5uIRoFQgmy2-fWvaW";
    await generateFakeSession(user._id);

    console.log(invoiceID);
};


export var dbready = async (cb) => {

   await prepareDb();
   cb(app,db);

};
export var testDbReady = async (cb) => {

    await prepareDb();
   // await createTestDB();
    cb(app,db);

};

