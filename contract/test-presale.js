/**
 * Created by michbil on 15.09.15.
 */


import WebGold from "../src/server/ethereum.js";
import fs from 'fs';
import {db as dbMod} from 'wriocommon';var init = dbMod.init;
import {dumpError} from '../src/server/utils.js';

class WebGoldDeploy extends WebGold {

    compile(solfiles) {
        var web3 = this.getWeb3();
        console.log("Compiling...");

        var file = fs.readFileSync('./src/webgold.sol').toString();
        this.tokenCompiled = web3.eth.compile.solidity(file);
       // console.log(this.tokenCompiled);
        return this;
    }

    async deploy(solfile) {
        try {
            console.log("Deploying...");
            var web3 = this.getWeb3();
            this.unlockMaster();
            console.log("Master unlocked");

            await this.logPresale("denso.ffff@gmail.com", "0x1055e66904bf23d5dc5fc8b68b15ec9651af52ed", 1111111, 222, "btcFROM", "btcTO");

        }
        catch (e) {
                dumpError(e);
                console.log(e);
            }


        }

    saveContractAddress(addr,solfile) {
        fs.writeFileSync(solfile,addr);
    }

}
try {
    (async () =>{
        try {


        var db = await init();
        console.log("Db ready");
        var depl = new WebGoldDeploy(db);
        console.log("Starting deploy process");
        //depl.compile('./src/webgold.sol');
        await depl.deploy('');

        } catch(e) {
            dumpError(e);
            console.log(e);
        }

        //depl.compile('./src/webgold.sol');
        //depl.deploy('./bin/token.addr');
    })();

}
catch (e) {
    dumpError(e);
    console.log(e);
}
