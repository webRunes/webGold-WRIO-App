import nodemailer from 'nodemailer';
import nconf from './wrio_nconf';


var encodedMail = new Buffer(   "Content-Type: text/plain; charset=\"UTF-8\"\n" +     "MIME-Version: 1.0\n" +     "Content-Transfer-Encoding: 7bit\n" +    "to: denso.ffff@gmail.com\n" +     "from: info@webrunes.com\n" + "subject: Subject Text\n\n" + "The actual message text goes here").toString("base64").replace(/\+/g, '-').replace(/\//g, '_');

request({
        method: "POST",
        uri: "https://www.googleapis.com/gmail/v1/users/me/messages/send",
        headers: {
            "Authorization": "Bearer 'AIzaSyBShbBtMgGxOqa5OO4XHmN2GaYd2Sr8_yw'",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "raw": encodedMail
        })
    },
    function(err, response, body) {
        if(err){
            console.log(err); // Failure
        } else {
            console.log(body); // Success!
        }
    });

// create reusable transporter object using the default SMTP transport
//const apiKey = nconf.get('mail:apiKey');


var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// Load client secrets from a local file.
const apiKey = {
    "type": "service_account",
    "project_id": "hex-worksr-864",
    "private_key_id": "7de3943a6ea8bd9a5bff31f00b50df00e62d48dd",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC7+2/r0XgAiSh9\nWDpIma80KMqpY2cityJwpB7q2Ko7RUQ9bEWPt3yAQMlY5u5ywDvD2wc8pvAXFarE\nCG2ehoPuOVdLaIXSpp+JLHwqo3ukmqcst3pnJXuQ/Qfb5XXDVijuD8PzBwLlK9Np\nMgZxq005+GL+Eoa+HooMDOlAV9MMIXK+oy4gCcNQFqPYzgfZiv6eRyexusQ87/hN\nCp4/7xkkiweT8vBVJihDPwi3AsEAAwZ+smUc6KVNltPHEm88SoJJputMCLXybwGv\nH0zXkDn2MW+B8sSllk2yCue5Ei//LUNGykG9AI8cNzydgDQWuozzzxxZMRPvUhss\nq/j/+M65AgMBAAECggEBAJbvSy0wckcT2ePSzHFwnIGn4xlgy/XOz6Nb08tDDmQq\nuKEM50l+zUN5QXHVck3G1fXrToM/kvUmG4ftMH8hiJrlhZbxpMm/qccNZeEihOtk\nlahM5cYeDXocAIxqUET4UELde7sNvSBfMQ988Dmijo5mRq20GGZcxQDp+PsFyVop\nvLsXValln7K/vYb8962K7BKhc2q36BKN+OG9Xcxaz0zK2ldDb9z/d84iEEeEG5I4\nGthevBMkMrBRnxTv8myzVi5LxQEsoJNesLaD0uIDSW/9TJPD2zmECL96mbh6qvHf\n53c9pS+4vMDoD1qVMsFSJMvG/ORgnEqNcUvFhES3tZUCgYEA4YTUtphQvM7nnK0Q\nrqQLAAYeT3CqMfOEDtNNZl4P5Jn9l6iXip9QVbBRi9IjWEJYeKnJFiu+h+jJSenM\n3sngG5PugtBau5petmt9QwxezlEAEYhlQlS1IWTsGQmi78nsNd6PhkOdEsd1DHSC\nlw/F0AUE51BQNYq/LZ4+8J0jOlsCgYEA1WPM+X1YKIsF/tVnQSxrREcSieDoKLlp\nwTRkfPsff2LPSzKsfvFci2L75VtcucZ1dRTLoT0WBfYlv5Spa8gEHZnKbnFoFEFA\nHwakmuM65m+cez4Beb80z3rW9xumNVoDvgUNK3MX/RbeATq7Bli3oiHKXUziK1Yp\nCZ8R5Z1sX3sCgYAhOij9HkQHDZUiiH1EvfbA8iXVHox0/6QdaxSkWIeO7wFmLvjk\n+8QiW/An4bZDcsMGRD3Ufm18KNg/g6sjyCq05X7m1zwHGB+MURoLnu75BwYzjx0c\nQM7PNMd0iO7w1Zdv+HK9HYkvEyQzyZbUGwbSN2sZicPHn8G7Pu2XFg/ysQKBgQCy\nH7bQY/MdFL+ScyzX2G5J9lHhSh5BMFS49DUVpsIqIZ8MFGatKGip6Zx/Xf5PDPyr\nGQrJsyYZH9luzHeIAtR8qQ2zl3LbxYPy4iaxLBDUnkIvFhlBOXyp3M5oQ2pAir0o\n9yqBJHfXyijTOeU4bQIMksxLiYwZxLhI0cGsu/Xk1QKBgQCoSitjP7/CMhIObB0X\nBa2pdV0GUNN8zZ7BZU7tWrXd5hqHyeALSIXX5H7h8+bnw/Y0Svyq11Pi6i3mwdlK\nlRy1NG/LfJdf2MP0mi5rXskhPXehOz15TefH8nX5Qt7os/63fHT40I2su/JyOFO2\nFK5nf428A4re2UrPA/N426GvgA==\n-----END PRIVATE KEY-----\n",
    "client_email": "serv-519@hex-worksr-864.iam.gserviceaccount.com",
    "client_id": "117434138024599203721",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/serv-519%40hex-worksr-864.iam.gserviceaccount.com"
};
authorize(apiKey, listLabels);

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
    var gmail = google.gmail('v1');
    gmail.users.labels.list({
        auth: auth,
        userId: 'me',
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var labels = response.labels;
        if (labels.length == 0) {
            console.log('No labels found.');
        } else {
            console.log('Labels:');
            for (var i = 0; i < labels.length; i++) {
                var label = labels[i];
                console.log('- %s', label.name);
            }
        }
    });
}