/**
 * Created by michbil on 13.09.15.
 */

import logger from 'winston';

export function dumpError(err) {
    if (!err) return;
    if (typeof err === 'object') {
        if (err.message) {
            logger.error('\nMessage: ' + err.message);
        }
        if (err.stack) {
            logger.error('\nStacktrace:');
            logger.error('====================');
            logger.error(err.stack);
        }
    }
}

export function calc_percent(wrg) {
    var p;
    if (wrg === 0) {
        p = 1;
    } else {
        p = Math.floor(Math.log10(wrg)+1);
    }

    var percent = 75 + (p - 1) * 5 + wrg*0.0005;
    return percent;

}