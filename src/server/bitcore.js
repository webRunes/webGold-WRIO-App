import nconf from './wrio_nconf';
import bitcore from 'bitcore';
import {Peer} from 'bitcore-p2p';

// Set the network to testnet
bitcore.Networks.defaultNetwork = bitcore.Networks.testnet;
var wif = nconf.get("payment:bitcore:privateKeyWIF");
var privateKey = bitcore.PrivateKey.fromWIF(wif);
var address = privateKey.toAddress();
console.log("GeneratedAdress", address);


var paymentInfo = {
    address: address,
    amount: 120000 //satoshis
};
var uri = new bitcore.URI(paymentInfo).toString();
console.log("Payment URI:", uri);

var peer = new Peer({host: '5.9.85.34', network: bitcore.Networks.testnet});
peer.on('inv', function(message) {
    console.log("Bitcoin connection est.",message);
});
peer.connect();