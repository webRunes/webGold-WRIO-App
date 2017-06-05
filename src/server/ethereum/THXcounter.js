/**
 * Created by michbil on 02.06.17.
 */

import WebGold from './ethereum.js'
//import setupIO from './notifications.js';
import {server,db,login} from '../common';
import path from 'path';
import fs from 'fs';

const addr_file = path.resolve(__dirname, `../../../contract/bin/THX.addr`);
const contractAddress =  fs.readFileSync(addr_file).toString();

async function  worker () {
    const dbI = await db.init();
    var wg = new WebGold(dbI);
    var web3 = wg.web3;
    var filter = web3.eth.filter({
        fromBlock:0,
        toBlock: 'latest',
        address: contractAddress,
        'topics':['0x' + web3.sha3('CoinTransfer(address, address, uint)')]});
    filter.watch(function(error, result) {
        if(!error) {
            console.log(result);
        } else {
            console.log("ERROR",error);
        }
    });
}
worker();