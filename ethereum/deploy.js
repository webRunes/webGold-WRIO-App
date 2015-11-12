/**
 * Created by michbil on 15.09.15.
 */

import Web3 from 'web3'; var web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545')) ;


var fs = require('fs');
var file = fs.readFileSync('./webgold.sol').toString();
var tokenCompiled = web3.eth.compile.solidity(file);
console.log(tokenCompiled);

// execute contract

var supply = 10000;
var tokenContract = web3.eth.contract(tokenCompiled.token.info.abiDefinition);
var token = tokenContract.new(
    supply,
    {
        from:web3.eth.accounts[3],
        data:tokenCompiled.token.code,
        gas: 1000000
    }, function(e, contract){
        if(!e) {

            if(!contract.address) {
                console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");

            } else {
                console.log("Contract mined! Address: " + contract.address);
                console.log(contract);
            }

        } else {
            console.log("Error compiling your token",e);
        }
    });

// check ballance
