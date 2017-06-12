const nconf = require('../src/server/utils/wrio_nconf');
const request = require('supertest');
const assert = require('assert');
const should = require('should');
const {ObjectID}  = require('mongodb');


var stdout_write = process.stdout._write,
    stderr_write = process.stderr._write;

process.stdout._write = stdout_write;
process.stderr._write = stderr_write;

var app;


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
let address = "30450221008949f0cb400094ad2b5eb3";
let destination = 'b388ab8935022079656090d7f6bac4c9';
var invoiceID;
let db,generateFakeSession,clearTestDb;

describe("Blockchain unit tests", function() {
    before(async () => {
        const init_serv = require('../src/server/index.js');
        const Presale = require('../src/server/models/presale.js');
        const Users = require('../src/server/models/wriouser.js');
        var {generateFakeSession,clearTestDb} = require('./utils/testutils.js');

        app = await init_serv();
        db = require('wriocommon').db.getInstance();
        //var invoice = new Invoices();
        var invoice = new Presale();
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
        //invoiceID = await invoice.createInvoice(user._id,user.wrioID);
        invoiceID = await invoice.createPresale("user@mail.com","557cc6f312e9ebd45bebe06219b7bab87f8bc846");
        await invoice.updateInvoiceData({
            address: address,
            destination: destination,
            fee_percent: 0,
            callback: '',
            'state': 'request_sent',
            'requested_amount': "13131131313"

        });


        console.log(invoiceID);
    });
   it ("should fail with blockchain callback with wrong secret", (done) => {
        request(app)
            .get('/api/blockchain/callback?secret=fffddsdf')
            .expect(403,done);
    });



    it ("should fail with blockchain callback with no nonce",function (done){
        let secret = nconf.get("payment:blockchain_v2:secret");
        request(app)
            .get('/api/blockchain/callback?secret='+encodeURIComponent(secret))
            .expect(400,done);
    });

    it ("should fail with blockchain callback with wrong nonce",function (done){
        let secret = nconf.get("payment:blockchain_v2:secret");
        let tparams = {
            invoice_id: invoiceID,
            transaction_hash: "2323232",
            address:address,
            confirmations:2,
            secret:secret,
            nonce: "232323-11234-112-2",
            value:50000
        };
        let trurl = "/api/blockchain/callback?"+serialize(tparams);
        console.log("Transaction URL",trurl);
        request(app)
            .get(trurl)
            .expect(400,done);
    });

    it ("should succed with blockchain callback with correct nonce",function (done){
        let secret = nconf.get("payment:blockchain_v2:secret");
        let tparams = {
            invoice_id: invoiceID,
            transaction_hash: "2323232",
            address:address,
            confirmations:2,
            secret:secret,
            nonce: invoiceID,
            value:50000
        };
        let trurl = "/api/blockchain/callback?"+serialize(tparams);
        console.log("Transaction URL",trurl);
        request(app)
            .get(trurl)
            .expect("confirmation_received")
            .expect(200,done);
    });
    it ("should send  *ok* when 6 confirmations received",function (done){
        let secret = nconf.get("payment:blockchain_v2:secret");
        let tparams = {
            invoice_id: invoiceID,
            transaction_hash: "2323232",
            address:address,
            confirmations:7,
            secret:secret,
            nonce: invoiceID,
            value: 50000
        };
        let trurl = "/api/blockchain/callback?"+serialize(tparams);
        console.log("Transaction URL",trurl);
        request(app)
            .get(trurl)
            .expect("*ok*")
      .expect(200,done);
    });



});

/**
 * Created by michbil on 14.09.15.
 */
