/**
 * Created by michbil on 15.09.15.
 */
// to run geth with json RPC use
// geth --rpc // command

// ln -s /srv/www/ethereumjs-accounts/ /srv/node_modules/ethereumjs-accounts-node
// geth --rpc --rpcaddr "192.168.1.4" --unlock 0

import Web3 from 'web3'; var web3 = new Web3();
import {Promise} from 'es6-promise';
import {calc_percent} from './utils';
import {utils} from 'wriocommon'; const dumpError = utils.dumpError;
import Accounts from './ethereum-node';
import HookedWeb3Provider from 'hooked-web3-provider';
import {db as dbMod} from 'wriocommon';var db = dbMod.db;
import fs from 'fs';
import path from 'path';
import nconf from './wrio_nconf';
import BigNumber from 'bignumber.js';
import WebRunesUsers from './dbmodels/wriouser';
import EtherFeed from './dbmodels/etherfeed.js';
import Emissions from './dbmodels/emissions.js';
import Donation from './dbmodels/donations.js';
import mongoKeyStore from './payments/MongoKeystore.js';
import logger from 'winston';
import Const from '../constant.js';
import {txutils} from 'eth-lightwallet';
import {isAddress,isBigNumber,randomBytes,formatAddress,formatNumber,formatHex} from './ethereum-node/utils.js';
import PendingPaymentProcessor from './PendingPaymentProcessor.js';
import Tx from 'ethereumjs-tx';
import ethUtil from 'ethereumjs-util';


let wei = Const.WEI;
let SATOSHI = Const.SATOSHI;
let min_amount = Const.MIN_ETH_AMOUNT; //0.002// ETH, be sure that each ethereum account has this minimal value to have ability to perform one transaction

let DAY_IN_MS = 24 * 60 * 60 * 1000;
let prepaymentExpire = 30 * DAY_IN_MS; // prepayment will expire in 30 days

let masterAccount = nconf.get("payment:ethereum:masterAdr");
let masterPassword = nconf.get("payment:ethereum:masterPass");
if (!masterAccount) {
    throw new Error("Can't get master account address from config.json");
}
if (!masterPassword) {
    throw new Error("Can't get master account password from config.json");
}


let instance = null;


class WebGold {
    constructor(db) {

        if (!db) {
            throw  new Error("No db specified");
        }

        if(!instance){ // make webgold singlenon
            instance = this;
            this.initWG(db);
        }
        return instance;
    }

    contractInit() {
        var abi_file = path.resolve(__dirname, '../../contract/bin/token.abi');
        var addr_file = path.resolve(__dirname, '../../contract/bin/token.addr');
        this.contractadress = fs.readFileSync(addr_file).toString();
        this.abi = eval(fs.readFileSync(abi_file).toString());
        this.token = web3.eth.contract(this.abi)
            .at(this.contractadress,(err,res) => {
                if (err) {
                    throw "Contract init failed";
                    return;
                }
                logger.info("Contract init finished");
            }); // change to contract address
    }

    keyStoreInit(db) {
        this.KeyStore =  new mongoKeyStore(db);
        this.widgets = new Accounts(
            {
                minPassphraseLength: 6,
                KeyStore: this.KeyStore
            });
        if (process.env.WRIO_CONFIG) {
            var TestRPC = require("ethereumjs-testrpc");
            this.provider = TestRPC.provider();
            logger.info("Using fake test web3 provider");
        } else {
            this.provider = new HookedWeb3Provider({
                host: nconf.get('payment:ethereum:host'),
                transaction_signer: this.widgets
            });
        }
        logger.debug("Provider.set");
        web3.setProvider(this.provider);
    }

