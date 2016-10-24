import nodemailer from 'nodemailer';
import nconf from './wrio_nconf';

// create reusable transporter object using the default SMTP transport
const user = nconf.get('mail:user');
const pass = nconf.get('mail:pass');
const serv = nconf.get('mail:host');

const transporter = nodemailer.createTransport(`smtps://${user}:${pass}@${serv}`);
console.log(`smtp://${user}:${pass}@${serv}`);

// setup e-mail data with unicode symbols 
var mailOptions = {
    from: 'Webrunes <info@webrunes.com>', // sender address
    to: 'denso.ffff@gmail.com', // list of receivers
    subject: 'Hello ✔', // Subject line 
    text: 'Hello world 🐴', // plaintext body 
    html: '<b>Hello world 🐴</b>' // html body 
};

// send mail with defined transport object 
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log('Message sent: ' + info.response);
});