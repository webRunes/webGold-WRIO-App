import path from 'path';
import nconf from 'nconf';
import logger from 'winston';

nconf.env().argv();

var basedirPath = path.dirname(require.main.filename); // won't work with unit tests
nconf.file(path.resolve(__dirname, '../../config.json'));

export default nconf;