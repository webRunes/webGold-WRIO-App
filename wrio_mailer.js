var nodemailer = require('nodemailer');
var nconf = require('./app/server/wrio_nconf.js');

var transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 26,
    auth: {
        user: 'info@webrunes.com',
        pass: 'dkejd2!df3s'
    }
});

module.exports = transporter;