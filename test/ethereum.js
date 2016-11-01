import WebGold from '../src/server/ethereum.js';
import {db as dbMod} from 'wriocommon';var db = dbMod.db;
import {utils} from 'wriocommon'; const dumpError = utils.dumpError;
import BigNumber from 'bignumber.js';
import Const from '../src/constant.js';
import {expect} from 'chai';
import CurrencyConverter from '../src/currency.js';

const wei = Const.WEI;
const SATOSHI = Const.SATOSHI;

var db;
var wg;
var converter;
describe("Blockchain unit tests", () => {

    before(async() => {
        db = await dbMod.init();
        wg = new WebGold(db);
        converter = new CurrencyConverter(30);
    });

   /* it ('should be able to create donate TX', async (done) => {
        try {
            let hex = await wg.makeDonateTx("0x59aE5534Ed5587b47924CFDD93872d087F121443","0x59aE5534Ed5587b47924CFDD93872d087F121443",10);
            console.log("TX created",hex);

            console.log("\nCreating presale....\n");
            await wg.logPresale("denso.ffff@mail.ru",0x59aE5534Ed5587b47924CFDD93872d087F121443,22,44);


            done();
        } catch(e) {
           // dumpError(e);
            console.log("Error",e);
            done();
        }
    });*/


    it('should be able to convert units correctly to WRG', () => {
        const btc = new BigNumber(SATOSHI / 10);
        const btcUsdRate = new BigNumber(600);
        const rate = converter.getRateDefault(btcUsdRate);
        let wrg = converter.convertBTCtoWRG(btc,rate).toString();
        expect(wrg).to.equal('2000');

    });
    it('should be able to convert currency units correctly to BTC', () => {
        let wrg = new BigNumber(2000);
        const btcUsdRate = new BigNumber(600);
        const rate = converter.getRateDefault(btcUsdRate);
        let BTC = converter.convertWRGtoBTC(wrg,rate).div(SATOSHI).toString();
        expect(BTC).to.equal('0.1');

        let usdSum = converter.wrgToUSD(wrg);
        expect(usdSum).to.equal('60');

    });
});








