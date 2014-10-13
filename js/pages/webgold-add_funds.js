Stripe.setPublishableKey("pk_test_4TXrc4yeq5wgWdCcsvFPUD9C");   //Publisher key

$(document).ready(function () {
	$('#payment-form').submit(function (event) {
		var $form = $(this);
		Stripe.card.createToken($form, stripeResponseHandler);
		return false;
	});
});

function stripeResponseHandler(status, response) {
	var $form = $('#payment-form');
	var url = domainUrl + "/api/stripe";
	if (response.error) {
		var message = response.error.message;
		showErrorMessage(message);
	} else {
		var token = response.id;
		$("#stripeToken").val(token);

		var result = { };
		$.each($('form').serializeArray(), function () {
			result[this.name] = this.value;
		});
		$.post(url + "/donate",
			result,
			function (data, status) {
				var transactionId = data.id;
				var amount = data.amount;
				var message = "You have done donation of " + amount + " . Please note your transaction id " + transactionId;

				var InfoEmail = commonData.Preference.InfoEmail;
				var data = {};
				data["to"] = InfoEmail;
				data["subject"] = "For Add funds";

				var tag = " ";
				var message = "UserId : " + $('#userid').val() + tag;
				message += "Donate : " + $('#amount').val() + tag;
				message += "Date : " + new Date().toDateString()
					+ tag;
				data["message"] = message;
				$.post(url + "/sendemail",
					data,
					function (data, status) {
						//Email status
					}
				);

				showSuccessMessage(message);
			}
		)
		;
	}
}

function showSuccessMessage(data) {
	$("#txtPaymentSuccess").text(data);
}

function showErrorMessage(data) {
	$("#txtPaymentError").text(data);
}