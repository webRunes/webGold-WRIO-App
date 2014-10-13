$(document).ready(function () {
	$('#donation-form').submit(function (event) {
		var url = domainUrl + "/api";
		console.log("Inside submit.");

		var $form = $(this);
		var result = {};
		$.each($form.serializeArray(), function () {
			result[this.name] = this.value;
		});
		console.log(result);

		$.post(url + "/transaction",
			result,
			function (data, status) {
				var message = "Donation have been received." + JSON.stringify(data);
				showSuccessMessage(message);
			}
		);
		return false;
	});
});

function showSuccessMessage(message) {
	$("#txtDonationSuccess").text(message);
}

function showErrorMessage(message) {
	$("#txtDonationError").text(message);
}