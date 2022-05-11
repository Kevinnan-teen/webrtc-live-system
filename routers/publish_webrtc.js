const Router = require('koa-router');

const {renderPublishWebrtc} = require('../controllers/publish_webrtc');

//webrtc 推流页面路由
let publish_webrtc_router = new Router();
publish_webrtc_router.get('publish_webrtc', renderPublishWebrtc)

module.exports = publish_webrtc_router;
