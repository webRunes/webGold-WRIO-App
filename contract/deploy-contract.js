/**
 * Created by michbil on 15.09.15.
 */


import WebGold from "../src/server/ethereum/ethereum.js";
import fs from 'fs';
import {db as dbMod} from '../src/server/common';var init = dbMod.init;
import {dumpError} from '../src/server/common/utils/utils.js';
import solc from 'solc';

const COMPILER_VER = "v0.4.8+commit.60cc1668";

class WebGoldDeploy extends WebGold {




    async compileDeploy(contractName) {
        try {

            const web3 = this.getWeb3();
            console.log("Compiling...");
            const source = fs.readFileSync(`./src/${contractName}.sol`).toString();
            solc.loadRemoteVersion(COMPILER_VER, async (err, solcSnapshot) => {
                console.log(`Compiler version ${COMPILER_VER} downloaded`);
                if (err) {
                    return err;
                }
                let compiledContract = solcSnapshot.compile(source, 1);
                let abi = compiledContract.contracts[contractName].interface;
                let bytecode = compiledContract.contracts[contractName].bytecode;
                fs.writeFileSync(`./bin/${contractName}.abi`,abi);
                fs.writeFileSync(`./bin/${contractName}.binary`,bytecode);
                console.log("Deploying...");
                this.unlockMaster();
                const contraddr = await this.deploy("0x740f63f535bc86fb87f9482adbec5ca289a2d59e", bytecode,JSON.parse(abi));
                this.saveContractAddress(contraddr,`./bin/${contractName}.addr`);
            });


        } catch(e) {
            console.log(e);
        }
    }

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
        await depl.compileDeploy('THX');
        //depl.compile('./src/webgold.sol');
        //depl.deploy('./bin/token.addr');

        //depl.compile('./src/webgold.sol');
        //depl.deploy('./bin/token.addr');
    })();

}
catch (e) {
    dumpError(e);
}