    initWG(db) {

        console.log("INIT WG!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

        this.contractInit();
        this.keyStoreInit(db);

        this.users = new WebRunesUsers(db);
        this.pp = new PendingPaymentProcessor();
        this.WRGExchangeRate = new BigNumber(nconf.get('payment:WRGExchangeRate'));

        logger.info("Wrg exchange rate is", this.WRGExchangeRate);

        var event = this.token.CoinTransfer({}, '', async (error, result) => {
            if (error) {
                logger.error("Cointransfer listener error");
            } else {
                this.onTransfer(result);
            }
        });
    }
    /*
       Called when every coin transfer operation
    */
    async onTransfer(re) {
        try {
            var sender = result.args.sender;
            var receiver = result.args.receiver;
            var wrioUsers = new WebRunesUsers();
            var user = await wrioUsers.getByEthereumWallet(receiver);
            logger.info("WRG transfer finished, from: "+sender+" to: "+ receiver);
            await this.processPendingPayments(user);

        } catch (e) {
            logger.error("Processing payment failed",e);
            dumpError(e);
        }
    }

    async processPendingPayments(user) {
        return await this.pp.process(user,this);
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
        var result = web3.eth.estimateGas(trans);
        logger.debug(result); //
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

    /*async createEthereumAccountForWRIOID (wrioID) {
        var accountObject = await this.widgets.newAccount(wrioID);
        logger.verbose("Created account for WRIOID: "+wrioID+": ", accountObject);
        await this.users.updateByWrioID(wrioID,{"ethereumWallet":accountObject.address});
        return accountObject.address;
    }*/


    getEtherBalance(account) {
        return new Promise((resolve,reject) =>{
            web3.eth.getBalance(account, (err,res) => {
                if (err) {
                    reject("getEtherBalance failed");
                } else {
                    resolve(res.toString());
                }
            });
        });
    }

    getBalance(account) {
        return new Promise((resolve, reject) => {
            this.token.coinBalanceOf(account, (err, balance)=> {
                if (err) {
                    return reject(err);
                }
                resolve(balance);
            });
        });
    }

    etherSend(sender,recipient,amount) {
        return new Promise((resolve,reject)=> {
            this.widgets.unlockAccount(masterAccount,masterPassword);

            logger.verbose("Preparing to transfer",amount,"ETH");

            var amountWEI = web3.toWei(amount, "ether");
            web3.eth.sendTransaction({from: sender, to: recipient, value: amountWEI}, (err, result) => {
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

    async etherTransfer(to,amount) {
        var sender = masterAccount;
        var recipient = to;
        return await this.etherSend(sender,recipient,amount);
    }

    /*
     DEBUG function!!!
     give away all ether to master account, for debugging purposes
     */

    async giveAwayEther(from) {
        logger.info("Giveaway started");
        var amount = await this.getEtherBalance(from)/Const.WEI;

        logger.info("Residual amount:", amount);
        return await this.etherSend(from,masterAccount,amount/10);

    }


    coinTransfer(from,to,amount) {

        var that = this;
        return new Promise((resolve,reject)=> {

            function actual_sendcoin() {
                that.widgets.unlockAccount(masterAccount,masterPassword);
                that.token.sendCoin.sendTransaction(to, amount, {from: from}, (err,result)=>{
                    if (err) {
                        logger.error("cointransfer failed",err);
                        reject(err);
                        return;
                    }
                    logger.info("cointransfer succeeded",result);
                    resolve(result);
                });
            }

            logger.debug("Starting sendCoin cointransfer",from,to,amount);


            that.token.sendCoin.call(to, amount, {from: from},(err, callResult) => {
                logger.verbose("Trying sendcoin pre-transcation execution",err,callResult);
                if (err) {
                    reject("Failed to perform pre-call");
                    return;
                }

                if (callResult) {
                    logger.debug('sendCoin preview succeeds so now sendTx...');
                    actual_sendcoin();
                }
                else {
                    reject("Can't pre check failed, check your balances");
                }
            });
        });


    }

    getTime() {
        var d = new Date();
        return d.getTime();
    }

    /*
      This functions waits for one minute for ether to be received by account
     */

    async waitForEther (acc) {
        var start_time = this.getTime();
        var max_time = 60 * 1000;
        logger.info("Waiting to Ether arrive");
        while ((this.getTime() - start_time) < max_time) {
            var ethBalance = await this.getEtherBalance(acc)/wei;
            if (ethBalance >= Const.MIN_ETH_AMOUNT) {
                logger.info("Ether arrived, ok");
                return true;
            }
        }

        return false;

    }

    /*
    This function checks if minimum required amount of ether is available for specified account
     */

    async ensureMinimumEther(dest,toWrio) { //TODO: add ethereum queue for adding funds, to prevent multiple funds transfer
        var ethBalance = await this.getEtherBalance(dest)/wei;
        logger.debug("Ether:",ethBalance);
        if (ethBalance < min_amount) {
            logger.info("Adding minium ether amount",ethBalance);
            await this.etherTransfer(dest,min_amount);

            var feed = new EtherFeed();
            await feed.create(dest,min_amount,toWrio);

            if (!(await this.waitForEther(dest))) {
                logger.error("Failed to wait for ether to arrive");
            }

        } else {
            logger.verbose("Account has minimum ether, cancelling");
        }
    }



    /*
     This function emits new WRG for specified WRIOid
     */

    async emit (dest,amount,toWrio) {
        if (!amount) throw new Error("Amount not specified");
        if (!dest) throw new Error("Destination not specified");
        if (!toWrio) throw new Error("toWrio address not specified");

        logger.info("Emitting new wrg to",dest,"Amount=",amount);
        this.widgets.unlockAccount(masterAccount,masterPassword);
        await this.coinTransfer(masterAccount,dest,amount);
        await this.ensureMinimumEther(dest,toWrio);
        var emission = new Emissions();
        await emission.create(toWrio,amount);
    }


    async makeTx(data,from) {
        var currentGasPrice = 3*(await this.getGasPrice());
        console.log("Current gas price",currentGasPrice);

        var gasPrice = formatHex(currentGasPrice.toString(16));
        var nonce = (await this.getTransactionCount(from)).toString(16);
        console.log('Making nonce ',from, nonce);

        var txObject = {
            nonce: formatHex(nonce),
            gasPrice: formatHex(ethUtil.stripHexPrefix(gasPrice)),
            gasLimit: formatHex(new BigNumber('414159').toString(16)),
            value: '0x00',
            to: this.contractadress,
            data: data
        };
        console.log("Resulting transaction",txObject);
       // console.log("Estimate gas ", await this.estimateGas({to:formatHex(this.contractadress),data:data}));

        var tx = new Tx(txObject);
        var hex = tx.serialize().toString('hex');

        return hex;
    }



    /* Prepare transaction to be signed by the userspace */
    async makeDonateTx(from,to,amount) {

        this.token.donate.estimateGas(to, amount, {from: from},async (err, callResult) => {
            var gasPrice = await this.getGasPrice();
            console.log('Max transcation', gasPrice.mul(314159 * 14).div(Const.WEI).toString());
            console.log('Estimated gas',callResult," ",gasPrice.mul(callResult).mul(14).div(Const.WEI).toString()+'$');
        });

        var data = this.token.donate.getData(to, amount);
        console.log("Data",data,to,amount);
        return await this.makeTx(data,from);
    }

    getTransactionCount(adr) {
        console.log("Getting trans count for ",adr);
        return new Promise((resolve,reject) => {
            web3.eth.getTransactionCount(adr,function(err,res) {
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
            web3.eth.sendRawTransaction(tx, function(err, hash) {
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



                    resolve();
                } else {
                    reject(err);
                }

            });
        });
    }


    /* check and verify transaction , return RAW transaction to be signed by client */

    donate(from,to,amount) {


        return new Promise((resolve,reject)=> {

            function actual_donate() {
                this.makeDonateTx(from,to,amount).then((result)=>{
                    resolve(result);
                }).catch((err)=>{
                    logger.error("donate failed",err);
                    reject(err);
                });
            }

            logger.debug("Starting donate cointransfer");
            //logger.debug(this.token.donate);

            this.token.donate.call(to, amount, {from: from},(err, callResult) => {
                logger.debug("Trying donate pre-transcation execution",err,callResult);

                if (err) {
                    reject("Failed to perform pre-call");
                    return;
                }

                if (callResult) {
                    logger.debug('donate preview succeeds so now sendTx...');
                    actual_donate();
                }
                else {
                    reject("Transaction pre check failed, check your balances");
                }
            });
        });
    }


    /*

    Converts bitcoin sum to WRG

    paramenters:

    btc - bitcoin sum, in satoshi, bignumber
    btcrate - bitcoin to usd rate, as bignumber
    formulae - WRG = (btc * btcrate * WRG_UNIT) / WRGExchangeRate
    WRGExchangeRate is taken from config
    return value = WRG
     */

    convertBTCtoWRG(btc,btcrate) {
        console.log('GOT EXCHANGE', this);
        return btc.times(btcrate).times(Const.WRG_UNIT).div(this.WRGExchangeRate).div(SATOSHI);
    }

    /*

     Converts bitcoin sum to WRG

     paramenters:

     btc - bitcoin sum, in satoshi, bignumber
     btcrate - bitcoin to usd rate, as bignumber

     formulae - BTC = (wrg * WRGExchangeRate) / (btcrate * WRG_UNIT)

     WRGExchangeRate is taken from config

     return value = satoshis

     */

    convertWRGtoBTC(wrg,btcrate) {

        var btc = wrg.times(this.WRGExchangeRate).div(btcrate*Const.WRG_UNIT);
        console.log(btc.toString());
        //logger.debug("Converting ",wrg.toString(),"to BTC",btc.div(SATOSHI).toString(),"with rate",btcrate.toString());
        return btc.times(SATOSHI);

    }

    getBlockSync() {
        return new Promise((resolve,reject) => {
            web3.eth.getSyncing((error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);

            });
        });
    }

    getGasPrice() {
        return new Promise((resolve,reject) => {
            web3.eth.getGasPrice((error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);

            });
        });
    }

    getWeb3() {
        return web3;
    }

    unlockMaster() {
        this.widgets.unlockAccount(masterAccount,masterPassword);
    }


}




export default WebGold;




