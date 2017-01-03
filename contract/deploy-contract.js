/**
 * Created by michbil on 15.09.15.
 */


import WebGold from "../src/server/ethereum.js";
import fs from 'fs';
import {db as dbMod} from 'wriocommon';var init = dbMod.init;
import {dumpError} from '../src/server/utils.js';

class WebGoldDeploy extends WebGold {


    async compileDeploy(solfile) {
        const web3 = this.getWeb3();
        console.log("Compiling...");
        const file = fs.readFileSync('./src/webgold.sol').toString();
        const tokenCompiled = web3.eth.compile.solidity(file);
        console.log("Deploying...");

        this.unlockMaster();
        const contraddr = await web3.deploy(solfile,"0x740f63f535bc86fb87f9482adbec5ca289a2d59e",  tokenCompiled.token.code, tokenCompiled.token.info.abiDefinition);
        this.saveContractAddress(contraddr,solfile);
    }

    /*deploy(solfile) {
        console.log("Deploying...");
        var web3 = this.getWeb3();

        this.unlockMaster();

        var supply = 500000000;
        var tokenContract = web3.eth.contract(this.tokenCompiled.token.info.abiDefinition);
        var token = tokenContract.new(
            supply,
            {
                from:"0x740f63f535bc86fb87f9482adbec5ca289a2d59e",
                data:this.tokenCompiled.token.code,
                gas: 1000000
            }, (e, contract) => {
                if(!e) {
                    console.log("contract",contract);
                    if(!contract.address) {
                        console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");

                    } else {
                        console.log("Contract mined! Address: " + contract.address);
                        console.log(contract);
                        this.saveContractAddress(contract.address,solfile);
                    }

                } else {
                    console.log("Error compiling your token",e);
                }
            });
    }*/

    saveContractAddress(addr,solfile) {
        fs.writeFileSync(solfile,addr);
    }

}
try {
    (async () =>{
        var db = await init();
        console.log("Db ready");
        var depl = new WebGoldDeploy(db);
        console.log("Starting deploy process");
        await compileDeploy('./src/webgold.sol');
        //depl.compile('./src/webgold.sol');
        //depl.deploy('./bin/token.addr');

        //depl.compile('./src/webgold.sol');
        //depl.deploy('./bin/token.addr');
    })();

}
catch (e) {
    dumpError(e);
}
