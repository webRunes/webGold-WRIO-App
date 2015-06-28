import nodemailer from 'nodemailer';
import nconf from './wrio_nconf.js';

var transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 26,
    auth: {
        user: 'info@webrunes.com',
        pass: 'dkejd2!df3s'
    }
});

export function sendEmail(options, cb) {
    transporter.sendMail({
    	from: options.from,
    	to: options.to,
    	subject: options.subject,
    	html: options.html
    }, function(err, info) {
    	if (err) {
    		return cb(err, null);
    	}
    	
    	return cb(null, info);
    });
}

export default transporter;