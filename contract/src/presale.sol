pragma solidity ^0.4.0;

contract Presale {
   struct PresaleEntry {
        address ethID;
        string email;
        uint satoshis;
        uint milliWRG;
    }
  
   PresaleEntry [] public entries ;
   address master;
   uint presaleAmount;
   event presaleMade(string sender, uint satoshis);

    /* Initializes contract with initial supply tokens to the creator of the contract */

    function Presale() {
     master = msg.sender;
     presaleAmount = 23970000 * 100; // 6 030 000 was sold to first investors
    }

    /* Very simple trade function */

    function markSale(string mail, address adr, uint satoshis, uint milliWRG) returns(bool sufficient) {
        PresaleEntry memory entry;
        int expectedWRG = int(presaleAmount) - int(milliWRG);
        
        if (msg.sender != master) return false; 
        if (expectedWRG < 0) return false;
        
        presaleAmount -= milliWRG;
        entry.ethID = adr;
        entry.email = mail;
        entry.satoshis = satoshis;
        entry.milliWRG = milliWRG;
        
        entries.push(entry);
        
        return true;
     }
     
     function getAmountLeft() returns (uint amount){
         return presaleAmount;
     }
     
     function getPresaleNumber() returns (uint length){
         return entries.length;
     }
    
     function getPresale(uint i) returns (string,address,uint,uint){
         uint max = entries.length;
         if (i >= max) {
             return ("NotFound",0,0,0);
         }
         return (entries[i].email,entries[i].ethID, entries[i].satoshis, entries[i].milliWRG);
     }

}
