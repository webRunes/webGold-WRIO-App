import db from './db';
import logger from 'winston';

// used to deserialize the user
function deserialize(id, done) {
    var webrunesUsers = db.db.collection('webRunes_Users');
    var sessions = db.db.collection('sessions');
    logger.verbose("Deserializing user by id=" + id);
    webrunesUsers.findOne(db.ObjectID(id),function (err,user) {
        if (err || !user) {
            logger.error("User not found", err);
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
        logger.error("Wrong ssid");
        done("Error");
        return;
    }
    logger.debug("Trying deserialize session",ssid);
    sessions.findOne({"_id": ssid}, function(err, session) {
        if (err || !session) {
            logger.error("User corresponding to this SID not found", err);
            done(err);
            return;
        }

        logger.debug("Session deserialized " + ssid, session);
        var data = JSON.parse(session.session);
        if (data.passport) {
            var user = data.passport.user;
        } else {
            user = undefined;
        }

        if (user != undefined) {
            deserialize(user, done);
        } else {
            done("Wrong cookie");
        }

        //done(err, rows[0]);
    });
}
/*

Returns promise of fake user's session, needed for testing purposes

 */


export function generateFakeSession(userID) {
    var sessions = db.db.collection('sessions');

    return new Promise((resolve,reject) => {
        var item = {
            _id: "--QGt2nm4GYtw3a5uIRoFQgmy2-fWvaW",
            expires: new Date(909090909090990),
            session: JSON.stringify({
                cookie: {
                    "originalMaxAge": 0,
                    expires: "2025-11-22"
                },
                passport: {
                    user: userID
                }
            })
        };

       sessions.insertOne(item,(err,res) => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
    });

}

/*

Clears test db records when unit testing (promised)

DON'T use in production environment !!!!

 */

export function clearTestDb() {
    var sessions = db.db.collection('sessions');
    return new Promise((resolve,reject) => {

            //  logger.debug(db);

            if (db.db.s.databaseName != "webrunes_test") {
                return reject("Wipe can be made only on test db");
            }
            sessions.remove({},(err) => {
                if (err)  {
                    return reject(err);
                }
                resolve("Wipe ok");
            });
        }

    );
}


export function getTwitterCredentials(sessionId, done) {

    loginWithSessionId(sessionId, function callback(err, res) {
        if (err || !res) {
            logger.debug("Error executing request");
            done(err);
        } else {
            if (res.token && res.tokenSecret) {
                done(null, {
                    "token": res.token,
                    "tokenSecret": res.tokenSecret
                });
            } else {
                done("No login with twitter");
            }
        }
    });
}

/*

Returns logged in user id (promised)

 */

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
