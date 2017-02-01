/**
 * Created by michbil on 27.09.15.
 */

const wrgMul = 100;
const percentMul = 1000000; /*  add percent multiplier */

function get_percent(amount) {
    const inWrg = amount / wrgMul;

    if ((inWrg >= 0) && (inWrg < 2)) return 50;
    if ((inWrg >= 2) && (inWrg < 4)) return 55;
    if ((inWrg >= 4) && (inWrg < 8)) return 60;
    if ((inWrg >= 8) && (inWrg < 16)) return 65;
    if ((inWrg >= 16) && (inWrg < 32)) return 70;
    if ((inWrg >= 32) && (inWrg < 64)) return 75;
    if ((inWrg >= 64) && (inWrg < 128)) return 80;
    if ((inWrg >= 128) && (inWrg < 256)) return 85;
    if ((inWrg >= 256) && (inWrg < 512)) return 90;
    if (inWrg >= 512) return 95;
    return 95;
}

function calc_percent(wrg) {



    return wrg * get_percent(wrg) / 100;

}

for (var i=0;i < 60000;i+= 1600) {
    console.log("SUM", i/wrgMul,"    ",get_percent(i),"   ",calc_percent(i)/wrgMul)
}
