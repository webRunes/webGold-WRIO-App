const nconf = require('../../src/server/utils/wrio_nconf');
const request = require('supertest');
const assert = require('assert');
const should = require('should');

const Invoices = require('../../src/server/models/invoice.js');
const Users = require('../../src/server/models/wriouser.js');
const fixtures = require('./fixtures.js');
const init_serv = require('../../src/server/index.js');
const {ObjectID} = require('mongodb');

var stdout_write = process.stdout._write,
    stderr_write = process.stderr._write;

process.stdout._write = stdout_write;
process.stderr._write = stderr_write;

var app;

async function generateFakeSession(userID) {
    const db = require('wriocommon').db.getInstance();
    let sessions = db.collection('sessions');
    let item = generateFakeSession(userID);
    await sessions.insertOne(item)
}

/*
 Clears test db records when unit testing (promised)
 DON'T use in production environment !!!!
 */

async function clearTestDb() {
    const db = require('wriocommon').db.getInstance();
    var sessions = db.collection('sessions');
    if (db.s.databaseName != "webrunes_test") {
        throw new Error("Wipe can be made only on test db");
    }
    await sessions.remove({});
    return "Wipe ok";
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




var createTestDB = async (app) => {
    var invoice = new Invoices();
    var users = new Users();

    await users.clearTestDb();
    await invoice.clearTestDb();
    await clearTestDb();

    var user = await users.create({
        "_id": ObjectID(testObjId),
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


var dbready = async () => {
   app = await init_serv();
   return app

};

module.exports = {
    dbready,
    generateFakeSession,
    clearTestDb
}