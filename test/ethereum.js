import WebGold from '../src/server/ethereum.js';
import {db as dbMod} from 'wriocommon';var db = dbMod.db;
import {utils} from 'wriocommon'; const dumpError = utils.dumpError;

dbMod.init().then(async(db)=> {


    try {
        var wg = new WebGold(db);
        var hex = await wg.makeDonateTx("0x59aE5534Ed5587b47924CFDD93872d087F121443","0x59aE5534Ed5587b47924CFDD93872d087F121443",10);
        console.log(hex);
    } catch(e) {
       dumpError(e);
    }


});

