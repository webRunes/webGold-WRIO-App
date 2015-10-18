/**
 * Created by michbil on 15.09.15.
 */
// to run geth with json RPC use
// geth --rpc // command

// ln -s /srv/www/ethereumjs-accounts/ /srv/node_modules/ethereumjs-accounts-node
// geth --rpc --rpcaddr "192.168.1.4" --unlock 0

import web3 from 'web3'
import {Promise} from 'es6-promise'
import {dumpError} from './utils'
import Accounts from './ethereum-node'
import HookedWeb3Provider from 'hooked-web3-provider'
import db from './db';
import {init} from './db';
import WebRunesUsers from './dbmodels/wriouser'
import fs from 'fs';
import path from 'path'
import nconf from './wrio_nconf';
import BigNumber from 'bignumber.js';
import EtherFeed from './dbmodels/etherfeed.js'
import Emissions from './dbmodels/emissions.js'
import Donation from './dbmodels/donations.js'

import PrePayment from './dbmodels/prepay.js'


let wei = 1000000000000000000;
let SATOSHI = 100000000;
let min_amount = 0.02; //0.002// ETH, be sure that each ethereum account has this minimal value to have ability to perform one transaction


let masterAccount = nconf.get("payment:ethereum:masterAdr");
let masterPassword = nconf.get("payment:ethereum:masterPass");
if (!masterAccount) {
    throw new Error("Can't get master account address from config.json");
}
if (!masterPassword) {
    throw new Error("Can't get master account password from config.json");
}

class mongoKeyStore {
    constructor(db) {
        this.accounts = db.collection('ethereum_accounts');
    }

    get(key) {
        return new Promise((resolve,reject) =>{
            this.accounts.findOne({_id:key},function (err,data) {
                if (err) {
                    console.log("mongoKeyStore Db key search error");
                    reject(err);
                    return;
                }
                if (!data) {
                    console.log('Db key not found');
                    reject('mongoKeyStore keyNotFound '+key);
                    return;
                }
                resolve(data.value);
            })
        });
    }

    set(key,value) {
        var that = this;
        return new Promise((resolve,reject) =>{
            console.log("Writing account to keystore");
            this.accounts.insertOne({
                "_id": key,
                "value": value

            },function(err,res) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve("OK");
            });
        });
    }



}



class WebGold {
    constructor(db) {
        var that = this;
        this.contractadress = '0xfa15b8c872f533cd40abfd055507f2907bcf1581';
        var abi_file = path.resolve(__dirname, '../../ethereum/token.abi');
        this.abi = eval(fs.readFileSync(abi_file).toString());
        this.token = web3.eth.contract(this.abi)
            .at(this.contractadress,(err,res) => {
                if (err) {
                    throw "Contract init failed";
                    return;
                }
                console.log("Contract init finished");
        }); // change to contract address

        this.KeyStore =  new mongoKeyStore(db);
        this.accounts = new Accounts(
            {
                minPassphraseLength: 6,
                KeyStore: this.KeyStore

            });


        var provider = new HookedWeb3Provider({
            host: nconf.get('payment:ethereum:host'),
            transaction_signer: this.accounts
        });
        console.log("Creating Hoooked web3 provider");
        web3.setProvider(provider);

        this.users = new WebRunesUsers(db);

        this.WRGExchangeRate = new BigNumber(nconf.get('payment:WRGExchangeRate'));

        var event = this.token.CoinTransfer({}, '', async (error, result) => {
            if (error) {
                console.log("Cointransfer listener error");
            } else {
                try {
                    var amount = result.args.amount;
                    var sender = result.args.sender;
                    var receiver = result.args.receiver;
                    var wrioUsers = new WebRunesUsers();
                    var user = await wrioUsers.getByEthereumWallet(receiver);

                    console.log("WRG transfer finished: "+amount+" from: "+sender+" to: "+ receiver);
                    await this.processPendingPayments(user.wrioID,amount)

                } catch (e) {
                    console.log("Processing payment failed",e);
                }

            }

        });
    }


