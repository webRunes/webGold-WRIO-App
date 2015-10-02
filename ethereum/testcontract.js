var amount = 200*100;

var wrgMul = 100;
var percentMul = 1000000;

if (amount <= 0) return false;
var p = 1;
var sum_receiver = 0;
var sum_master = 0;
var percent = 0;
if ((amount > 0) && (amount < 10*wrgMul)) p = 1;
if ((amount >= 10*wrgMul) && (amount < 100*wrgMul)) p = 2;
if ((amount >= 100*wrgMul) && (amount < 1000*wrgMul)) p = 3;
if ((amount >= 1000*wrgMul) && (amount < 10000*wrgMul)) p = 4;
if (amount > 10000*wrgMul) return false;

percent = 75*percentMul + (p - 1)*5*percentMul + percentMul * amount / (2000*wrgMul);
sum_receiver = percent * amount / (percentMul*100);
sum_master = amount - sum_receiver;

console.log(p,sum_receiver/wrgMul,sum_master/wrgMul,percent);
