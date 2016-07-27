import path from 'path';
import nconf from 'nconf';
import logger from 'winston';

nconf.env().argv();

var basedirPath = path.dirname(require.main.filename); // won't work with unit tests
if (process.env.WRIO_CONFIG) {
    nconf.file(path.resolve(__dirname, `../../${process.env.WRIO_CONFIG}`));
    logger.info(`${process.env.WRIO_CONFIG} config loaded`);
} else {
    nconf.file(path.resolve(__dirname, '../../config.json'));
}

export default nconf;