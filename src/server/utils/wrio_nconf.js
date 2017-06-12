const path = require('path');
const nconf = require('nconf');

nconf.env().argv();

var basedirPath = path.dirname(require.main.filename); // won't work with unit tests

var file;
if (process.env.WRIO_CONFIG) {
    file = path.resolve(__dirname, `../../../${process.env.WRIO_CONFIG}`);
} else {
    file = path.resolve(__dirname, '../../../config.json');
}

nconf.file(file);

console.log("Sample configuration loaded "+file);

module.exports = nconf;