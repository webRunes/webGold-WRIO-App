var exports = module.exports = {};

exports.init = function (app,nconf) {
	var mailer = require('express-mailer');

	mailer.extend(app, {
		from: nconf.get('mail:from'),
		host: nconf.get('mail:host'),
		secureConnection: nconf.get('mail:secureConnection'),
		port: nconf.get('mail:port'),
		transportMethod: nconf.get('mail:transportMethod'),
		auth: {
			user: nconf.get('mail:user'),
			pass: nconf.get('mail:pass')
		}
	});
	return mailer;
};
