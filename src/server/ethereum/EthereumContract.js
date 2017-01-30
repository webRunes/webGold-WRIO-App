/**
 * Created by michbil on 27.10.16.
 */

import fs from 'fs';
import path from 'path';
import logger from 'winston';
import nconf from 'nconf';
import Web3 from 'web3'; var web3 = new Web3();
import promisify from '../utils/promisify.js';

class EthereumContract {

    constructor (db) {
        console.log("Constructing object from parameters....");
    }

    setProvider(provider) {
        const fallbackProvider = () => {
            console.log("Using default plain provider");
            return new web3.providers.HttpProvider(nconf.get('payment:ethereum:host'));
        };
        web3.setProvider(provider || fallbackProvider());
        this.web3 = web3;
    }

    makeContract(address, abi,name) {
        return this.web3.eth.contract(abi)
            .at(address,(err,res) => {
                if (err) {
                    throw `Contract ${name} init failed`;
                    return;
                }
                logger.info(`Contract ${name} init finished`);
            }); // change to contract address
    }

    contractInit(name) {
        const abi_file = path.resolve(__dirname, `../../../contract/bin/${name}.abi`);
        const addr_file = path.resolve(__dirname, `../../../contract/bin/${name}.addr`);
        const contractadress = fs.readFileSync(addr_file).toString();
        const abi = eval(fs.readFileSync(abi_file).toString());
        return this.makeContract(contractadress,abi,name);
    }

    unlockMaster() {
        console.warn("unlockMaster deprecated")
    }


    async estimateGas(trans) {
        var result = this.web3.eth.estimateGas(trans);
        logger.debug(result);
    }



    /**
     * gets ethereum balance of account
     * @param account - ethereum id of account
     * @returns {Promise, string}
     */

    async getEtherBalance(account) {
        return await promisify(this.web3.eth.getBalance)(account);
    }

    /**
     * sends ether to from sender to recepient
     * @param sender - ethereum id
     * @param recipient -  ethereum id
     * @param amount - integer in wei
     * @returns {Promise}
     */

    async etherSend(sender,recipient,amount) {
        logger.verbose("Preparing to transfer",amount,"ETH");
        const  amountWEI = this.web3.toWei(amount, "ether");
        const result = await promisify(this.web3.eth.sendTransaction)({from: sender, to: recipient, value: amountWEI});
        logger.info("Ether transfer succeeded: ",recipient, amount,amountWEI,result);
        return result
    }

    async getTransactionCount(adr) {
        console.log("Getting trans count for ",adr);
        return await promisify(web3.eth.getTransactionCount)(adr);
    }


    /* executeSignedTransaction*/

    async executeSignedTransaction(tx) {

        const hash = await promisify(this.web3.eth.sendRawTransaction)(tx);

        console.log("Transaction has been executed, HASH:", hash);
        const trans = await promisify(this.web3.eth.getTransaction)(hash);
        console.log(trans);
        return hash;

        /*         var filter = web3.eth.filter('latest');
         filter.watch(function(error, result) {
         if (error) {
         console.log("Watch error",error);
         return;
         }
         // XXX this should be made asynchronous as well.  time
         // to get the async library out...
         var receipt = web3.eth.getTransactionReceipt(hash);
         console.log(result,receipt);
         // XXX should probably only wait max 2 events before failing XXX
         if (receipt && receipt.transactionHash == hash) {
         var res = myContract.getData.call();
         console.log('the transactionally incremented data was: ' + res.toString(10));
         filter.stopWatching();
         }
         });*/


    }

    async getLatestBlock() {
        return await promisify(web3.eth.getBlockNumber)();
    }

    async getBlockSync() {
        return await promisify(web3.eth.getSyncing)();
    }

    async getGasPrice() {
        return await promisify(web3.eth.getGasPrice)();
    }

    getWeb3() {
        return this.web3;
    }

    deploy(from,data,abi) {
        console.log(abi);
        return new Promise((resolve,reject) => {

            let web3 = this.getWeb3();
            var tokenContract = web3.eth.contract(abi);
            var token = tokenContract.new(
                0,
                {
                    from:from,
                    data:data,
                    gas: 1000000
                }, (e, contract) => {
                    if(!e) {
                        if(!contract.address) {
                            console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                        } else {
                            console.log("Contract mined! Address: " + contract.address);
                            resolve(contract.address);
                        }
                    } else {
                        reject(e);
                    }
                });
        });
    }


}
export default EthereumContract;