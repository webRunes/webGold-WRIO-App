'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _express = require('express');

var _wriologin = require('./wriologin');

var _wriologin2 = _interopRequireDefault(_wriologin);

var _wrio_nconf = require('./wrio_nconf');

var _wrio_nconf2 = _interopRequireDefault(_wrio_nconf);

var _wrio_mysqlJs = require('./wrio_mysql.js');

var _wrio_mysqlJs2 = _interopRequireDefault(_wrio_mysqlJs);

var _stripe = require('stripe');

var _stripe2 = _interopRequireDefault(_stripe);

var _wrio_mailerJs = require('../../wrio_mailer.js');

var _wrio_mailerJs2 = _interopRequireDefault(_wrio_mailerJs);

var router = (0, _express.Router)();
var stripe = (0, _stripe2['default'])(_wrio_nconf2['default'].get('payment:stripe1:secreteKey'));

router.post('/add_funds', function (request, response) {
	response.status(200).send('Success');
});

router.post('/donate', function (request, response) {
	_wriologin2['default'].loginWithSessionId(request.sessionID, function (err, User) {
		if (err) {
			console.log('User not found');
			return response.render('index.ejs', { 'error': 'Not logged in', 'user': undefined });
		}

		var chargeData = {
			amount: request.body.amount * 100,
			currency: 'usd',
			card: request.body.stripeToken,
			description: 'Donatation for WRIO'
		};

		var userId = User.userID;
		stripe.charges.create(chargeData, function (error, charge) {
			if (error) {
				console.log('Create charge error: ', error);
				return response.json(error.message);
			}
			response.json(charge);
			var flagCharge = charge != null;
			if (flagCharge) {
				var transactionId = ('id' in charge);
				if (transactionId) {
					var query = 'INSERT INTO webRunes_webGold (TransactionId, Amount , Added, UserId ) values ( ?,?,NOW(),? )';
					var amountInWRG = 100 * charge.amount / _wrio_nconf2['default'].get('payment:WRGExchangeRate');
					_wrio_mysqlJs2['default'].query(query, [charge.id, amountInWRG, userId], function (error, result) {
						return console.log(error);
					});
				} else {
					return response.json(error.message);
				}
			} else {
				return response.json({ 'message': 'Fail to charge.' });
			}
		});
	});
});

router.post('/withdraw', function (request, response) {
	var ssid = request.sessionID;
	var query = 'INSERT INTO webRunes_webGold_withdraw (Amount , Added, UserId ) values (?,NOW(),? )';
	_wrio_mysqlJs2['default'].query(query, [request.body.amount, ssid], function (error, result) {});
});

/*router.post('/sendemail', function(request, response) {
	mailer.sendMail({
		from: 'info@webrunes.com',
		to: request.body.to,
		subject: request.body.subject,
		message: request.body.message
	}, function(err) {
		if (err) {
			response.send('There was an error sending the email');
			return;
		}
		response.send('Email Sent');
	});
});*/

exports['default'] = router;
module.exports = exports['default'];