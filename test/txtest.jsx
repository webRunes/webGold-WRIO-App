import WebGold from "../src/server/ethereum.js";
import fs from 'fs';
import {db as dbMod} from '../src/server/common';var db = dbMod.db;
import {dumpError} from '../src/server/utils.js';
import Tx from 'ethereumjs-tx';
import {TransactionSigner} from '../src/server/DonateProcessor.js';


class WebGoldDeploy extends WebGold {

    async testtx() {
        var web3 = this.getWeb3();
        var from = await this.getEthereumAccountForWrioID("848825910709");
        var to = await this.getEthereumAccountForWrioID("713372365175");
        var amount = "111";
        var data = this.token.donate.getData(to, amount);
        var tx = await this.makeTx(data,from);
       // tx = new Tx(tx);
        //console.log(tx.toJSON());

        var signer = new TransactionSigner(tx);
        var r = await signer.checkTx();
        if (r) {
            console.log("Check succeded");
        } else {
            console.log("Check failed");
        }

    }


}

(async () =>{
    try {
        var db = await init();
        console.log("Db ready");
        var test = new WebGoldDeploy(db);
        console.log("Testing transaction creation");
        await test.testtx();
    }
    catch (e) {
        console.log("ERROR caught",e);
        dumpError(e);
    }

})();