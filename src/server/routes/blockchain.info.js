import {Router} from 'express';
import verifyMiddleware from '../utils/recaptcha.js';
import {callback_handler, payment_history, request_payment, request_presale, get_gap} from "../controllers/blockchain.info.js";
import {login as loginImp} from '../common'; let {loginWithSessionId,getLoggedInUser,authS2S,wrioAdmin,wrap,wrioAuth,restOnly} = loginImp;
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


export default router;