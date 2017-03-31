/**
 *  /api/user/* routes
 */


import {Router} from 'express';
import {login as loginImp} from '../common'; let {loginWithSessionId,getLoggedInUser,authS2S,wrioAdmin,wrap,wrioAuth,restOnly} = loginImp;
import {prepayments,donations} from '../controllers/user-stats.js';

const router = Router();
router.get('/prepayments', restOnly, wrioAuth, wrap(prepayments));
router.get('/donations', restOnly, wrioAuth, wrap(donations));

export default router;