    async processPendingPayments(wrioID,amount) {

        /* Check all prepayments, if there's some, mark them as completed, */

        var left = amount;

        var pre = new PrePayment();
        var pending = await pre.getAll({'status':'pending',userID:wrioID});

        for (var payment in pending) {
            var p = peding[payment];
            if (left > p.amount) {
                var wrioUser = new WebRunesUsers();
                var user = wrioUser.getByWrioID(p.userID);
                await this.makeDonate(user, p.to, p.amount);
                await wrioUser.modifyAmount(user.wrioID,p.amount); // remove payment amount from user's debt
                await wrioUser.updateByWrioID(user.wrioID,{'state':'finished'});
                left -= amount;

            }
        }
        console.log("Pre-payments paid, left",left);

    }

    async unlockByWrioID (wrioID) {
        var user = await this.users.getByWrioID(wrioID);
        console.log(user);
        if (user.ethereumWallet) {
            console.log("Unlocking existing wallet for " + wrioID);
            this.accounts.unlockAccount(user.ethereumWallet,wrioID);
        }
    }

    async estimateGas(trans) {
        var result = web3.eth.estimateGas({
            to: "0xc4abd0339eb8d57087278718986382264244252f",
            data: "0xc6888fa10000000000000000000000000000000000000000000000000000000000000003"
        });
        console.log(result); //
    }


    async getEthereumAccountForWrioID (wrioID) {

        var user = await this.users.getByWrioID(wrioID);
        console.log(user);
        if (user.ethereumWallet) {
            console.log("Returning existing wallet for "+wrioID);
            return user.ethereumWallet;
        } else {
            return await this.createEthereumAccountForWRIOID(wrioID)
        }

    }

    async createEthereumAccountForWRIOID (wrioID) {
        var accountObject = await this.accounts.newAccount(wrioID);
        console.log("Created account for WRIOID: "+wrioID+": ", accountObject);
        await this.users.updateByWrioID(wrioID,{"ethereumWallet":accountObject.address})
        return accountObject.address;

    }


    getEtherBalance(account) {
        return new Promise((resolve,reject) =>{
            web3.eth.getBalance(account, (err,res) => {
                if (err) {
                    reject("getEtherBalance failed");
                } else {
                    resolve(res.toString())
                }
            })
        });
    }

    getBalance(account) {
        return new Promise((resolve, reject) => {
            this.token.coinBalanceOf(account, (err, balance)=> {
                if (err) {
                    reject(err);
                }
                resolve(balance);
            });
        });
    }

    etherTransfer(to,amount) {
        return new Promise((resolve,reject)=> {
            var sender = masterAccount;
            var recipient = to;

            this.accounts.unlockAccount(masterAccount,masterPassword);

            console.log("Preparing to transfer",amount,"ETH");

            var amountWEI = web3.toWei(amount, "ether");
            web3.eth.sendTransaction({from: sender, to: recipient, value: amountWEI}, (err, result) => {
                if (err) {
                    console.log("etherTransfer failed");
                    reject("Ether transfer failed");
                    return;
                }
                console.log("Ether transfer succeeded: ",to, amount,amountWEI,result);
                resolve(result);
            });
        });
    }




    coinTransfer(from,to,amount) {

        var that = this;
        return new Promise((resolve,reject)=> {

            function actual_sendcoin() {
                that.accounts.unlockAccount(masterAccount,masterPassword);
                that.token.sendCoin.sendTransaction(to, amount, {from: from}, (err,result)=>{
                    if (err) {
                        console.log("cointransfer failed",err);
                        reject(err);
                        return;
                    }
                    console.log("cointransfer succeeded",result);
                    resolve(result);
                });
            }

            console.log("Starting sendCoin cointransfer",from,to,amount);


            that.token.sendCoin.call(to, amount, {from: from},(err, callResult) => {
                console.log("Trying sendcoin pre-transcation execution",err,callResult);
                if (err) {
                    reject("Failed to perform pre-call");
                    return;
                }

                if (callResult) {
                    console.log('sendCoin preview succeeds so now sendTx...');
                    actual_sendcoin();
                }
                else {
                    reject("Can't pre check failed, check your balances");
                }
            });
        });


    }

