var app = require("../server.js");
var request = require('supertest');
var assert = require('assert');
var should = require('should');
var nconf = require('../app/server/wrio_nconf');

var stdout_write = process.stdout._write,
    stderr_write = process.stderr._write;

process.stdout._write = stdout_write;
process.stderr._write = stderr_write;

var ready = false;
app.ready = function() {
    ready = true;
};


describe("API unit tests", function() {
    before(function (done) {
        setInterval(function() {
            if (ready) {
                console.log("App ready, starting tests");
                done();
                clearInterval(this);
            }

        }, 1000);
    });
    it ("should fail with blockchain callback with wrong secret",function (done){
        request(app)
            .get('/api/blockchain/callback?secret=fffddsdf')
            .expect(403,done);
    });

    it ("should fail with blockchain callback with no nonce",function (done){
        let secret = nconf.get("payment:blockchain:secret");
        request(app)
            .get('/api/blockchain/callback?secret='+encodeURIComponent(secret))
            .expect(400,done);
    });

    it ("should fail with blockchain callback with wrong nonce",function (done){
        let secret = nconf.get("payment:blockchain:secret");
        request(app)
            .get('/api/blockchain/callback?secret='+encodeURIComponent(secret)+"&nonce=2323232")
            .expect(400,done);
    });

    it ("should succed with blockchain callback with correct nonce",function (done){
        let secret = nconf.get("payment:blockchain:secret");
        let trparams = '&invoice_id=2223232&transaction_hash=323232&input_transaction_hash=2323232&input_address=32323&value=56&confirmations=2'
        request(app)
            .get('/api/blockchain/callback?secret='+encodeURIComponent(secret)+"&nonce=2f0ed092-2baa-498d-a303-98f0d98dfc78"+trparams)
            .expect(200,done);
    });
    it ("should send  *ok* when 6 confirmations received",function (done){
        let secret = nconf.get("payment:blockchain:secret");
        let trparams = '&invoice_id=2223232&transaction_hash=323232&input_transaction_hash=2323232&input_address=32323&value=56&confirmations=7'
        request(app)
            .get('/api/blockchain/callback?secret='+encodeURIComponent(secret)+"&nonce=2f0ed092-2baa-498d-a303-98f0d98dfc78"+trparams)
            .expect("*ok*")
            .expect(200,done);
    });

});

/**
 * Created by michbil on 14.09.15.
 */
