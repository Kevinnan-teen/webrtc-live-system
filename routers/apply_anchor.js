const Router = require('koa-router');

const {applyanchorRender, applyRoomPostAPI} = require('../controllers/apply_anchor');

let apply_anchor_router = new Router();
apply_anchor_router.get('apply_anchor', applyanchorRender)
.post('api/applyRoom-post', applyRoomPostAPI)
module.exports = apply_anchor_router;
