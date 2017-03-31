/**
 * Created by michbil on 02.05.16.
 */

import express from 'express';
import bodyParser from 'body-parser';
import nconf from 'nconf';
import path from 'path';
import MongoStore from 'connect-mongo';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import wrio_app from './wrio_app.js';

export default function initserv(app,db) {

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

//For app pages
    app.set('view engine', 'ejs');
//app.use(express.static(path.join(TEMPLATE_PATH, '/')));

    const DOMAIN = nconf.get("db:workdomain");

    var SessionStore = MongoStore(session);
    var cookie_secret = nconf.get("server:cookiesecret");
    app.use(cookieParser(cookie_secret));
    var sessionStore = new SessionStore({db: db});
    app.use(session(
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
    ));

    wrio_app(app);

    return app;

}

