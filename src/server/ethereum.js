/**
 * Created by michbil on 15.09.15.
 */
// to run geth with json RPC use
// geth --rpc // command
import web3 from 'web3'

web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

console.log(web3.eth.accounts);

class WebGold {
    constructor() {
        this.contractadress = '0x2ada84514b9955a7c1770bf718d1fbe49e770462';
        this.token = web3.eth.contract([
            {constant:false,
            inputs:[{name:'receiver',type:'address'},
                {name:'amount',type:'uint256'}],
            name:'sendCoin',
            outputs:[{name:'sufficient',type:'bool'}],type:'function'},
            {constant:true,inputs:[{name:'',type:'address'}],name:'coinBalanceOf',outputs:[{name:'',type:'uint256'}],type:'function'},
            {inputs:[{name:'supply',type:'uint256'}],type:'constructor'},
            {anonymous:false,inputs:[{indexed:false,name:'sender',type:'address'},
            {indexed:false,name:'receiver',type:'address'},
            {indexed:false,name:'amount',type:'uint256'}],
            name:'CoinTransfer',type:'event'}]).at(this.contractadress); // change to contract address
    }

    getBalance(account) {
        return this.token.coinBalanceOf(account)
    }
}

export default WebGold;

var webGold = new WebGold();

console.log(webGold.getBalance(web3.eth.accounts[0]));
