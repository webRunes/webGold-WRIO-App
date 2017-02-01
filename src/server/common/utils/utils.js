/**
 * Created by michbil on 13.09.15.
 */

export function dumpError(err) {
    if (!err) return;
    if (typeof err === 'object') {
        if (err.message) {
            console.log('\nMessage: ' + err.message);
        }
        if (err.stack) {
            console.log('\nStacktrace:');
            console.log('====================');
            console.log(err.stack);
        }
    }
}
