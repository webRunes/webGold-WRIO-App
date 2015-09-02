var bitcore = require('bitcore');

bitcore.Networks.defaultNetwork = bitcore.Networks.testnet;

var privateKey = new bitcore.PrivateKey();
var exported = privateKey.toWIF();

console.log(exported);

var imported = bitcore.PrivateKey.fromWIF(exported);
var hexa = privateKey.toString();
// e.g. 'b9de6e778fe92aa7edb69395556f843f1dce0448350112e14906efc2a80fa61a'

console.log(hexa);