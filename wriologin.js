/**
 * Created by mich.bil on 16.04.15.
 */
/**
 * Created by mich.bil on 16.04.15.
 */

var nconf = require("./wrio_nconf.js").init();
var mysql = require('mysql');

MYSQL_HOST = nconf.get("db:host");
MYSQL_USER = nconf.get("db:user");
MYSQL_PASSWORD = nconf.get("db:password");
MYSQL_DB = nconf.get("db:dbname");
DOMAIN= nconf.get("db:workdomain");

function handleDisconnect() {
    connection = mysql.createConnection({
        host     : MYSQL_HOST,
        user     : MYSQL_USER,
        password : MYSQL_PASSWORD
    });



    connection.connect(function(err) {              // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        } else {
            console.log("Connecting to db...")
            connection.query('USE '+MYSQL_DB);
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
                                            // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}

handleDisconnect();

// used to deserialize the user
function deserialize(id, done) {
    console.log("Deserializing user by id="+id)
    connection.query("select * from `webRunes_Users` where userID ="+id,function(err,rows){
        if (err) {
            console.log("User not found",err);
            done(err);
            return;
        }

        done(err, rows[0]);
    });
};

function loginWithSessionId(ssid,done) {
    match = ssid.match(/^[-A-Za-z0-9+/=_]+$/m);
    if (!match) {
        console.log("Wrong ssid");
        done("Error");
        return
    }
    q = "select * from sessions where session_id =\""+ssid+"\"";
    connection.query(q,function(err,rows){
        if (err) {
            console.log("User not found",err);
            done(err);
            return;
        }
        if (rows[0] == undefined) {
            done("Session not found");
            return;
        }
        console.log("Session deserialized "+ssid, rows[0]);
        data = JSON.parse(rows[0].data);

        if (data.passport) {
            user = data.passport.user;
        } else {
            user = undefined;
        }



        if (user != undefined) {
            deserialize(user,done);
        } else {
            done("Wrong cookie")
        }

        //done(err, rows[0]);
    });
}

function getTwitterCredentials(sessionId,done) {

    loginWithSessionId(sessionId,function callback(err,res) {
        if (err) {
            console.log("Error executing request");
            done(err);
        } else {
            if (res.token && res.tokenSecret) {
                done(null,{"token":res.token,"tokenSecret":res.tokenSecret})
            } else {
                done("No login with twitter");
            }
        }
    });
}

module.exports.loginWithSessionId = loginWithSessionId;
module.exports.getTwitterCredentials = getTwitterCredentials;
