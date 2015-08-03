import mysql from 'mysql';
var nconf = require("./wrio_nconf.js");

const MYSQL_HOST = nconf.get("db:host");
const MYSQL_USER = nconf.get("db:user");
const MYSQL_PASSWORD = nconf.get("db:password");
const MYSQL_DB = nconf.get("db:dbname");
const DOMAIN= nconf.get("db:workdomain");

var db_config = {
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD
}

var connection;

connect();

export default connection;

function connect() {
    connection = mysql.createConnection(db_config);
    
    console.log('Connection:', 'Connecting to data base...');
    connection.connect(err => {
        if(err) {
            console.log('Connection:', 'Error during connecting to data base:', err.message);
            setTimeout(() => {
                console.log('Connection:', 'Trying to reconnect...');
                connect();
            }, 2000);
        } else {
            console.log('Connection:', "Successfully connected to data base");
            connection.query('USE '+ MYSQL_DB);
        }
    });

    connection.on('error', err => {
        console.log('Connection:', 'Data base error: ', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('Connection:', 'Trying to reconnect...');
            connect();
        }
    });
}