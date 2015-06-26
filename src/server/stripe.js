import {Router} from 'express';
import wrioLogin from './wriologin';
import nconf from './wrio_nconf';
import connection from './wrio_mysql.js';
import Stripe from 'stripe';
import mailer from '../../wrio_mailer.js';

var router = Router(); 
var stripe = Stripe(nconf.get('payment:stripe1:secreteKey'));

router.post('/add_funds', (request, response) => {
	response.status(200).send('Success');
});

router.post('/donate', function(request, response) {
	wrioLogin.loginWithSessionId(request.sessionID, function(err, User) {
		if (err) {
			console.log("User not found")
			return response.render('index.ejs', {"error": "Not logged in", "user": undefined});
		}
		
		var chargeData = {
			amount: request.body.amount * 100,
			currency: 'usd',
			card: request.body.stripeToken,
			description: 'Donatation for WRIO'
		}
		
		var userId = User.userID;
		stripe.charges.create(chargeData, function(error, charge) {
			if (error) {
				console.log("Create charge error: ", error);
				return response.json(error.message);
			}
			response.json(charge);
			var flagCharge = (charge != null);
			if (flagCharge) {
				var transactionId = "id" in charge;
				if (transactionId) {
					var query = 'INSERT INTO webRunes_webGold (TransactionId, Amount , Added, UserId ) values ( ?,?,NOW(),? )';
					var amountInWRG = 100 * charge.amount / nconf.get('payment:WRGExchangeRate');
					connection.query(query, [charge.id, amountInWRG, userId], function(error, result) {
						return console.log(error);
					});
				} else {
					return response.json(error.message);
				}
			} else {
				return response.json({"message": "Fail to charge."});
			}
		});
	});
});

router.post('/withdraw', function(request, response) {
	var ssid = request.sessionID;
	var query = 'INSERT INTO webRunes_webGold_withdraw (Amount , Added, UserId ) values (?,NOW(),? )';
	connection.query(query, [request.body.amount, ssid], function(error, result) {
	});
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

export default router;