/**
 * Created by michbil on 15.09.15.
 */

var tokenSource = ' contract token { mapping (address => uint) public coinBalanceOf; event CoinTransfer(address sender, address receiver, uint amount); /* Initializes contract with initial supply tokens to the creator of the contract */ function token(uint supply) { coinBalanceOf[msg.sender] = (10000000000); } /* Very simple trade function */ function sendCoin(address receiver, uint amount) returns(bool sufficient) { if (coinBalanceOf[msg.sender] < amount) return false; coinBalanceOf[msg.sender] -= amount; coinBalanceOf[receiver] += amount; CoinTransfer(msg.sender, receiver, amount); return true; } }'
var tokenCompiled = eth.compile.solidity(tokenSource);

// execute contract

var supply = 10000;
var tokenContract = web3.eth.contract(tokenCompiled.token.info.abiDefinition);
var token = tokenContract.new(
    supply,
    {
        from:web3.eth.accounts[0],
        data:tokenCompiled.token.code,
        gas: 1000000
    }, function(e, contract){
        if(!e) {

            if(!contract.address) {
                console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");

            } else {
                console.log("Contract mined! Address: " + contract.address);
                console.log(contract);
            }

        } else {
            console.log("Error compiling your token",e);
        }
    });

// check ballance

token.coinBalanceOf(eth.accounts[0]) + " tokens"

// create watcher

var event = token.CoinTransfer({}, '', function(error, result){
    if (!error)
        console.log("Coin transfer: " + result.args.amount + " tokens were sent. Balances now are as following: \n Sender:\t" + result.args.sender + " \t" + token.coinBalanceOf.call(result.args.sender) + " tokens \n Receiver:\t" + result.args.receiver + " \t" + token.coinBalanceOf.call(result.args.receiver) + " tokens" )
});

// send some coin

token.sendCoin.sendTransaction(eth.accounts[1], 1000, {from: eth.accounts[0]});


// how to refer this contract:

token = eth.contract([
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
    name:'CoinTransfer',type:'event'}]).at('0x4a4ce7844735c4b6fc66392b200ab6fe007cfca8') // change to contract adress

// register contract

var tokenName = "MyFirstCoin";
registrar.addr(tokenName);
registrar.reserve.sendTransaction(tokenName, {from: eth.accounts[0]});
registrar.owner(tokenName)
