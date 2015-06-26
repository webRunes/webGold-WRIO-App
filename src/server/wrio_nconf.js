import path from 'path';
import nconf from 'nconf';

nconf.env().argv();

var basedirPath = path.dirname(require.main.filename);
nconf.file(path.join(basedirPath, '/config.json'));

export default nconf;