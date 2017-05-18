import Web3 from 'web3'; var web3 = new Web3();
import {Promise} from 'es6-promise';
import {calc_percent} from '../utils/utils';
import {dumpError} from '../common/utils/utils';
import {db as dbMod} from '../common';var db = dbMod.db;
import fs from 'fs';
import path from 'path';
import nconf from '../utils/wrio_nconf';
import BigNumber from 'bignumber.js';
import WebRunesUsers from '../models/wriouser';
import EtherFeed from '../models/etherfeed.js';
import Emissions from '../models/emissions.js';
import Donation from '../models/donations.js';
import logger from 'winston';
import Const from '../../constant.js';
import {txutils} from 'eth-lightwallet';
import {formatHex} from './ethutils.js';
import PendingPaymentProcessor from './PendingPaymentProcessor.js';
import Tx from 'ethereumjs-tx';
import ethUtil from 'ethereumjs-util';
import CurrencyConverter from '../../currency.js';
import EthereumContract from './EthereumContract.js';
import ServerSideSigner from './ServerSideSigner.js';
import promisify from '../utils/promisify.js';

const converter = new CurrencyConverter();
const wei = Const.WEI;
const SATOSHI = Const.SATOSHI;
const min_amount = Const.MIN_ETH_AMOUNT; //0.002// ETH, be sure that each ethereum account has this minimal value to have ability to perform one transaction

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const prepaymentExpire = 30 * DAY_IN_MS; // prepayment will expire in 30 days

const masterAccount = nconf.get("payment:ethereum:masterAdr");
const masterKey = nconf.get("payment:ethereum:masterKey");
if (!masterAccount) {
    throw new Error("Can't get master account address from config.json");
}
if (!masterKey) {
    throw new Error("Can't get master private key from config.json");
}

var instance = null;

class WebGold extends EthereumContract {
    constructor(db) {
        super(db);
        if (!db) {
            throw  new Error("No db specified");
        }
        if(!instance){ // make webgold singlenon
            instance = this;
            this.initWG(db);
        }

        return instance;
    }


