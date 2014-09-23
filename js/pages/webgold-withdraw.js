$(document).ready(function () {
	$('#withdraw-form').submit(function (event) {
		console.debug("Inside withdraw-form");
		var $form = $('#withdraw-form');
		var url = "http://localhost:1234/api/stripe";

		var InfoEmail = "bhushan2250@gmail.com";
		var data = {};
		data["to"] = InfoEmail;
		data["subject"] = "For withdraw";

		var tag = " ";
		var message = "UserId : " + $('#userid').val() + tag;
		message += "Withdraw funds : " + $('#amount').val() + tag;
		message += "Email : " + $('#email').val() + tag;
		message += "Date : " + new Date().toDateString()
			+ tag;
		data["message"] = message;
		$.post(url + "/sendemail",
			data,
			function (data, status) {
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