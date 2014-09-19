var url = '/api/stripe'
var express = require('express');
var app = express();
var server = require('http').createServer(app);

var mysql = require('mysql');
var connection = mysql.createConnection({
	host: '54.235.73.25',
	user: 'dev1',
	password: '164103148',
	database: 'dev_wrio'
});

var allowCrossDomain = function (request, response, next) {
	response.header('Access-Control-Allow-Origin', '*');
	response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

	if ('OPTIONS' == request.method) {
		next();
	}
	else {
		next();
	}
};

app.configure(function () {
	app.use(allowCrossDomain);
	app.use(express.bodyParser());
});

var stripe = require('stripe')('sk_test_4TXrVaIIQQTpzLk2lZ8YfHvp');
app.post(url + '/donate', function (request, response) {
	var chargeData = {
		amount: request.body.amount,
		currency: 'usd',
		card: request.body.stripeToken,
		description: 'Donatation for WRIO'
	}

	console.log(chargeData);
	stripe.charges.create(chargeData, function (error, charge) {
		response.json(charge);
		var transactionId = "id" in charge;
		if (transactionId) {

			var query = 'INSERT INTO webRunes_webGold (TransactionId, Amount , Added, UserId ) values ( ?,?,NOW(),? )';
			connection.query(query, [charge.id, charge.amount, request.body.userid ], function (error, result) {
			});
		} else {
			response.json(error.message);
		}
	});
});
app.listen(process.env.PORT || 1234);
