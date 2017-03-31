import db from '../utils/db';
import nconf from 'nconf';
import {dumpError} from "../utils/utils.js";
import auth from 'basic-auth';


function hasPassportUser(request) {
    var sessionData = request.session;
    if (sessionData.passport) {
        if (sessionData.passport.user) {
            return sessionData.passport.user;
        }
    }
}

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

export function loginWithSessionId(request, done) {
  var user = hasPassportUser(request);
  if (user) {
      deserialize(user,done);
  } else {
      done("No WRIO user found")
  }
}




export function getLoggedInUser(request) {
    return new Promise((resolve, reject) => {
        loginWithSessionId(request, (err, res) => {
            if (err) {
                return reject(err);
            }
            resolve(res);
        });
    });
}

export function authS2S(request,response,next) {
    var creds = auth(request);
    var login = nconf.get("service2service:login");
    var password = nconf.get("service2service:password");
    if (creds && login && password) {
        if ((creds.name === login) && (creds.pass === password)) {
            next();
            return;
        }
    }
    console.log("Access denied");
    response.status(403).send("Access denied");
}

/*
 export function authS2S(request,response,next) {
 var creds = auth(request);
 var login = nconf.get("service2service:login");
 var password = nconf.get("service2service:password");
 if (creds && login && password) {
 if ((creds.name === login) && (creds.pass === password)) {
 next();
 return;
 }
 }
 console.log("Access denied");
 response.status(403).send("Access denied");
 }*/

function isAdmin(id) {
    var admins = nconf.get('payment:admins');
    if (!admins) {
        return false;
    }
    var result = false;
    admins.forEach((user)=> {
        if (id == user) {
            result = true;
        }
    });
    return result;
}

export let wrap = fn => (...args) => fn(...args).catch(args[2]);

export function wrioAuth(req,resp,next) {

    loginWithSessionId(req, (err, user) => {
        if (err) {
            console.log("Permission denied",err);
            dumpError(err);
            return resp.status(401).send("Not authorized");
        }
        req.user = user;
        next();
    });

}

export function wrioAdmin(req,resp,next) {
    wrioAuth(req,resp,() => {
        if (isAdmin(req.user.wrioID)) {
            next();
        } else {
            resp.status(403).send("Error: Not admin");
        }
    });

}

const allowedServices = ['core','login','titter','storage','webgold'];

export function restOnly(request,response,next) {
    if (!(request.get('X-Requested-With') === "XMLHttpRequest")) {
        response.status(403).send("Only REST requests allowed");
        return;
    }
    var origin = request.get('origin');
    var domain = nconf.get("server:workdomain");

    next();

  /*  if (origin) {
        var exp = /^http(s)*:\/\/(core|login|webgold|titter|storage)\.wrioos\.com(\/)*$/g;
        if (origin.matches(exp)) {
            next();
        }
    } else {
        response.status(403).send("Forbidden");
    }*/


}