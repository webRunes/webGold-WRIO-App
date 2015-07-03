import nodemailer from 'nodemailer';
import nconf from './wrio_nconf.js';

var transporter = nodemailer.createTransport({
    host: nconf.get('mail:host'),
    port: nconf.get('mail:port'),
    auth: {
        user: nconf.get('mail:user'),
        pass: nconf.get('mail:pass')
    }
});

export function sendEmail(options) {
    return new Promise((resolve, reject) => {
        transporter.sendMail({
        	from: options.from,
        	to: options.to,
        	subject: options.subject,
        	html: options.html
        }, function(err, info) {
        	if (err) {
        		return reject(err);
        	}
        	
        	resolve(info);
        });
    });
}

export default transporter;