var express = require('express');
var app = require("./wrio_app.js").init(express);
var server = require('http').createServer(app).listen(1234);
var url = '/api/stripe';
var nconf = require("./wrio_nconf.js").init();
//Main Files - Don't Change sequence/position.

console.log("Start WRIO RESTFUL Web API");
var connection = require("./wrio_mysql.js").init(nconf);
app.set('view engine', 'jade');
var stripe = require('stripe')(nconf.get('payment:stripe1:secreteKey'));


var mailer = require("./wrio_mailer.js").init(app, nconf);
require("./wrio_transactions.js")(app, nconf, connection);

app.get('/api/check', function (request, response) {
	console.log("Node is working properly.");
	response.json("Node is working properly.");
});

app.post(url + '/donate', function (request, response) {
	var chargeData = {
		amount: request.body.amount,
		currency: 'usd',
		card: request.body.stripeToken,
		description: 'Donatation for WRIO'
	}

	//console.log(chargeData);
	stripe.charges.create(chargeData, function (error, charge) {
		response.json(charge);
		var flagCharge = (charge != null);
		if (flagCharge) {
			var transactionId = "id" in charge;
			if (transactionId) {
				var query = 'INSERT INTO webRunes_webGold (TransactionId, Amount , Added, UserId ) values ( ?,?,NOW(),? )';
				connection.query(query, [charge.id, charge.amount, request.body.userid ], function (error, result) {
				});
			} else {
				response.json(error.message);
			}
		} else {
			response.json({"message": "Fail to charge."});
		}
	});
});

app.post(url + '/withdraw', function (request, response) {
	var query = 'INSERT INTO webRunes_webGold_withdraw (Amount , Added, UserId ) values (?,NOW(),? )';
	connection.query(query, [request.body.amount, request.body.userid ], function (error, result) {
	});
});
app.post(url + '/sendemail', function (request, response) {
	//console.log(request.body)
	app.mailer.send('email', {
		to: request.body.to,
		subject: request.body.subject,
		message: request.body.message
	}, function (error) {
		if (error) {
			response.send('There was an error sending the email');
			return;
		}
		response.send('Email Sent');
	});
});
console.log("Web application opened on 1234 PORT .");