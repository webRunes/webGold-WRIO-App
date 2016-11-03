/**
 * Created by michbil on 15.10.16.
 */

import nconf from './wrio_nconf';
import request from 'superagent';

const net = 'testnet'; // 'api'

const sendRawTX = async (rawTx) => {
    const apiKey = nconf.get("payment:etherscan.io");
    const api_request = `https://${net}.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex=${rawTx}&apikey=${apiKey}`;
    console.log("Performing API send TX request", api_request);
    const result = await request.get(api_request);
    console.log(`Result ${result.body.result}`);
    return result.body.result;
};


const getTransactionCount = async (adr) => {
    const apiKey = nconf.get("payment:etherscan.io");
    const api_request = `https://${net}.etherscan.io/api?module=proxy&action=eth_getTransactionCount&address=${adr}&tag=latest&apikey=${apiKey}`;
    console.log("Performing getTransactionCount", api_request);
    const result = await request.get(api_request);
    console.log(`Result ${result.body.result}`);
    return result.body.result;
};


const getGasPrice = async () => {
    const apiKey = nconf.get("payment:etherscan.io");
    const api_request = `https://${net}.etherscan.io/api?module=proxy&action=eth_gasPrice&apikey=${apiKey}`;
    console.log("Performing getGasPrice", api_request);
    const result = await request.get(api_request);
    console.log(`Result ${result.body.result}`);
    return result.body.result;
};

import WebGold from './ethereum.js';
const masterAccount = nconf.get("payment:ethereum:masterAdr");
import {db as dbMod} from 'wriocommon';var init = dbMod.init;
import {dumpError} from './utils.js';

(async () => {
    try {
        var db = await init();
        console.log("Db ready");
        var wg = new WebGold(db);
        const nonce = await getTransactionCount(masterAccount);
        const tx = await wg.makePresaleTx("denso.ffff@gmail.com", "0x12323212312312", 1, 1, "yy", 'zzz', nonce,await getGasPrice());
        wg.unlockMaster();
        const signedTx = await wg.widgets.signRawTx(tx,masterAccount);
        console.log(await sendRawTX(signedTx));

    }
    catch (e) {
        console.log("Err",e);
        dumpError(e);
    }
})();

