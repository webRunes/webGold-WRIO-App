import nconf from './wrio_nconf';

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: nconf.get('db:host'),
    user: nconf.get('db:user'),
    password: nconf.get('db:password'),
    database: nconf.get('db:dbname')
});

export default connection;