/**
 * Created by michbil on 15.10.16.
 * Etherscan lightweight API's
 */

const nconf = require('../utils/wrio_nconf');
const request = require('superagent');

const net = 'api'; // 'api'

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

const masterAccount = nconf.get("payment:ethereum:masterAdr");
const db = require('wriocommon').db.getInstance();
const {dumpError} = require('wriocommon').utils;
const sign = require('ethjs-signer').sign;

const presale = async (wg, mail, adr, satoshis, milliWRG,bitcoinSRC, bitcoinDEST) => {
    const nonce = await getTransactionCount(masterAccount);
    const tx = await wg.makePresaleTx(mail, adr, satoshis, milliWRG,bitcoinSRC, bitcoinDEST, nonce,await getGasPrice());
    const signedTx = sign(tx, nconf.get("payment:ethereum:masterKey")); // TODO fix it to the new format
    console.log("Signing",signedTx);
    console.log(await sendRawTX(signedTx));
};
module.exports = presale;
