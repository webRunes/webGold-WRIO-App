
import KeyStore from '../src/client/js/crypto/keystore';
import assert from 'assert';
import should from 'should';
import {expect} from 'chai';
import noncetracker from '../src/server/models/noncetracker.js';

describe('Check db models',() => {

    before(()=>{
    });

    it('should generate seed using entropy string',async () => {
       let nt = new noncetracker();
       await nt.create('0x12345',0);
       await nt.create('0x12345',1);
        await nt.create('0x12345',2);
       let lastnonce = await nt.getSavedNonce('0x12345');
       expect(lastnonce).to.equal(2);

    });


});

