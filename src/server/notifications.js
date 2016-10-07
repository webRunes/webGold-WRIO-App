/**
 * Created by michbil on 05.10.16.
 */

import io from 'socket.io';
import nconf from './wrio_nconf';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import {login as loginImp} from 'wriocommon';
let {wrioAuth} = loginImp;

var app = null;
var sock = null;

const DOMAIN = nconf.get("db:workdomain");

export default function setupIO(expressApp,db) {

    const SessionStore = MongoStore(session);
    const cookie_secret = nconf.get("server:cookiesecret");
    const sessionStore = new SessionStore({db: db});
    const sessionMiddleware = session(
        {

            secret: cookie_secret,
            saveUninitialized: true,
            store: sessionStore,
            resave: true,
            cookie: {
                secure: false,
                domain: DOMAIN,
                maxAge: 1000 * 60 * 60 * 24 * 30
            },
            key: 'sid'
        }
    );


    app = expressApp;
    sock = io(app).use((socket, next) => {
        // Wrap the express middleware
        sessionMiddleware(socket.request, {}, next);
    })
        /*
        .use(function(request, response, next) {

        console.log(request);
        var host = request.get('origin');
        if (host == undefined) host = "";

        var domain = nconf.get("server:workdomain");

        domain = domain.replace(/\./g,'\\.')+'$';
        logger.log('silly',domain);

        if (host.match(new RegExp(domain,'m'))) {
            response.setHeader('Access-Control-Allow-Origin', host);
            logger.log("debug","Allowing CORS for webrunes domains");
        } else {
            logger.log("debug",'host not match');
        }

        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        response.setHeader('Access-Control-Allow-Credentials', true);
        next();
    })*/
        .on("connection", function(socket){
            var userId = socket.request.session.passport.user;
            console.log("Your User ID is", userId);
        });
}
