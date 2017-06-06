
const KeyStore = require('../src/client/js/crypto/keystore');
const assert = require('assert');
const should = require('should');
const {expect} = require('chai');
const {init} = require('wriocommon').db;

describe('Check db models',() => {


    it('should generate seed using entropy string',async () => {
        const noncetracker = require('../src/server/models/noncetracker.js');

        await init();
       let nt = new noncetracker();
       await nt.create('0x12345',0);
       await nt.create('0x12345',1);
        await nt.create('0x12345',2);
       let lastnonce = await nt.getSavedNonce('0x12345');
       expect(lastnonce).to.equal(2);

    });


});

