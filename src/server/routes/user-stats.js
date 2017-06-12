/**
 *  /api/user/* routes
 */


const {Router} = require('express');
const {loginWithSessionId,getLoggedInUser,authS2S,wrioAdmin,wrap,restOnly,wrioAuth} = require('wriocommon').login;
const {prepayments,donations} = require('../controllers/user-stats.js');

const router = Router();
router.get('/prepayments', restOnly, wrioAuth, wrap(prepayments));
router.get('/donations', restOnly, wrioAuth, wrap(donations));

module.exports = router;