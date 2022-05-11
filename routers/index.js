const Router = require('koa-router');

const home = require('./home');
const signin_router = require('./signin');
const signup_router = require('./signup');
const signout_router = require('./signout');
const profile_router = require('./profile');
const apply_anchor_router = require('./apply_anchor');
const publish_webrtc_router = require('./publish_webrtc');
const room = require('./room');


//装载所有子路由
let router = new Router();
router.use('/', home.routes(), home.allowedMethods());
router.use('/', signin_router.routes(), signin_router.allowedMethods());
router.use('/', signup_router.routes(), signup_router.allowedMethods());
router.use('/', signout_router.routes(), signout_router.allowedMethods());
router.use('/', profile_router.routes(), profile_router.allowedMethods());
router.use('/', apply_anchor_router.routes(), apply_anchor_router.allowedMethods());
router.use('/', publish_webrtc_router.routes(), publish_webrtc_router.allowedMethods());
router.use('/', room.routes(), room.allowedMethods());

module.exports = router;
