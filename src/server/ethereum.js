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
import WebRunesUsers from './wriouser'

//web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
//web3.setProvider(new web3.providers.HttpProvider('http://192.168.1.14:8545'));


class mongoKeyStore {
    constructor(db) {
        this.accounts = db.collection('ethereum_accounts');
    }

    get(key) {
        return new Promise((resolve,reject) =>{
            this.accounts.findOne({_id:key},function (err,data) {
                if (err) {
                    console.log("Db key search error");
                    reject(err);
                    return;
                }
                if (!data) {
                    console.log('Db key not found');
                    reject('Keynotfound');
                    return;
                }
                resolve(data);
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
        this.contractadress = '0x2ada84514b9955a7c1770bf718d1fbe49e770462';
        this.token = web3.eth.contract([
            {
                constant:false,
                inputs:[{name:'receiver',type:'address'},
                {name:'amount',type:'uint256'}],
                name:'sendCoin',
                outputs:[{name:'sufficient',type:'bool'}],type:'function'},
                {constant:true,inputs:[{name:'',type:'address'}],name:'coinBalanceOf',outputs:[{name:'',type:'uint256'}],type:'function'},
                {inputs:[{name:'supply',type:'uint256'}],type:'constructor'},
                {anonymous:false,inputs:[{indexed:false,name:'sender',type:'address'},
                {indexed:false,name:'receiver',type:'address'},
                {indexed:false,name:'amount',type:'uint256'}],
                name:'CoinTransfer',type:'event'
            }])
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
            host: "http://192.168.1.103:8545",
            transaction_signer: this.accounts
        });
        web3.setProvider(provider);

        this.users = new WebRunesUsers(db);

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
                    reject();
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
            var sender = web3.eth.accounts[0];
            var recipient = to;

            console.log("Preparing to transfer",amount,"ETH");

            var amountWEI = web3.toWei(amount, "ether");
            web3.eth.sendTransaction({from: sender, to: recipient, value: amountWEI}, (err, result) => {
                if (err) {
                    console.log("etherTransfer failed");
                    reject();
                    return;
                }
                console.log("Ether transfer succeeded: ",to, amount,amountWEI);
                resolve();
            });
        });
    }




    coinTransfer(from,to,amount) {



        return new Promise((resolve,reject)=> {
            console.log("Starting cointransfer");
           /* var event = this.token.sendCoin.CoinTransfer({}, '', function(error, result){
                if (error) {
                    console.log("CoinTransfer failed");
                    reject(error);
                    return;
                }
                console.log("Coin transfer: " + result.args.amount +
                    " tokens were sent. Balances now are as following: \n Sender:\t" +
                    result.args.sender + " \t" + this.token.coinBalanceOf.call(result.args.sender) +
                    " tokens \n Receiver:\t" + result.args.receiver + " \t" +
                    this.token.coinBalanceOf.call(result.args.receiver) + " tokens");
                resolve("Success");

            });*/
            console.log(this.token.sendCoin);
            this.token.sendCoin.sendTransaction(to, amount, {from: from}, (err,result)=>{
                if (err) {
                    console.log("sendCoin failed");
                    reject();
                    return;
                }
                console.log("sendCoin succeeded",result);
                resolve();
            });
        });
    }

}




export default WebGold;




