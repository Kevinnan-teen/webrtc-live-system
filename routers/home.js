const Router = require('koa-router');

const {renderIndex, roomInfoGetAPI} = require('../controllers/home');

//主路由
let home = new Router();
home.get('/', renderIndex)
.get('api/roomInfo-get', roomInfoGetAPI)


module.exports = home;
