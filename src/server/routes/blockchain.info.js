const {Router} = require('express');
const verifyMiddleware = require('../utils/recaptcha.js');
const {callback_handler, payment_history, request_payment, request_presale, get_gap} = require('../controllers/blockchain.info.js');
const {loginWithSessionId,getLoggedInUser,authS2S,wrioAdmin,wrap,restOnly,wrioAuth} = require('wriocommon').login;
const db = require('wriocommon').db.getInstance();
const {dumpError} = require('wriocommon').utils;
const router = Router();

const useOnlyInProduction = (middleware) => {
    const isInTest = typeof global.it === 'function';
    return isInTest? (request,response,next) => next() : middleware;
};
// /api/blockchain/ routes

router.get('/callback',callback_handler);
router.get('/payment_history', restOnly, wrioAuth, wrap(payment_history));
// disable request now, just accept prepayments
//router.post('/request_payment', restOnly, wrioAuth, request_payment);
router.post('/request_presale', restOnly, useOnlyInProduction(verifyMiddleware), request_presale);
router.get('/get_gap', restOnly, wrioAdmin, get_gap);


module.exports = router;