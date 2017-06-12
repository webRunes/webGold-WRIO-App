/**
 * Created by michbil on 13.09.15.
 */

const logger = require('winston');

function calc_percent(wrg) {
    var p;
    if (wrg === 0) {
        p = 1;
    } else {
        p = Math.floor(Math.log10(wrg)+1);
    }

    var percent = 75 + (p - 1) * 5 + wrg*0.0005;
    return percent;

}

function formatBlockUrl(block) {
    return 'https://ropsten.etherscan.io/tx/'+block;
}
module.exports = {calc_percent,formatBlockUrl};