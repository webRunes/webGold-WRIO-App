const WebGold = require('../src/server/ethereum.js');
const fs = require('fs');
const db = require('wriocommon').db.getInstance();
const {dumpError} = require('wriocommon').utils;
const Tx = require('ethereumjs-tx');
const {TransactionSigner} = require('../src/server/DonateProcessor.js');


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
        var r = await signer.validateTx();
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