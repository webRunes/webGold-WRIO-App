/**
 * Created by michbil on 27.09.15.
 */

function calc_percent(wrg) {
    var p;
    if (wrg === 0) {
        p = 1
    } else {
        p = Math.floor(Math.log10(wrg)+1);
    }

    d1 = Math.floor(wrg/1000);var rest = wrg%1000;
    d2 = Math.floor(rest/100);rest = rest % 100;
    d3 = Math.floor(rest/10);
    d4 = rest%10;

    console.log("=",d1,d2,d3,d4,"=");

    var percent = 75 + (p - 1) * 5 + d1 * 0.5 + d2 * 0.05 + d3 * 0.005 + d4 * 0.0005;


    return percent;

}

function calc_percent1(wrg) {
    var p;
    if (wrg === 0) {
        p = 1
    } else {
        p = Math.floor(Math.log10(wrg)+1);
    }

    d1 = Math.floor(wrg/1000);var rest = wrg%1000;
    d2 = Math.floor(rest/100);rest = rest % 100;
    d3 = Math.floor(rest/10);
    d4 = rest%10;

    console.log("=",d1,d2,d3,d4,"=");

    var percent = 75 + (p - 1) * 5 + wrg*0.0005;


    return percent;

}


for (var i=0;i < 1000;i+= 10) {
    console.log(i,"    ",calc_percent(i),"  | ", calc_percent1(i))
}