    /*
    This function checks if minimum required amount of ether is available for specified account
     */

    async ensureMinimumEther(dest,toWrio) { //TODO: add ethereum queue for adding funds, to prevent multiple funds transfer
        var ethBalance = await this.getEtherBalance(dest)/wei;
        console.log("Ether:",ethBalance);
        if (ethBalance < min_amount) {
            console.log("Adding minium ether amount",ethBalance);
            await this.etherTransfer(dest,min_amount);

            var feed = new EtherFeed();
            await feed.create(dest,min_amount,toWrio);
        } else {
            console.log("Account has minimum ether, cancelling");
        }
    }


    /*
     This function emits new WRG for specified WRIOid
     */

    async emit (dest,amount,toWrio) {
        if (!amount) throw new Error("Amount not specified");
        if (!dest) throw new Error("Destination not specified");
        if (!toWrio) throw new Error("toWrio address not specified");

        console.log("Emitting new wrg to",dest,"Amount=",amount);
        this.accounts.unlockAccount(masterAccount,masterPassword);
        await this.coinTransfer(masterAccount,dest,amount);
        await this.ensureMinimumEther(dest,toWrio);
        var emission = new Emissions();
        await emission.create(toWrio,amount);
    }


    donate(from,to,amount) {

        var that = this;
        return new Promise((resolve,reject)=> {

            function actual_donate() {
                that.accounts.unlockAccount(masterAccount,masterPassword);
                that.token.donate.sendTransaction(to, amount, {from: from}, (err,result)=>{
                    if (err) {
                        console.log("donate failed",err);
                        reject(err);
                        return;
                    }
                    console.log("donate succeeded",result);
                    resolve(result);
                });
            }

            console.log("Starting donate cointransfer");
            //console.log(this.token.donate);


            this.token.donate.call(to, amount, {from: from},(err, callResult) => {
                console.log("Trying donate pre-transcation execution",err,callResult);

                if (err) {
                    reject("Failed to perform pre-call");
                    return;
                }

                if (callResult) {
                    console.log('donate preview succeeds so now sendTx...');
                    actual_donate();
                }
                else {
                    reject("Transaction pre check failed, check your balances");
                }
            });
        });
    }

    // actual donate wrapper

    async makeDonate (user, to, amount)  {

        var dest = await this.getEthereumAccountForWrioID(to);
        var src = await this.getEthereumAccountForWrioID(user.wrioID);

        if (dest === src) {
            throw new Error("Can't donate to itself");
        }

        await this.unlockByWrioID(user.wrioID);
        await this.ensureMinimumEther(user.ethereumWallet,user.wrioID);

        console.log("Prepare for transfer",dest,src,amount);
        await this.donate(src,dest,amount);

        var donate = new Donations();
        await donate.create(user.wrioID,to,amount,0);

        var amountUser = amount*calc_percent(amount)/100;
        var fee = amount - amountUser;

    };


    /*

    Converts bitcoin sum to WRG

    paramenters:

    btc - bitcoin sum, in satoshi, bignumber
    btcrate - bitcoin to usd rate, as bignumber

    formulae - WRG = (btc * btcrate * 10000) / WRGExchangeRate

    WRGExchangeRate is taken from config

    return value = WRG

     */

    convertBTCtoWRG(btc,btcrate) {


        return btc.times(btcrate).times(10000).div(this.WRGExchangeRate).div(SATOSHI);

    }

    /*

     Converts bitcoin sum to WRG

     paramenters:

     btc - bitcoin sum, in satoshi, bignumber
     btcrate - bitcoin to usd rate, as bignumber

     formulae - BTC = (wrg * WRGExchangeRate) / (btcrate * 10000)

     WRGExchangeRate is taken from config

     return value = satoshis

     */

    convertWRGtoBTC(wrg,btcrate) {

        var btc = wrg.div(btcrate).div(10000).times(this.WRGExchangeRate).times(SATOSHI);
        //console.log("Converting ",wrg.toString(),"to BTC",btc.div(SATOSHI).toString(),"with rate",btcrate.toString());
        return btc;

    }


}




export default WebGold;




