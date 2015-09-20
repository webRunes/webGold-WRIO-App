/**
 * Created by michbil on 15.09.15.
 */
// to run geth with json RPC use
// geth --rpc // command
import web3 from 'web3'
import {Promise} from 'es6-promise'
import {dumpError} from './utils'


web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

console.log(web3.eth.accounts);

class WebGold {
    constructor() {
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
    }


    getEtherBalance(account) {
        return new Promise((resolve,reject) =>{
            web3.eth.getBalance(web3.eth.accounts[0], (err,res) => {
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
            });
        });
    }

}

var operate = async () => {

    try {
        var webGold = new WebGold();

        console.log(await webGold.getEtherBalance(web3.eth.accounts[0]));

        var ballance1 = await webGold.getBalance(web3.eth.accounts[0]);
        var ballance2 = await webGold.getBalance(web3.eth.accounts[1]);

        //await webGold.coinTransfer(web3.eth.accounts[0],web3.eth.accounts[1],100);

        console.log(ballance1.toString(),ballance2.toString());

    } catch (e) {
        console.log("operate error",e);
        dumpError(e);

    }

};

operate();

export default WebGold;




