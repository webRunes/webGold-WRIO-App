import nconf from './wrio_nconf';
import bitcore from 'bitcore';

// Set the network to testnet
bitcore.Networks.defaultNetwork = bitcore.Networks.testnet;

var privateKey = bitcore.PrivateKey.fromWIF(nconf.get("payment:bitcore:privateKeyWIF"));
var address = privateKey.toAddress();
console.log("GeneratedAdress", adress);

var imported = bitcore.PrivateKey.fromWIF(exported);

var paymentInfo = {
    address: '1DNtTk4PUCGAdiNETAzQFWZiy2fCHtGnPx',
    amount: 120000 //satoshis
};
var uri = new bitcore.URI(paymentInfo).toString();

console.log(bitcore);

var peer = new bitcore.Peer('5.9.85.34');
peer.on('inv', function(message) {
    // new inventory
});
peer.connect();