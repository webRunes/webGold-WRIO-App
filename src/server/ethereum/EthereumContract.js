/**
 * Created by michbil on 27.10.16.
 */

import fs from 'fs';
import path from 'path';
import logger from 'winston';

class EthereumContract {

    constructor (db) {
        console.log("EthereumContract constructor");
    }

    contractInit(name) {
        const abi_file = path.resolve(__dirname, `../../../contract/bin/${name}.abi`);
        const addr_file = path.resolve(__dirname, `../../../contract/bin/${name}.addr`);
        this.contractadress = fs.readFileSync(addr_file).toString();
        this.abi = eval(fs.readFileSync(abi_file).toString());
        return this.web3.eth.contract(this.abi)
            .at(this.contractadress,(err,res) => {
                if (err) {
                    throw `Contract ${name} init failed`;
                    return;
                }
                logger.info(`Contract ${name} init finished`);
            }); // change to contract address
    }

    async unlockByWrioID (wrioID) {
        var user = await this.users.getByWrioID(wrioID);
        //logger.debug(user);
        if (user.ethereumWallet) {
            logger.debug("Unlocking existing wallet for " + wrioID);
            this.widgets.unlockAccount(user.ethereumWallet,wrioID);
        }
    }

    async estimateGas(trans) {
        var result = this.web3.eth.estimateGas(trans);
        logger.debug(result);
    }

    async getEthereumAccountForWrioID (wrioID) {

        var user = await this.users.getByWrioID(wrioID);
        // logger.debug(user);
        if (user.ethereumWallet) {
            logger.debug("Returning existing wallet for "+wrioID);
            return user.ethereumWallet;
        } else {
            return null;
        }
    }



    /**
     * gets ethereum balance of account
     * @param account - ethereum id of account
     * @returns {Promise, string}
     */

    getEtherBalance(account) {
        return new Promise((resolve,reject) =>{
            this.web3.eth.getBalance(account, (err,res) => {
                if (err) {
                    reject("getEtherBalance failed");
                } else {
                    resolve(res.toString());
                }
            });
        });
    }

    /**
     * sends ether to from sender to recepient
     * @param sender - ethereum id
     * @param recipient -  ethereum id
     * @param amount - integer in wei
     * @returns {Promise}
     */

    etherSend(sender,recipient,amount) {
        return new Promise((resolve,reject)=> {
            this.widgets.unlockAccount(masterAccount,masterPassword);

            logger.verbose("Preparing to transfer",amount,"ETH");

            var amountWEI = web3.toWei(amount, "ether");
            this.web3.eth.sendTransaction({from: sender, to: recipient, value: amountWEI}, (err, result) => {
                if (err) {
                    logger.error("etherTransfer failed",err);
                    reject("Ether transfer failed");
                    return;
                }
                logger.info("Ether transfer succeeded: ",recipient, amount,amountWEI,result);
                resolve(result);
            });
        });
    }

    getTransactionCount(adr) {
        console.log("Getting trans count for ",adr);
        return new Promise((resolve,reject) => {
            this.web3.eth.getTransactionCount(adr,function(err,res) {
                if (err) {
                    return reject(err);
                }
                resolve(res);
            });
        });
    }


    /* executeSignedTransaction*/

    executeSignedTransaction(tx) {
        return new Promise((resolve,reject) => {
            this.web3.eth.sendRawTransaction(tx, function(err, hash) {
                if (!err) {
                    console.log("Transaction has been executed, HASH:", hash);

                    var trans = web3.eth.getTransaction(hash);
                    console.log(trans);

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



                    resolve(hash);
                } else {
                    reject(err);
                }

            });
        });
    }

    getLatestBlock() {
        return this.web3.eth.blockNumber;
    }

    getBlockSync() {
        return new Promise((resolve,reject) => {
            this.web3.eth.getSyncing((error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);

            });
        });
    }

    getGasPrice() {
        return new Promise((resolve,reject) => {
            this.web3.eth.getGasPrice((error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            });
        });
    }

    getWeb3() {
        return this.web3;
    }


}
export default EthereumContract;