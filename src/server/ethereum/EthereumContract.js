/**
 * Created by michbil on 27.10.16.
 */

import fs from 'fs';
import path from 'path';
import logger from 'winston';
import nconf from 'nconf';
import Web3 from 'web3'; var web3 = new Web3();

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
        return this.makeContract(this.contractadress,abi,name);
    }

    unlockMaster() {
        console.warn("unlockMaster deprecated")
    }

    async unlockByWrioID (wrioID) {
        if (!this.widgets) return;
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
            logger.verbose("Preparing to transfer",amount,"ETH");

            var amountWEI = this.web3.toWei(amount, "ether");
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

                    var trans = this.web3.eth.getTransaction(hash);
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