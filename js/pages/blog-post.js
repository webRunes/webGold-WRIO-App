$(document).ready(function () {
	$('#donation-form').submit(function (event) {
		console.log("Inside submit.");

		var $form = $(this);
		var result = {};
		$.each($form.serializeArray(), function () {
			result[this.name] = this.value;
		});
		console.log(result);
		/*
		 $.post(url + "/donate",
		 result,
		 function (data, status) {
		 var message = "Donation have been received.";
		 showSuccessMessage(message);
		 }
		 );
		 */
		return false;
	});
});

function showSuccessMessage(message) {
	$("#txtDonationSuccess").text(message);
}

function showErrorMessage(message) {
	$("#txtDonationError").text(message);
}