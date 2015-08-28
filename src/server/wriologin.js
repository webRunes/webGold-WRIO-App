import db from './db'


// used to deserialize the user
function deserialize(id, done) {
    var webrunesUsers = db.db.collection('webRunes_Users');
    var sessions = db.db.collection('sessions');
    console.log("Deserializing user by id=" + id);
    webrunesUsers.findOne(db.ObjectID(id),function (err,user) {
        if (err || !user) {
            console.log("User not found", err);
            done(err);
            return;
        }

        done(err, user);
    });
};

export function loginWithSessionId(ssid, done) {
    var sessions = db.db.collection('sessions');
    var match = ssid.match(/^[-A-Za-z0-9+/=_]+$/m);
    if (!match) {
        console.log("Wrong ssid");
        done("Error");
        return
    }
    console.log("Trying deserialize session",ssid);
    sessions.findOne({"_id": ssid}, function(err, session) {
        if (err || !session) {
            console.log("User not found", err);
            done(err);
            return;
        }

        console.log("Session deserialized " + ssid, session);
        var data = JSON.parse(session.session);
        if (data.passport) {
            var user = data.passport.user;
        } else {
            user = undefined;
        }

        if (user != undefined) {
            deserialize(user, done);
        } else {
            done("Wrong cookie")
        }

        //done(err, rows[0]);
    });
}

export function getTwitterCredentials(sessionId, done) {

    loginWithSessionId(sessionId, function callback(err, res) {
        if (err || !res) {
            console.log("Error executing request");
            done(err);
        } else {
            if (res.token && res.tokenSecret) {
                done(null, {
                    "token": res.token,
                    "tokenSecret": res.tokenSecret
                })
            } else {
                done("No login with twitter");
            }
        }
    });
}


export function getLoggedInUser(ssid) {
    return new Promise((resolve, reject) => {
        loginWithSessionId(ssid, (err, res) => {
            if (err) {
                return reject(err);
            }

            resolve(res);
        });
    });
}

/*
var obj = {
    setDB: setDB,
    loginWithSessionId: loginWithSessionId
};

export default obj;*/