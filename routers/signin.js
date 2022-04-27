const Router = require('koa-router');

const {renderSignin, signinPostAPI} = require('../controllers/signin');

let signin_router = new Router();
signin_router.get('signin', renderSignin)
.post('api/signin-post', signinPostAPI)

module.exports = signin_router;
