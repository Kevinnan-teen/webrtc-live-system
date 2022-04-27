const Router = require('koa-router');

const {signoutGETAPI} = require('../controllers/signout');

let signout_router = new Router();
signout_router.get('api/signout', signoutGETAPI);

module.exports = signout_router;
