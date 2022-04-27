const Router = require('koa-router');

const {renderSignup, signupPostAPI} = require('../controllers/signup');

let signup_router = new Router();
signup_router.get('signup', renderSignup)
.post('api/signup-post', signupPostAPI)

module.exports = signup_router;
