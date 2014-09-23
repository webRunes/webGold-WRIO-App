console.log("Start WRIO RESTFUL Web API");
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

var mailer = require('express-mailer');

mailer.extend(app, {
	from: 'bhushan.lilapara.j@gmail.com',
	host: 'smtp.gmail.com', // hostname
	secureConnection: true, // use SSL
	port: 465, // port for secure SMTP
	transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
	auth: {
		user: 'bhushan.lilapara.j@gmail.com',
		pass: 'applejava@7'
	}
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

	//console.log(chargeData);
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

app.post(url + '/withdraw', function (request, response) {
	var query = 'INSERT INTO webRunes_webGold_withdraw (Amount , Added, UserId ) values (?,NOW(),? )';
	connection.query(query, [request.body.amount, request.body.userid ], function (error, result) {
	});
});

app.set('view engine', 'jade');
app.post(url + '/sendemail', function (request, response) {
	//console.log(request.body)
	app.mailer.send('email', {
		to: request.body.to,// REQUIRED. This can be a comma delimited string just like a normal email to field.
		subject: request.body.subject,      // REQUIRED.
		message: request.body.message                 // All additional properties are also passed to the template as local variables.
	}, function (error) {
		if (error) {
			//console.log(error);
			response.send('There was an error sending the email');
			return;
		}
		response.send('Email Sent');
	});
});
app.listen(process.env.PORT || 1234);
