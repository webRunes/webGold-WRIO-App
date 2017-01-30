/**
 * Created by michbil on 16.01.17.
 */

const SignerProvider = require('ethjs-provider-signer');
const sign = require('ethjs-signer').sign;
const Eth = require('ethjs-query');
const provider = (url, address, privatekey) => new SignerProvider(url, {
    signTransaction: (rawTx, cb) => {
        let modTx = rawTx;
        modTx.gasLimit = "0x40CB2F"; // override limit
        const signed = sign(rawTx, privatekey);
        cb(null, signed);
        console.log(rawTx,signed);
    },
    accounts: (cb) => cb(null, [address]),
});


export default provider;