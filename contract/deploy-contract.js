/**
 * Created by michbil on 15.09.15.
 */


import WebGold from "../src/server/ethereum.js";
import fs from 'fs';
import {init} from '../src/server/db.js';
import {dumpError} from '../src/server/utils.js';

class WebGoldDeploy extends WebGold {

    compile() {
        var web3 = this.getWeb3();
        console.log("Compiling...");

        var file = fs.readFileSync('./src/webgold.sol').toString();
        this.tokenCompiled = web3.eth.compile.solidity(file);
       // console.log(this.tokenCompiled);
        return this;
    }

    deploy() {
        console.log("Deploying...");
        var web3 = this.getWeb3();

        this.unlockMaster();

        var supply = 500000000;
        var tokenContract = web3.eth.contract(this.tokenCompiled.token.info.abiDefinition);
        var token = tokenContract.new(
            supply,
            {
                from:web3.eth.accounts[3],
                data:this.tokenCompiled.token.code,
                gas: 1000000
            }, (e, contract) => {
                if(!e) {

                    if(!contract.address) {
                        console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");

                    } else {
                        console.log("Contract mined! Address: " + contract.address);
                        console.log(contract);
                        this.saveContractAddress(contract.address);
                    }

                } else {
                    console.log("Error compiling your token",e);
                }
            });
    }

    saveContractAddress(addr) {
        fs.writeFileSync('./bin/token.addr',addr);
    }

}
try {
    (async () =>{
        var db = await init();
        console.log("Db ready");
        var depl = new WebGoldDeploy(db);
        console.log("Starting deploy process");
        depl.compile();
        depl.deploy();
    })();

}
catch (e) {
    dumpError(e);
}
