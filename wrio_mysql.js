var exports = module.exports = {};

exports.init = function (nconf) {
    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: nconf.get('db:host'),
        user: nconf.get('db:user'),
        password: nconf.get('db:password'),
        database: nconf.get('db:database')
    });
    return connection;
};
