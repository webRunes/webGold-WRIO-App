var exports = module.exports = {};

exports.init = function (nconf) {
	var mysql = require('mysql');
	var connection = mysql.createConnection({
		host: nconf.get('mysql:host'),
		user: nconf.get('mysql:user'),
		password: nconf.get('mysql:password'),
		database: nconf.get('mysql:database')
	});
	return connection;
};
