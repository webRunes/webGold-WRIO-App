import {dumpError} from './utils/utils.js';
import {init} from './utils/db.js';
import db from './utils/db.js';
import {loginWithSessionId,wrioAuth,wrap,authS2S,wrioAdmin,restOnly} from './login';
import app from './server/wrio_app.js';
import initserv from './server/initserv.js';

exports.utils = {
    dumpError: dumpError
};
exports.db = {
    db: db,
    init: init
};
exports.login = {
    loginWithSessionId:loginWithSessionId,
    wrioAuth:wrioAuth,
    authS2S:authS2S,
    wrap: wrap,
    wrioAdmin:wrioAdmin,
    restOnly:restOnly
};
exports.wrio_app = app;
exports.server = {
    initserv: initserv
};