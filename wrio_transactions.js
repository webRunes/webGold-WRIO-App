module.exports = function (app, nconf, connection) {
	var wrgData = nconf.get('mainData');
	var discountDetail = intiData(wrgData);
	app.post('/api/transaction', function (request, response) {
		var userIdSend = request.body.useridSend;
		var userIdFrom = request.body.useridFrom;
		var transactionWrg = request.body.transactionWrg;
		for (var d in discountDetail) {
			var wrgRange = d.split("-");
			var wrgStart = parseInt(wrgRange[0]);
			var wrgEnd = parseInt(wrgRange[1]);
			if (transactionWrg >= wrgStart && transactionWrg <= wrgEnd) {
				var discount = discountDetail[d];
				var discountPercentage = discount[transactionWrg];

				var totalWrg = (transactionWrg * discountPercentage ) / 100;
				var transaction = [userIdSend, userIdFrom, transactionWrg, discountPercentage, totalWrg ];
				var query = 'INSERT INTO webRunes_transactions (UserIdSend, UserIdFrom , TransactionWRG, Percentage, TotalWRG, TransactionDateTime ) values ( ?,?,?,?,?, NOW() )';
				connection.query(query, transaction, function (error, result) {
				});
				response.json(transaction);
				break;
			}
		}
	});
};

var intiData = function (wrgData) {
	/*
	 var wrgData = [
	 {"wrg": {"start": 0, "end": 10}, "percentage": {"start": 75, "end": 80}},
	 {"wrg": {"start": 10, "end": 100}, "percentage": {"start": 80, "end": 85}}
	 ];
	 */
	var discountDetail = {};
	for (var row in wrgData) {
		var data = wrgData[row];
		var wrg = data['wrg'];
		var wrgStart = wrg['start'];
		var wrgEnd = wrg['end'];

		var percentage = data['percentage'];
		var percentageStart = percentage['start'];
		var percentageEnd = percentage['end'];

		var wrgDifference = wrgEnd - wrgStart;
		var percentageDifference = percentageEnd - percentageStart;
		var discount = percentageDifference / wrgDifference;
		//console.log(percentageDifference);
		//console.log(wrgDifference);
		//console.log(discount);

		var discountIncrement = discount;
		var range = wrgStart + "-" + wrgEnd;
		discountDetail[range] = {};
		var t = {};
		for (var i = (wrgStart + 1); i <= wrgEnd; i++) {
			var discountPercentage = percentageStart + discountIncrement;
			discountIncrement += discount;
			t[i] = discountPercentage;
		}
		discountDetail[range] = (t);
	}
	return discountDetail;
};

