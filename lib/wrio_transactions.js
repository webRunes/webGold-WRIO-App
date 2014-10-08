module.exports = function (app) {
	app.get('/data', function (req, res) {
		console.log("Insiside data");
	});
};

