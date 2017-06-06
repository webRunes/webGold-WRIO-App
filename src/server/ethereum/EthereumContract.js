/**
 * Created by michbil on 27.10.16.
 */

const fs = require('fs');
const path = require('path');
const logger = require('winston');
const nconf = require('nconf');
const Web3 = require('web3'); var web3 = new Web3();
const promisify = require('../utils/promisify.js');
const NonceTracker = require('../models/noncetracker.js');

const COMPILER_VER = "v0.4.8+commit.60cc1668";

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

    contractInit(name, _abi, _addr) {
        const abi_file = path.resolve(__dirname, `../../../contract/bin/${name}.abi`);
        const addr_file = path.resolve(__dirname, `../../../contract/bin/${name}.addr`);
        const contractadress = _addr || fs.readFileSync(addr_file).toString();
        const abi = _abi || eval(fs.readFileSync(abi_file).toString());
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
        const nonce = await this.getTransactionCount(sender);
        const result = await promisify(this.web3.eth.sendTransaction)({
            from: sender,
            to: recipient,
            value: amountWEI,
            nonce
        });
        await this.saveNonce(sender,nonce);
        logger.info("Ether transfer succeeded: ",recipient, amount,amountWEI,result);
        return result
    }

    async getTransactionCount(adr) {
        let nt = new NonceTracker();
        let savedNonce = await nt.getSavedNonce(adr);
        let apiNonce =  await promisify(web3.eth.getTransactionCount)(adr);
        console.log("TR count",adr,apiNonce,savedNonce);
        if (savedNonce >= apiNonce) {
            console.log("USING SAVED NONCE", savedNonce+1);
            return savedNonce+1;
        } else {
            return apiNonce;
        }
    }

    async saveNonce(from,nonce) {
        let nt = new NonceTracker();
        await nt.create(from,nonce);
        console.log("Saving nonce",nonce);
    }


    /* executeSignedTransaction*/

    async executeSignedTransaction(tx) {

        const hash = await promisify(this.web3.eth.sendRawTransaction)('0x'+tx);

        console.log("Transaction has been executed, HASH:", hash);
        const trans = await promisify(this.web3.eth.getTransaction)(hash);
        console.log(trans);
        if (trans) {
           await this.saveNonce(trans.from,trans.nonce);
        }
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


    compileContract(source) {
        return new Promise((resolve, reject) => {
            const solc = require('solc');
            solc.loadRemoteVersion(COMPILER_VER, async (err, solcSnapshot) => {
                console.log(`Compiler version ${COMPILER_VER} downloaded`);
                if (err) {
                    reject(err);
                }
                let compiledContract = solcSnapshot.compile(source, 1);
                let abi = compiledContract.contracts[contractName].interface;
                let bytecode = compiledContract.contracts[contractName].bytecode;
                resolve([abi, bytecode]);
            });
        });
    }

    deploy(from,data,abi) {
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
module.exports = EthereumContract;