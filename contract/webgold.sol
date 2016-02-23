/* Main webgold contract file */

contract token {
  
  mapping (address => uint) public coinBalanceOf;
  uint constant wrgMul = 100; /*  coinBallance is stored in cWRG, 1/100th of WRG */
  uint constant percentMul = 1000000; /*  add percent multiplier */
  address master;
   event CoinTransfer(address sender, address receiver, uint amount);

    /* Initializes contract with initial supply tokens to the creator of the contract */

    function token(uint supply) {
     coinBalanceOf[msg.sender] = (5000000*wrgMul);
     master = msg.sender;
    }

    /* Very simple trade function */

    function sendCoin(address receiver, uint amount) returns(bool sufficient) {
     if (coinBalanceOf[msg.sender] < amount) return false;
       coinBalanceOf[msg.sender] -= amount;
       coinBalanceOf[receiver] += amount;
       CoinTransfer(msg.sender, receiver, amount);
       return true;
     }

    function getPercent(uint amount) internal returns (uint out_percent) {

        uint p = 1;
        uint percent = 0;

        if ((amount > 0) && (amount < 10*wrgMul)) p = 1;
        if ((amount >= 10*wrgMul) && (amount < 100*wrgMul)) p = 2;
        if ((amount >= 100*wrgMul) && (amount < 1000*wrgMul)) p = 3;
        if ((amount >= 1000*wrgMul) && (amount < 10000*wrgMul)) p = 4;
        if ((amount >= 10000*wrgMul) && (amount < 100000*wrgMul)) p = 5;
        if (amount >= 100000*wrgMul) return 0;

        percent = 75*percentMul + (p - 1)*5*percentMul + percentMul * amount / (2000*wrgMul);
        return percent;

    }

    function donate(address receiver, uint amount) returns(bool sufficient) {
        if (amount <= 1*wrgMul) return false;

        uint sum_receiver = 0;
        uint sum_master = 0;
        uint percent = 0;

        percent = getPercent(amount);
        if (percent == 0) {
            return false; // if have too big sum, don't proceed any further
        }
        sum_receiver = percent * amount / (percentMul*100);
        sum_master = amount - sum_receiver;

        if (coinBalanceOf[msg.sender] < amount) return false;
        coinBalanceOf[msg.sender] -= amount;
        coinBalanceOf[receiver] += sum_receiver;
        coinBalanceOf[master] += sum_master;
        CoinTransfer(msg.sender, receiver, amount);
        return true;
    }
}
