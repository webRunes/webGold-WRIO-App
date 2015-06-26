"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _connection = require("./connection");

var _connection2 = _interopRequireDefault(_connection);

// used to deserialize the user
function deserialize(id, done) {
    console.log("Deserializing user by id=" + id);
    _connection2["default"].query("select * from `webRunes_Users` where userID =" + id, function (err, rows) {
        if (err) {
            console.log("User not found", err);
            done(err);
            return;
        }

        done(err, rows[0]);
    });
};

function loginWithSessionId(ssid, done) {
    var match = ssid.match(/^[-A-Za-z0-9+/=_]+$/m);
    if (!match) {
        console.log("Wrong ssid");
        done("Error");
        return;
    }
    var q = "select * from sessions where session_id =\"" + ssid + "\"";
    _connection2["default"].query(q, function (err, rows) {
        if (err) {
            console.log("User not found", err);
            done(err);
            return;
        }
        if (rows[0] == undefined) {
            done("Session not found");
            return;
        }
        console.log("Session deserialized " + ssid, rows[0]);
        var data = JSON.parse(rows[0].data);

        var user;
        if (data.passport) {
            user = data.passport.user;
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

function getTwitterCredentials(sessionId, done) {

    loginWithSessionId(sessionId, function callback(err, res) {
        if (err) {
            console.log("Error executing request");
            done(err);
        } else {
            if (res.token && res.tokenSecret) {
                done(null, { "token": res.token, "tokenSecret": res.tokenSecret });
            } else {
                done("No login with twitter");
            }
        }
    });
}

module.exports.loginWithSessionId = loginWithSessionId;
module.exports.getTwitterCredentials = getTwitterCredentials;