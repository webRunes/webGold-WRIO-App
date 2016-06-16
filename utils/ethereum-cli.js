/**
 * Created by michbil on 26.09.15.
 */

import WebGold from '../src/server/ethereum.js'
import {init} from '../src/server/db';
import {dumpError} from '../src/server/utils'
import Web3 from 'web3'; var web3 = new Web3();
import {Promise} from 'es6-promise'


var operate = async (db) => {

    try {
        var webGold = new WebGold(db);

        console.log(web3.eth.widgets);

        var dest = await webGold.getEthereumAccountForWrioID("819702772935");

        console.log("Master balance ",await webGold.getEtherBalance(web3.eth.widgets[0]));

        var balance1 = await webGold.getBalance(web3.eth.widgets[0]);
        var balance2 = await webGold.getBalance(dest);

        //webGold.accounts.createUnencryptedAccount();
     //   await webGold.accounts.importAccount("0x740f63f535bc86fb87f9482adbec5ca289a2d59e","","");

        //await webGold.coinTransfer(web3.eth.accounts[0],dest,1000);

        console.log("Master",balance1.toString(),"Recipient",balance2.toString());

    } catch (e) {
        console.log("operate error",e);
        dumpError(e);

    }

};

console.log("App start");
init().then(async (database) => {
    console.log("Database init");
    await operate(database);

}).catch((err)=>{
    console.log("Failed to init db",err);
});