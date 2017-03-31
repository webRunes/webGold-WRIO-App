import KeyStore from '../src/client/js/crypto/keystore';
import assert from 'assert';
import should from 'should';
import {expect} from 'chai';
import lightwallet from 'eth-lightwallet'

const SAMPLETX = 'f86a03850df8475800830651cf9497538850ad45948d983a66c3bb26e39b0b00603a80b844e69d849d000000000000000000000000f3ac2c9940735f4cee1fd46581573d1b4a5b41ae000000000000000000000000000000000000000000000000000000000000044c1c8080';
const SEED = "eagle today cause tenant buffalo whisper half nest safe private index solid";

describe('DEVTEST: should allow keystore changes',() => {

   before(()=>{
   });

    it('should generate seed using entropy string',() => {
        let seed = KeyStore.generateSeed('123');
        let wordnr = seed.split(' ');
        expect(wordnr.length).to.equal(12);
    });

    it('seed should generate exact ethereum address', (done)=> {
       let ks = new KeyStore();
        ks.extractKey(SEED,'123').
            then(ks.verifySeedAgainstEthId('0xff39e9e586c0398e27f97d8201b1c62ec20a0cb4')).
            then((result) => expect(result).to.equal(true)).
            then(()=>done())
            .catch(console.log);

    });
    it('should genereate same signing key from one seed with any password',(done) => {
        let ks = new KeyStore();
        let ks2 = new KeyStore();
        let key1Promise = ks.extractKey(SEED,"1dfsdfasdfsd2").then(ks.signTx(SAMPLETX));
        let key2Promise = ks.extractKey(SEED,"1231121212121").then(ks2.signTx(SAMPLETX));

        Promise.all([key1Promise,key2Promise]).then((txs)=>{
            console.log(txs);
            expect(txs[0]).to.equal(txs[1]);
            expect(txs[0]).to.not.equal(SAMPLETX);
            done();
        }).catch(console.log);

    })
});