    initWG(db) {
        const provider = ServerSideSigner(nconf.get('payment:ethereum:host'),nconf.get('payment:ethereum:masterAdr'),nconf.get('payment:ethereum:masterKey'));
        this.setProvider(provider);
        this.token = this.contractInit('THX');
        this.presaleContract = this.contractInit('presale');
        this.users = new WebRunesUsers(db);
        this.pp = new PendingPaymentProcessor();

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
    async onTransfer(result) {
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



    /**
     * gets WRG balance of account
     * @param account - ethereum id of account
     * @returns {Promise, string}
     */

    async getBalance(account) {
            return await promisify(this.token.coinBalanceOf)(account);
    }

    async getRtxBalance(account) {
        return await promisify(this.token.rewardOf)(account);
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
     * transfers ether from master account
     * @param to - ethereum id of recepient
     * @param amount - ether amouint in WEI
     * @returns {Promise}
     */

    async etherTransfer(to,amount) {
        var sender = masterAccount;
        var recipient = to;
        return await this.etherSend(sender,recipient,amount);
    }


    /**
     *  DEBUG function!!!
     *  give away all ether to master account, for debugging purposes
     *
     * @param from
     * @returns {*}
     */

    async giveAwayEther(from) {
        logger.info("Giveaway started");
        var amount = await this.getEtherBalance(from)/Const.WEI;

        logger.info("Residual amount:", amount);
        return await this.etherSend(from,masterAccount,amount/10);

    }

    coinTransfer (from,to,amount) {
        return this._coinTransfer(from,to,amount,this.token.sendCoin);
    }

    emitCoin (from,to,amount) {
        return this._coinTransfer(from,to,amount,this.token.emitCoin);
    }

    async _coinTransfer(from,to,amount,Fn) {
        const nonce = await this.getTransactionCount(from);
        logger.debug(`"Starting sendCoin cointransfer FROM:${from} TO:${to} COINS:${amount} ${Fn.name}`);
        const callResult = await promisify(Fn.call)(to, amount, {
            from: from,
            nonce
        });
        logger.verbose("Trying sendcoin pre-transcation execution",callResult,to);

        if (callResult) {
            logger.debug('sendCoin preview succeeds so now sendTx...');
            const result = await promisify(Fn.sendTransaction)(to, amount, {
                from: from,
                nonce
            });
            await this.saveNonce(from,nonce);
            logger.info("cointransfer succeeded",result);
            return result;
        }
        else {
            throw new Error("Pre check failed, check your balances");
        }

    }

    async executeWithPreflight(Fn, ...params) {

        const callResult = await promisify(Fn.call)(to, amount, {from: from});
        if (callResult) {
            const result = await promisify(Fn.sendTransaction)(to, amount, {from: from});
            return result;
        }
        else {
            throw new Error("Pre check failed, check your balances");
        }

    }


    getTime() {
        var d = new Date();
        return d.getTime();
    }


    /**
     * waits for one minute for ether to be received by account
     * @param acc - account WRIO id
     * @returns {boolean} - has ether arrived in time
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


    /**
     * checks if minimum required amount of ether is available for specified account
     * @param dest - destination wrio id
     * @param toWrio
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


    /**
     *  This function emits new WRG for specified WRIOid
     * @param dest
     * @param amount
     * @param toWrio
     * @returns {*}
     */

    async emit (dest,amount,toWrio) {
        if (!amount) throw new Error("Amount not specified");
        if (!dest) throw new Error("Destination not specified");
        if (!toWrio) throw new Error("toWrio address not specified");

        logger.info("Emitting new wrg to",dest,"Amount=",amount);
        let txId = await this.emitCoin(masterAccount,dest,amount);
        this.ensureMinimumEther(dest,toWrio).then(()=>console.log("Ether arrived"));
        var emission = new Emissions();
        await emission.create(toWrio,amount);
        return txId;
    }


    makeTx(data,gasPrice,nonce,contract) {

        console.log("Current gas price",gasPrice,nonce.toString(16));
        gasPrice = formatHex(gasPrice.toString(16));

        var txObject = {
            nonce: formatHex(nonce),
            gasPrice: formatHex(ethUtil.stripHexPrefix(gasPrice)),
            gasLimit: formatHex(new BigNumber('414159').toString(16)),
            value: '0x00',
            to: contract.address,
            data: data
        };
        console.log("Resulting transaction",txObject);
       // console.log("Estimate gas ", await this.estimateGas({to:formatHex(this.contractadress),data:data}));
        return txObject;
    }

    toHexTx(txObject) {
        var tx = new Tx(txObject);
        return tx.serialize().toString('hex');
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
        const currentGasPrice = 3*(await this.getGasPrice());
        const nonce = (await this.getTransactionCount(from)).toString(16);
        console.log('Making nonce ',from, nonce);

        return this.toHexTx(this.makeTx(data,currentGasPrice,nonce,this.token));
    }

    async makePresaleTx(mail, adr, satoshis, milliWRG,bitcoinSRC, bitcoinDEST, nonce, gasPrice) {

        let data = this.presaleContract.makePresale.getData(mail, adr, satoshis, milliWRG, bitcoinSRC, bitcoinDEST);
        return this.makeTx(data,parseInt(gasPrice,16).toString(16),parseInt(nonce,16).toString(16),this.presaleContract);
    }




    /* check and verify transaction , return RAW transaction to be signed by client */

    donate(from,to,amount) {
        return new Promise((resolve,reject)=> {

            const actual_donate = async () => await this.makeDonateTx(from,to,amount);
            logger.debug("Starting donate cointransfer");

            this.token.donate.call(to, amount, {from: from},(err, callResult) => {
                logger.debug("Trying donate pre-transcation execution",err,callResult);

                if (err) {
                    reject("Failed to perform pre-call");
                    return;
                }

                if (callResult) {
                    logger.debug('donate preview succeeds so now sendTx...');
                    actual_donate().then(resolve).catch(reject);
                }
                else {
                    reject("Transaction pre check failed, check your balances");
                }
            });
        });
    }

    /**
     * Save presale to the blockchain
     * @param mail - user email
     * @param adr - payment bitcoin address
     * @param satoshis
     * @param milliWRG
     */

    async logPresale(mail, adr, satoshis, milliWRG,bitcoinSRC, bitcoinDEST) {
        return new Promise((resolve,reject)=> {

            try {
                logger.info("Starting presale record");

                const actual_presale = () => {
                    this.presaleContract.markSale(mail, adr, satoshis, milliWRG, bitcoinSRC, bitcoinDEST, {from: masterAccount}, (err, result) => {
                        if (err) {
                            logger.error("cointransfer failed", err);
                            reject(err);
                            return;
                        }
                        logger.info("cointransfer succeeded", result);
                        resolve(result);
                    });
                };

                this.presaleContract.markSale.call(mail, adr, satoshis, milliWRG, bitcoinSRC, bitcoinDEST, {from: masterAccount}, (err, callResult) => {
                    logger.debug("Trying presale transaction pre-execution", err, callResult);

                    if (err) {
                        reject("Failed to perform pre-call");
                        return;
                    }

                    if (callResult) {
                        logger.debug('donate preview succeeds so now sendTx...');
                        actual_presale()
                    }
                    else {
                        reject("Transaction pre check failed, check your balances");
                    }
                });
            } catch (e) {
                dumpError(e);
                reject(e);
            }
        });
    }

    async getTxHashData(hash) {
        return await promisify(this.web3.eth.getTransaction)(hash);
    }


}




export default WebGold;




