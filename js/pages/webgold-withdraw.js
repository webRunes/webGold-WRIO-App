$(document).ready(function () {
	$('#withdraw-form').submit(function (event) {
		var $form = $('#withdraw-form');
//		var url = "http://telesens.cloudapp.net:1234/api/stripe";
		var url = "http://telesens.cloudapp.net/api/stripe";

		var InfoEmail = "bhushan2250@gmail.com";
		var data = {};
		data["to"] = InfoEmail;
		data["subject"] = "For withdraw";
		data["userid"] = $('#userid').val();
		data["amount"] = $('#amount').val();

		var tag = " ";
		var message = "UserId : " + $('#userid').val() + tag;
		message += "Withdraw funds : " + $('#amount').val() + tag;
		message += "Email : " + $('#email').val() + tag;
		message += "Date : " + new Date().toDateString()
			+ tag;
		data["message"] = message;


		$.post(url + "/withdraw",
			data,
			function (response, status) {

			}
		);

		$.post(url + "/sendemail",
			data,
			function (response, status) {
				var message = "E-mail Sent successfully."
				showSuccessMessage(message);
			}
		);




		return false;
	});
});


function showSuccessMessage(data) {
	$("#txtWithdrawSuccess").text(data);
}

function showErrorMessage(data) {
	$("#txtWithdrawError").text(data);
}