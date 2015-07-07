import {Router} from 'express';
let wrioLogin = require('./wriologin');
import nconf from './wrio_nconf';
import connection from './wrio_mysql.js';
import Stripe from 'stripe';
import db from './db';
import {sendEmail} from './wrio_mailer.js';

const router = Router(); 
const stripe = Stripe(nconf.get('payment:stripe:secreteKey'));

router.post('/add_funds', async (request, response) => {
	try {
		console.log(wrioLogin);
		let user = await wrioLogin.getLoggedInUser(request.sessionID);
		console.log(user);
		let token = await stripe.tokens.create({
			card: {
				number: request.body.creditCard,
				exp_month: request.body.month,
				exp_year: request.body.year,
				cvc: request.body.cvv
			}
		});
		let charge = await stripe.charges.create({
			amount: request.body.amount * 100,
			currency: 'usd',
			source: token.id
		});
		let info = await sendEmail({
			from: 'info@webrunes.com',
			to: 'alekseykrasikov.hk@gmail.com',
	    	subject: 'WebRunes payment was submited',
	    	html: '<b>Success</b>'
		});
		response.status(200).send('Success');
	} catch(e) {
		console.log('Error:', e.message);
	}
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

export default router;